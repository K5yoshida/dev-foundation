#!/usr/bin/env bash
# ============================================================================
# Claude Ops Framework (COF) 初期化スクリプト
# ============================================================================
#
# 使い方:
#   cd ~/Desktop/my-new-project
#   bash ~/Desktop/dev-foundation/templates/claude-ops-framework/scripts/init-cof.sh
#
# 対話形式でプロジェクト情報を入力し、memory/ と .claude/ にテンプレートを展開します。
# ============================================================================

set -euo pipefail

# ----------------------------------------------------------------------------
# 前提確認
# ----------------------------------------------------------------------------
COF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$(pwd)"

echo "============================================================================"
echo "  Claude Ops Framework (COF) 初期化スクリプト"
echo "============================================================================"
echo ""
echo "  COF テンプレート: $COF_DIR"
echo "  展開先 (現在のディレクトリ): $TARGET_DIR"
echo ""

# 既存ファイルの検出 (memory/ が既存の場合のみ確認)
if [ -d "$TARGET_DIR/memory" ] && [ "$(ls -A "$TARGET_DIR/memory" 2>/dev/null)" ]; then
  echo "⚠️  警告: $TARGET_DIR/memory/ が既に存在し、中身があります"
  echo ""
  read -rp "続行しますか? 既存ファイルは上書きされません (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "中止しました。"
    exit 1
  fi
fi

# ----------------------------------------------------------------------------
# プロジェクト情報の入力
# ----------------------------------------------------------------------------
echo ""
echo "--- プロジェクト情報を入力してください ---"
echo ""

read -rp "プロジェクト名 (例: MyNewApp): " PROJECT_NAME
read -rp "プロジェクト目的 (1 行、例: 顧客管理 SaaS の開発): " PROJECT_PURPOSE
read -rp "想定期間 (例: 12週間): " DURATION
read -rp "開始日 (YYYY-MM-DD、デフォルト今日): " START_DATE
START_DATE=${START_DATE:-$(date +%Y-%m-%d)}

echo ""
echo "--- 3 点復唱用の原則を入力してください ---"
echo ""

read -rp "最上位原則 (1 行、例: 正確性 > 速度): " TOP_PRINCIPLE
read -rp "順序原則 (1 行、例: まずバックエンド、フロント後段): " ORDER_PRINCIPLE
read -rp "過去事故の要約 (あれば 1 行、なければ Enter): " PAST_INCIDENT_SUMMARY

echo ""
echo "--- オプション設定 ---"
echo ""

read -rp "memory/ を .gitignore に追加しますか? (推奨 Y / N): " GITIGNORE_MEMORY
GITIGNORE_MEMORY=${GITIGNORE_MEMORY:-Y}

echo ""
echo "--- 入力内容の確認 ---"
echo ""
echo "  プロジェクト名: $PROJECT_NAME"
echo "  目的:          $PROJECT_PURPOSE"
echo "  期間:          $DURATION"
echo "  開始日:        $START_DATE"
echo "  最上位原則:    $TOP_PRINCIPLE"
echo "  順序原則:      $ORDER_PRINCIPLE"
echo "  過去事故:      ${PAST_INCIDENT_SUMMARY:-(なし)}"
echo "  gitignore:     $GITIGNORE_MEMORY"
echo ""
read -rp "この内容で初期化しますか? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "中止しました。"
  exit 1
fi

# ----------------------------------------------------------------------------
# ディレクトリ作成
# ----------------------------------------------------------------------------
echo ""
echo "--- ディレクトリ作成中 ---"

mkdir -p "$TARGET_DIR/memory"
mkdir -p "$TARGET_DIR/memory/daily-self-review"
mkdir -p "$TARGET_DIR/.claude/01_knowledge"

echo "  ✓ memory/"
echo "  ✓ memory/daily-self-review/"
echo "  ✓ .claude/01_knowledge/"

# ----------------------------------------------------------------------------
# テンプレートファイルの展開 (プレースホルダ置換付き)
# ----------------------------------------------------------------------------
echo ""
echo "--- テンプレートファイル展開中 ---"

# sed での置換関数 (macOS / Linux 両対応)
replace_placeholders() {
  local src="$1"
  local dst="$2"

  # macOS の sed は -i '' が必要
  if [ -f "$dst" ]; then
    echo "  ⚠ スキップ (既存): ${dst#$TARGET_DIR/}"
    return
  fi

  sed \
    -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
    -e "s|{{PROJECT_PURPOSE}}|$PROJECT_PURPOSE|g" \
    -e "s|{{DURATION}}|$DURATION|g" \
    -e "s|{{START_DATE}}|$START_DATE|g" \
    -e "s|{{TOP_PRINCIPLE}}|$TOP_PRINCIPLE|g" \
    -e "s|{{ORDER_PRINCIPLE}}|$ORDER_PRINCIPLE|g" \
    -e "s|{{PAST_INCIDENT_SUMMARY}}|${PAST_INCIDENT_SUMMARY:-(過去事故なし、記入不要)}|g" \
    "$src" > "$dst"

  echo "  ✓ ${dst#$TARGET_DIR/}"
}

# memory/ 配下
replace_placeholders "$COF_DIR/project-root/memory/MEMORY.md" "$TARGET_DIR/memory/MEMORY.md"
replace_placeholders "$COF_DIR/project-root/memory/project-ops-master-plan.md" "$TARGET_DIR/memory/project-ops-master-plan.md"
replace_placeholders "$COF_DIR/project-root/memory/SESSION_START.md" "$TARGET_DIR/memory/SESSION_START.md"
replace_placeholders "$COF_DIR/project-root/memory/PHASE_STATUS.md" "$TARGET_DIR/memory/PHASE_STATUS.md"
replace_placeholders "$COF_DIR/project-root/memory/RISK_REGISTER.md" "$TARGET_DIR/memory/RISK_REGISTER.md"
replace_placeholders "$COF_DIR/project-root/memory/feedback_principles.md" "$TARGET_DIR/memory/feedback_principles.md"
replace_placeholders "$COF_DIR/project-root/memory/handoff-template.md" "$TARGET_DIR/memory/handoff-$START_DATE-v1.md"

# .claude/ 配下
replace_placeholders "$COF_DIR/project-root/.claude/01_knowledge/INITIATIVE_STATUS.md" "$TARGET_DIR/.claude/01_knowledge/INITIATIVE_STATUS.md"

# CLAUDE.md 追記サンプルはコピーのみ (手動統合を促す)
if [ ! -f "$TARGET_DIR/.claude/CLAUDE.md.cof-append" ]; then
  cp "$COF_DIR/project-root/.claude/CLAUDE.md.append" "$TARGET_DIR/.claude/CLAUDE.md.cof-append"
  echo "  ✓ .claude/CLAUDE.md.cof-append (手動で既存 CLAUDE.md に統合してください)"
fi

# 過去事故ファイル (入力があれば雛形作成)
if [ -n "$PAST_INCIDENT_SUMMARY" ]; then
  INCIDENT_FILE="$TARGET_DIR/memory/past-incident-initial.md"
  if [ ! -f "$INCIDENT_FILE" ]; then
    cat > "$INCIDENT_FILE" <<EOF
---
name: 過去事故 — $PROJECT_NAME 初期化時記録
description: プロジェクト開始時点で identified されている過去事故・教訓
type: feedback
---
# 【過去事故】 $PROJECT_NAME 初期化時記録

## 事故の概要

> $PAST_INCIDENT_SUMMARY

## 事故の詳細

(ここに実際に起きた状況・原因・影響を詳しく書く)

## 教訓

(事故から導かれるルール・原則を書く)

## 再発防止策

(技術的・運用的にどう防ぐかを書く)
EOF
    echo "  ✓ memory/past-incident-initial.md (詳細を後で追記してください)"
  fi
fi

# ----------------------------------------------------------------------------
# .gitignore 追加
# ----------------------------------------------------------------------------
if [ "$GITIGNORE_MEMORY" = "Y" ] || [ "$GITIGNORE_MEMORY" = "y" ]; then
  GITIGNORE="$TARGET_DIR/.gitignore"
  if ! grep -q "^memory/$" "$GITIGNORE" 2>/dev/null; then
    echo "" >> "$GITIGNORE"
    echo "# Claude Ops Framework: memory contains project knowledge (may include sensitive info)" >> "$GITIGNORE"
    echo "memory/" >> "$GITIGNORE"
    echo "  ✓ .gitignore に memory/ を追加"
  fi
fi

# ----------------------------------------------------------------------------
# 完了メッセージ
# ----------------------------------------------------------------------------
echo ""
echo "============================================================================"
echo "  ✅ Claude Ops Framework 初期化完了"
echo "============================================================================"
echo ""
echo "【次のステップ】"
echo ""
echo "  1. プレースホルダの残り ({{...}}) を実際の値に置換"
echo "     編集対象:"
echo "       - memory/project-ops-master-plan.md (Phase 構成など)"
echo "       - memory/feedback_principles.md (原則の詳細)"
echo "       - memory/PHASE_STATUS.md (Phase 名)"
echo ""
echo "  2. .claude/CLAUDE.md に以下を統合"
echo "       - .claude/CLAUDE.md.cof-append の内容を既存 CLAUDE.md に追記"
echo "       - 不要になったら rm .claude/CLAUDE.md.cof-append"
echo ""
echo "  3. 最初のセッションで Claude に投げるプロンプト:"
echo ""
echo '     「memory/MEMORY.md と memory/SESSION_START.md を読んで、'
echo '      チェックリスト完了後に本日のタスクを提示してください。」'
echo ""
echo "  4. 詳細ガイド:"
echo "       - $COF_DIR/README.md"
echo "       - $COF_DIR/INSTALL.md"
echo "       - $COF_DIR/docs/concepts/"
echo ""
echo "============================================================================"
