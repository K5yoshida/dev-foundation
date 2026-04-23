#!/usr/bin/env bash
# ============================================================================
# Claude Ops Framework: L1 Detection Hook (PreToolUse)
# ============================================================================
#
# 目的: L1 該当操作を自動検知し、Red Team レビューの実施を促すリマインダー
#
# Claude Code 仕様 (公式):
#   - 入力: stdin に JSON で渡される
#     {
#       "session_id": "...",
#       "transcript_path": "...",
#       "cwd": "...",
#       "hook_event_name": "PreToolUse",
#       "tool_name": "Bash" | "Edit" | "Write" | ...,
#       "tool_input": { "command": "...", ... },
#       "tool_use_id": "..."
#     }
#   - 出力: stdout に JSON (任意) + exit code
#     - exit 0: 許可 (通常動作)
#     - exit 2: ブロック (stderr に理由)
#     - JSON 形式で permissionDecision を返すことも可能
#
# 本 hook は通知型: exit 0 で許可しつつ stderr に警告を出すのみ。
# ブロックは誤検知リスクが高いため、あえて行わない。
#
# 環境変数 (Claude Code が提供):
#   - $CLAUDE_PROJECT_DIR: プロジェクトルート
#   - $CLAUDE_PLUGIN_ROOT: プラグインディレクトリ (プラグイン hook の場合)
#
# 設定例 (.claude/settings.local.json):
#   {
#     "hooks": {
#       "PreToolUse": [
#         {
#           "matcher": "Bash",
#           "hooks": [
#             {
#               "type": "command",
#               "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/claude-code-review.sh",
#               "timeout": 5
#             }
#           ]
#         }
#       ]
#     }
#   }
# ============================================================================

set -u  # undefined var はエラー、ただし pipefail は stdin 読み込みで問題になるので外す

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# ----------------------------------------------------------------------------
# 1. stdin から JSON を読み込む
# ----------------------------------------------------------------------------
HOOK_INPUT=$(cat)

# 空入力チェック (hook が手動実行されたとき等)
if [ -z "$HOOK_INPUT" ]; then
  # stdin 空 = 手動テスト。サイレントに終了
  exit 0
fi

# ----------------------------------------------------------------------------
# 2. JSON パース (jq があれば使う、なければ grep フォールバック)
# ----------------------------------------------------------------------------
TOOL_NAME=""
TOOL_COMMAND=""
TOOL_FILE_PATH=""
TOOL_CONTENT=""
TOOL_NEW_STRING=""

if command -v jq >/dev/null 2>&1; then
  # jq がある場合 (推奨パス)
  TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
  TOOL_COMMAND=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)
  TOOL_FILE_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null)
  # Write の content と Edit の new_string も検査対象に (C2 Round 7 対処)
  # これにより DROP TABLE 等の危険 SQL を Edit/Write で書く瞬間も検知できる
  TOOL_CONTENT=$(echo "$HOOK_INPUT" | jq -r '.tool_input.content // ""' 2>/dev/null)
  TOOL_NEW_STRING=$(echo "$HOOK_INPUT" | jq -r '.tool_input.new_string // ""' 2>/dev/null)
else
  # jq が無い場合のフォールバック (grep で簡易パース)
  # 注: jq 推奨、grep フォールバックは最小機能 (command/file_path のみ、content/new_string は未対応)
  echo "⚠️  COF hook: jq 未インストール、L1 検知が限定的 (brew install jq 推奨)" >&2
  TOOL_NAME=$(echo "$HOOK_INPUT" | grep -oE '"tool_name":"[^"]*"' | head -1 | sed 's/"tool_name":"\(.*\)"/\1/')
  TOOL_COMMAND=$(echo "$HOOK_INPUT" | grep -oE '"command":"[^"]*"' | head -1 | sed 's/"command":"\(.*\)"/\1/')
  TOOL_FILE_PATH=$(echo "$HOOK_INPUT" | grep -oE '"file_path":"[^"]*"' | head -1 | sed 's/"file_path":"\(.*\)"/\1/')
fi

# Bash ツール以外は基本的に対象外 (Write/Edit で L1 に該当するケースは稀)
# ただしマイグレファイル作成は Write なので特別扱い
if [ "$TOOL_NAME" != "Bash" ] && [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

# ----------------------------------------------------------------------------
# 3. L1 該当キーワード検知
# ----------------------------------------------------------------------------
# プロジェクトごとにカスタマイズ推奨
L1_KEYWORDS=(
  # DB マイグレーション系
  "supabase db push"
  "supabase migration up"
  "alembic upgrade"
  "prisma migrate deploy"
  "rails db:migrate"
  "knex migrate:latest"
  "typeorm migration:run"
  # Git 破壊系
  "git push --force"
  "git push -f"
  "git push --force-with-lease"
  "git reset --hard"
  # SQL 破壊系
  "DROP TABLE"
  "DROP COLUMN"
  "DROP SCHEMA"
  "DROP DATABASE"
  "TRUNCATE"
  "DELETE FROM"
  # 本番系 (日本語)
  "本番適用"
  "本番反映"
  "マイグレ適用"
  "マイグレーション適用"
  # インフラ破壊系
  "terraform destroy"
  "kubectl delete namespace"
  "aws s3 rm"
  "rm -rf"
)

# Bash コマンド + Write/Edit のファイルパス + content/new_string を検査対象に
# content/new_string を含めることで、Edit で DROP TABLE 等を書く瞬間も検知できる (C2 Round 7 対処)
COMBINED_TEXT="$TOOL_COMMAND $TOOL_FILE_PATH $TOOL_CONTENT $TOOL_NEW_STRING"

DETECTED_L1=false
MATCHED_KEYWORD=""

for keyword in "${L1_KEYWORDS[@]}"; do
  if echo "$COMBINED_TEXT" | grep -qF -- "$keyword"; then
    DETECTED_L1=true
    MATCHED_KEYWORD="$keyword"
    break
  fi
done

# Write/Edit で新規マイグレファイルを作成するケース (特別判定)
if [ "$TOOL_NAME" = "Write" ] && echo "$TOOL_FILE_PATH" | grep -qE "migrations/[0-9]+.*\.sql$"; then
  DETECTED_L1=true
  MATCHED_KEYWORD="新規マイグレファイル作成 ($TOOL_FILE_PATH)"
fi

# ----------------------------------------------------------------------------
# 4. L1 検知時の警告出力 (stderr)
# ----------------------------------------------------------------------------
if [ "$DETECTED_L1" = "true" ]; then
  RISK_REGISTER="$PROJECT_DIR/memory/RISK_REGISTER.md"
  RECENT_REVIEW_COUNT="0"

  if [ -f "$RISK_REGISTER" ]; then
    RECENT_REVIEW_COUNT=$(tail -200 "$RISK_REGISTER" 2>/dev/null | grep -c "Red Team" || echo "0")
  fi

  cat <<EOF >&2

╔══════════════════════════════════════════════════════════════════╗
║  🔶 Claude Ops Framework: L1 操作検知                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ツール: $TOOL_NAME
║  検知キーワード: $MATCHED_KEYWORD
║                                                                    ║
║  L1 操作前のチェックリスト:                                         ║
║    [ ] Red Team 3 並列レビュー実施済み?                             ║
║    [ ] Codex 2 並列レビュー実施済み? (quota 回復時)                 ║
║    [ ] 24h 滞留プロトコル満了? (緊急時スキップ可、明示承認必須)     ║
║    [ ] プロジェクトオーナー個別承認済み? (「OK」等の明示発話)       ║
║    [ ] RISK_REGISTER に D-XXX 実施記録の準備完了?                   ║
║    [ ] 凍結例外マトリクス抵触なし?                                  ║
║                                                                    ║
║  参照:                                                             ║
║    - memory/SESSION_START.md (9 ステップチェックリスト)             ║
║    - docs/concepts/five-level-risk.md (L1 の定義)                  ║
║    - docs/concepts/multi-layer-review.md (レビュー手順)            ║
║                                                                    ║
║  直近 RISK_REGISTER の Red Team 言及: ${RECENT_REVIEW_COUNT} 件
║                                                                    ║
║  ⚠️  チェック未完了なら、このツール呼び出しを中止してください        ║
║     本 hook は通知のみ、ブロックはしません                          ║
║                                                                    ║
╚══════════════════════════════════════════════════════════════════╝

EOF

  # Additional context を stdout に JSON で返す (Claude Code 向け)
  # これにより Claude のコンテキストにチェックリスト情報が追加される
  if command -v jq >/dev/null 2>&1; then
    cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "L1 操作検知: ${MATCHED_KEYWORD}。Red Team レビュー実施済みか、24h滞留満了か、プロジェクトオーナー承認済みかを確認してください。"
  }
}
JSON
  fi
fi

# 常に exit 0 (通知のみ、ブロックしない)
exit 0
