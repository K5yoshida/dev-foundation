#!/usr/bin/env bash
# ============================================================================
# Claude Ops Framework: Code Review Hook
# ============================================================================
#
# 目的: L1 操作前に自動で Red Team レビューを起動するためのリマインダー hook
#
# 呼び出し元: .claude/settings.local.json の UserPromptSubmit または PreToolUse
# 想定トリガー:
#   - L1 に該当する操作キーワードをユーザープロンプトで検出
#   - マイグレーション系コマンド (supabase db push, alembic upgrade 等)
#   - git push origin main 等のリモート反映
#
# 動作:
#   1. プロンプト内容を解析し、L1 該当操作を検知
#   2. memory/PHASE_STATUS.md から現在 Phase を取得
#   3. Red Team レビュー未実施なら警告を出力 (Claude に中止を促す)
#   4. exit 0 (中止はしない、あくまで通知)
#
# 注意:
#   - 本 hook は通知のみで、ブロックはしない (誤検知防止)
#   - 真の承認フローはプロジェクトオーナーの明示発話 (「OK」「承認」等)
#   - hook はあくまで補助装置
#
# 設定例 (.claude/settings.local.json):
#   {
#     "hooks": {
#       "PreToolUse": [
#         {
#           "matcher": "Bash",
#           "hooks": [
#             { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/claude-code-review.sh" }
#           ]
#         }
#       ]
#     }
#   }
# ============================================================================

set -euo pipefail

# Claude Code が提供する環境変数
PROMPT="${CLAUDE_USER_PROMPT:-}"
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# L1 該当キーワード (プロジェクトごとにカスタマイズ推奨)
L1_KEYWORDS=(
  "supabase db push"
  "alembic upgrade"
  "prisma migrate deploy"
  "rails db:migrate"
  "git push --force"
  "git push origin main"
  "DROP TABLE"
  "DROP COLUMN"
  "TRUNCATE"
  "本番適用"
  "本番反映"
  "マイグレ適用"
)

# 検知フラグ
DETECTED_L1=false
MATCHED_KEYWORD=""

# プロンプトとツール入力の両方を検査
COMBINED_INPUT="$PROMPT $TOOL_INPUT"

for keyword in "${L1_KEYWORDS[@]}"; do
  if echo "$COMBINED_INPUT" | grep -qF "$keyword"; then
    DETECTED_L1=true
    MATCHED_KEYWORD="$keyword"
    break
  fi
done

# L1 検知時のみ警告出力
if [ "$DETECTED_L1" = "true" ]; then
  # 直近の Red Team レビュー記録を確認
  RISK_REGISTER="$PROJECT_DIR/memory/RISK_REGISTER.md"
  RECENT_REVIEW_MARKER="Red Team"

  if [ -f "$RISK_REGISTER" ]; then
    RECENT_REVIEW_COUNT=$(tail -200 "$RISK_REGISTER" 2>/dev/null | grep -c "$RECENT_REVIEW_MARKER" || echo "0")
  else
    RECENT_REVIEW_COUNT="0"
  fi

  cat <<EOF >&2

╔══════════════════════════════════════════════════════════════════╗
║  🔶 Claude Ops Framework: L1 操作検知                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                    ║
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

fi

# 常に exit 0 (hook はブロックしない)
exit 0
