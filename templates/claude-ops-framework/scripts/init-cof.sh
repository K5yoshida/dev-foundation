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
# sed エスケープヘルパー
# ----------------------------------------------------------------------------
# ユーザー入力を sed の置換右辺として安全に渡せるようにエスケープ。
# デリミタ `|` / 後方参照 `&` / エスケープ `\` / 改行を全て無害化する。
escape_sed() {
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g' | tr '\n' ' '
}

# 必須入力バリデーション (空白のみ/空文字を拒否)
require_non_blank() {
  local value="$1"
  local label="$2"
  # 空白以外の文字が 1 つでもあれば OK
  if [[ -z "${value// /}" ]]; then
    echo "❌ エラー: $label は必須です (空白のみは不可)"
    return 1
  fi
  return 0
}

# ----------------------------------------------------------------------------
# 前提確認
# ----------------------------------------------------------------------------
COF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$(pwd)"

# ロールバック用バックアップディレクトリ
BACKUP_DIR=""
CREATED_FILES=()

# 失敗時のクリーンアップ (H2 対処)
cleanup_on_failure() {
  local exit_code=$?
  if [ $exit_code -ne 0 ] && [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
    echo ""
    echo "⚠️  スクリプトが失敗しました。部分的に生成されたファイルを削除します..."
    for f in "${CREATED_FILES[@]}"; do
      [ -f "$f" ] && rm -f "$f"
    done
    echo "   バックアップは $BACKUP_DIR に保持されています。"
    echo "   手動復元する場合: cp -r \"$BACKUP_DIR\"/* ."
  fi
  exit $exit_code
}
trap cleanup_on_failure ERR INT TERM

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

# 必須項目入力 (空ブランクは再入力要求、C1+U2 対処)
while true; do
  read -rp "プロジェクト名 (例: MyNewApp): " PROJECT_NAME
  require_non_blank "$PROJECT_NAME" "プロジェクト名" && break
done

while true; do
  read -rp "プロジェクト目的 (1 行、例: 顧客管理 SaaS の開発): " PROJECT_PURPOSE
  require_non_blank "$PROJECT_PURPOSE" "プロジェクト目的" && break
done

while true; do
  read -rp "想定期間 (例: 12週間): " DURATION
  require_non_blank "$DURATION" "想定期間" && break
done

read -rp "開始日 (YYYY-MM-DD、デフォルト今日): " START_DATE
START_DATE=${START_DATE:-$(date +%Y-%m-%d)}

# 日付フォーマット簡易検証
if ! [[ "$START_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "❌ エラー: 開始日は YYYY-MM-DD 形式で入力してください (例: 2026-04-22)"
  exit 1
fi

read -rp "プロジェクトオーナー名 (例: 吉田 / 山田様、空白で 'プロジェクトオーナー'): " PROJECT_OWNER
PROJECT_OWNER=${PROJECT_OWNER:-プロジェクトオーナー}

echo ""
echo "--- 3 点復唱用の原則を入力してください ---"
echo ""

while true; do
  read -rp "最上位原則 (1 行、例: 正確性 > 速度): " TOP_PRINCIPLE
  require_non_blank "$TOP_PRINCIPLE" "最上位原則" && break
done

while true; do
  read -rp "順序原則 (1 行、例: まずバックエンド、フロント後段): " ORDER_PRINCIPLE
  require_non_blank "$ORDER_PRINCIPLE" "順序原則" && break
done

read -rp "過去事故の要約 (あれば 1 行、なければ Enter): " PAST_INCIDENT_SUMMARY

echo ""
echo "--- オプション設定 ---"
echo ""

read -rp "memory/ を .gitignore に追加しますか? (推奨 Y / N): " GITIGNORE_MEMORY
GITIGNORE_MEMORY=${GITIGNORE_MEMORY:-Y}

echo ""
echo "--- 入力内容の確認 ---"
echo ""
echo "  プロジェクト名:     $PROJECT_NAME"
echo "  オーナー名:        $PROJECT_OWNER"
echo "  目的:              $PROJECT_PURPOSE"
echo "  期間:              $DURATION"
echo "  開始日:            $START_DATE"
echo "  最上位原則:        $TOP_PRINCIPLE"
echo "  順序原則:          $ORDER_PRINCIPLE"
echo "  過去事故:          ${PAST_INCIDENT_SUMMARY:-(なし)}"
echo "  gitignore:         $GITIGNORE_MEMORY"
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

# バックアップディレクトリ作成 (ロールバック用、H2 対処)
BACKUP_DIR="$TARGET_DIR/.cof-backup-$(date +%Y%m%d%H%M%S)"
if [ -d "$TARGET_DIR/memory" ] || [ -d "$TARGET_DIR/.claude" ]; then
  mkdir -p "$BACKUP_DIR"
  [ -d "$TARGET_DIR/memory" ] && cp -r "$TARGET_DIR/memory" "$BACKUP_DIR/" 2>/dev/null || true
  [ -d "$TARGET_DIR/.claude" ] && cp -r "$TARGET_DIR/.claude" "$BACKUP_DIR/" 2>/dev/null || true
  echo "  📦 バックアップ作成: $BACKUP_DIR"
fi

mkdir -p "$TARGET_DIR/memory"
mkdir -p "$TARGET_DIR/memory/daily-self-review"
mkdir -p "$TARGET_DIR/.claude/01_knowledge"
mkdir -p "$TARGET_DIR/.claude/hooks"

echo "  ✓ memory/"
echo "  ✓ memory/daily-self-review/"
echo "  ✓ .claude/01_knowledge/"
echo "  ✓ .claude/hooks/"

# ----------------------------------------------------------------------------
# テンプレートファイルの展開 (プレースホルダ置換付き、sed エスケープ済)
# ----------------------------------------------------------------------------
echo ""
echo "--- テンプレートファイル展開中 ---"

# 入力値を全て sed 安全にエスケープ (C1 対処)
PROJECT_NAME_ESC=$(escape_sed "$PROJECT_NAME")
PROJECT_OWNER_ESC=$(escape_sed "$PROJECT_OWNER")
PROJECT_PURPOSE_ESC=$(escape_sed "$PROJECT_PURPOSE")
DURATION_ESC=$(escape_sed "$DURATION")
START_DATE_ESC=$(escape_sed "$START_DATE")
TOP_PRINCIPLE_ESC=$(escape_sed "$TOP_PRINCIPLE")
ORDER_PRINCIPLE_ESC=$(escape_sed "$ORDER_PRINCIPLE")
PAST_INCIDENT_SUMMARY_ESC=$(escape_sed "${PAST_INCIDENT_SUMMARY:-(過去事故なし、記入不要)}")

# sed での置換関数 (macOS / Linux 両対応)
replace_placeholders() {
  local src="$1"
  local dst="$2"

  if [ -f "$dst" ]; then
    echo "  ⚠ スキップ (既存): ${dst#$TARGET_DIR/}"
    return
  fi

  sed \
    -e "s|{{PROJECT_NAME}}|$PROJECT_NAME_ESC|g" \
    -e "s|{{PROJECT_OWNER}}|$PROJECT_OWNER_ESC|g" \
    -e "s|{{PROJECT_PURPOSE}}|$PROJECT_PURPOSE_ESC|g" \
    -e "s|{{DURATION}}|$DURATION_ESC|g" \
    -e "s|{{START_DATE}}|$START_DATE_ESC|g" \
    -e "s|{{TOP_PRINCIPLE}}|$TOP_PRINCIPLE_ESC|g" \
    -e "s|{{ORDER_PRINCIPLE}}|$ORDER_PRINCIPLE_ESC|g" \
    -e "s|{{PAST_INCIDENT_SUMMARY}}|$PAST_INCIDENT_SUMMARY_ESC|g" \
    "$src" > "$dst"

  CREATED_FILES+=("$dst")  # 失敗時ロールバック用に記録
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

# L1 検知 hook のコピー (実行権限保持)
if [ ! -f "$TARGET_DIR/.claude/hooks/claude-code-review.sh" ]; then
  cp "$COF_DIR/project-root/.claude/hooks/claude-code-review.sh" "$TARGET_DIR/.claude/hooks/claude-code-review.sh"
  chmod +x "$TARGET_DIR/.claude/hooks/claude-code-review.sh"
  echo "  ✓ .claude/hooks/claude-code-review.sh (settings.local.json で有効化してください)"
fi

# settings.local.json サンプル (ユーザーがコピーして使う)
if [ ! -f "$TARGET_DIR/.claude/settings.local.json.example" ]; then
  cp "$COF_DIR/project-root/.claude/settings.local.json.example" "$TARGET_DIR/.claude/settings.local.json.example"
  echo "  ✓ .claude/settings.local.json.example (cp で有効化可)"
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
