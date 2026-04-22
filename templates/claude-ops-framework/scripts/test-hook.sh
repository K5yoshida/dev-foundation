#!/usr/bin/env bash
# ============================================================================
# Claude Ops Framework: Hook テストスクリプト
# ============================================================================
#
# 使い方:
#   cd /path/to/your-project
#   bash ~/Desktop/dev-foundation/templates/claude-ops-framework/scripts/test-hook.sh
#
# 目的:
#   .claude/hooks/claude-code-review.sh が正しく動作するかを検証。
#   Claude Code 実仕様 (stdin JSON + exit code) に準拠しているか確認。
# ============================================================================

set -u

HOOK_SCRIPT="${1:-.claude/hooks/claude-code-review.sh}"

if [ ! -f "$HOOK_SCRIPT" ]; then
  echo "❌ エラー: $HOOK_SCRIPT が見つかりません"
  echo "   使い方: bash test-hook.sh [hook へのパス]"
  exit 1
fi

if [ ! -x "$HOOK_SCRIPT" ]; then
  echo "❌ エラー: $HOOK_SCRIPT に実行権限がありません"
  echo "   修正: chmod +x $HOOK_SCRIPT"
  exit 1
fi

echo "============================================================================"
echo "  Claude Ops Framework: Hook Test"
echo "============================================================================"
echo ""
echo "  対象: $HOOK_SCRIPT"
echo ""

# テスト環境変数
export CLAUDE_PROJECT_DIR="$(pwd)"

PASSED=0
FAILED=0

# ----------------------------------------------------------------------------
# テストケース実行ヘルパー
# ----------------------------------------------------------------------------
run_test() {
  local name="$1"
  local json_input="$2"
  local should_warn="$3"  # "yes" or "no"

  echo "──── テスト: $name ────"

  local output
  output=$(echo "$json_input" | bash "$HOOK_SCRIPT" 2>&1)
  local exit_code=$?

  # exit code は常に 0 であるべき (通知のみ)
  if [ $exit_code -ne 0 ]; then
    echo "  ❌ FAIL: exit code = $exit_code (期待: 0)"
    FAILED=$((FAILED + 1))
    return
  fi

  # 警告出力の有無を検証
  if [ "$should_warn" = "yes" ]; then
    if echo "$output" | grep -q "L1 操作検知"; then
      echo "  ✅ PASS: 警告が表示された"
      PASSED=$((PASSED + 1))
    else
      echo "  ❌ FAIL: 警告が表示されない (期待: 表示)"
      FAILED=$((FAILED + 1))
    fi
  else
    if echo "$output" | grep -q "L1 操作検知"; then
      echo "  ❌ FAIL: 警告が誤検知された (期待: サイレント)"
      FAILED=$((FAILED + 1))
    else
      echo "  ✅ PASS: サイレント動作"
      PASSED=$((PASSED + 1))
    fi
  fi
}

# ----------------------------------------------------------------------------
# テストケース一覧
# ----------------------------------------------------------------------------

run_test "L1 Bash: supabase db push" \
  '{"tool_name":"Bash","tool_input":{"command":"supabase db push --linked"}}' \
  "yes"

run_test "L1 Bash: git push --force" \
  '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' \
  "yes"

run_test "L1 Bash: DROP TABLE" \
  '{"tool_name":"Bash","tool_input":{"command":"psql -c \"DROP TABLE users\""}}' \
  "yes"

run_test "L1 日本語: 本番適用" \
  '{"tool_name":"Bash","tool_input":{"command":"本番適用を実行する"}}' \
  "yes"

run_test "L1 Write: マイグレファイル作成" \
  '{"tool_name":"Write","tool_input":{"file_path":"supabase/migrations/20260422140000_test.sql","content":"..."}}' \
  "yes"

run_test "通常 Bash: git status" \
  '{"tool_name":"Bash","tool_input":{"command":"git status"}}' \
  "no"

run_test "通常 Bash: npm test" \
  '{"tool_name":"Bash","tool_input":{"command":"npm test"}}' \
  "no"

run_test "通常 Write: README.md" \
  '{"tool_name":"Write","tool_input":{"file_path":"README.md","content":"# Hello"}}' \
  "no"

run_test "通常 Write: .md (非マイグレ)" \
  '{"tool_name":"Write","tool_input":{"file_path":"docs/guide.md","content":"..."}}' \
  "no"

run_test "通常 Edit: コード修正" \
  '{"tool_name":"Edit","tool_input":{"file_path":"src/index.ts","old_string":"a","new_string":"b"}}' \
  "no"

run_test "Read ツール (対象外)" \
  '{"tool_name":"Read","tool_input":{"file_path":"/tmp/anything"}}' \
  "no"

run_test "Glob ツール (対象外)" \
  '{"tool_name":"Glob","tool_input":{"pattern":"*.ts"}}' \
  "no"

# ----------------------------------------------------------------------------
# 結果サマリー
# ----------------------------------------------------------------------------
echo ""
echo "============================================================================"
echo "  結果: $PASSED PASSED / $FAILED FAILED"
echo "============================================================================"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "  ✅ 全テスト PASS - hook は正しく動作しています"
  exit 0
else
  echo ""
  echo "  ❌ $FAILED 件の FAIL があります"
  echo "  hook スクリプトを確認してください: $HOOK_SCRIPT"
  exit 1
fi
