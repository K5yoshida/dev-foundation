# Claude Ops Framework 導入手順

---

## 新規プロジェクトに導入 (推奨)

### 前提条件

- プロジェクトルートが既に存在する (空でも可)
- git 管理下にある (任意、推奨)
- `.claude/` ディレクトリがあっても問題なし (既存ファイルは上書きしない)

### 手順

```bash
cd ~/Desktop/my-new-project
bash ~/Desktop/dev-foundation/templates/claude-ops-framework/scripts/init-cof.sh
```

スクリプトは対話形式で以下を質問します:

| 質問 | 入力例 | 用途 |
|---|---|---|
| プロジェクト名 | `MyNewApp` | 各テンプレ内の `{{PROJECT_NAME}}` 置換 |
| プロジェクト目的 (1 行) | `顧客管理 SaaS の開発` | master-plan の冒頭 |
| 想定期間 | `12週間` | スケジュール見積 |
| 最上位原則 (1 行) | `正確性 > 速度` | 3 点復唱用 |
| 順序原則 (1 行) | `まずバックエンド、フロント後段` | 3 点復唱用 |
| 過去事故の有無 | `あり: 〇〇で顧客データ破損` or `なし` | 事故記録ファイル |
| memory ディレクトリを gitignore するか | `Y` (推奨) / `N` | 機密度判断 |

入力後、以下が展開されます:

```
.claude/
└── 01_knowledge/
    └── INITIATIVE_STATUS.md   # 現在地マップ (空のテンプレ)

memory/
├── MEMORY.md                  # トップインデックス
├── project-ops-master-plan.md # プロジェクト憲法 (入力値で初期化)
├── SESSION_START.md           # 開始時チェックリスト
├── PHASE_STATUS.md            # Phase 進捗 (Phase 0 のみで開始)
├── RISK_REGISTER.md           # リスク台帳 (空)
├── feedback_principles.md     # 原則記入用 (入力値で初期化)
└── past-incident-*.md         # 過去事故記録 (入力があれば)
```

### 導入後の初期化 (手動記入必須のプレースホルダ)

init-cof.sh は 8 個のプレースホルダ (`{{PROJECT_NAME}}`, `{{PROJECT_OWNER}}`, `{{PROJECT_PURPOSE}}`,
`{{DURATION}}`, `{{START_DATE}}`, `{{TOP_PRINCIPLE}}`, `{{ORDER_PRINCIPLE}}`, `{{PAST_INCIDENT_SUMMARY}}`)
のみ自動置換します。

**残りの ~75 種類のプレースホルダは `###_TODO: XXX ###` マーカーで目立つ形で残ります。**
以下の手順で手動記入してください:

#### ステップ 1: TODO マーカーを全検索

```bash
# 展開されたファイル内の未置換プレースホルダを一覧表示
grep -rn "###_TODO:" memory/ .claude/
```

マーカーが残っているファイルと行数が全てリストされます。初期導入時は ~75 件前後です。

#### ステップ 2: ファイルごとに記入 (推奨順序)

| # | ファイル | 記入内容 | 優先度 |
|---|---|---|---|
| 1 | `memory/feedback_principles.md` | 原則 1-3 の詳細、過去事故の詳細 | 🔴 必須 |
| 2 | `memory/project-ops-master-plan.md` | Phase 構成、凍結施策、失敗定義 | 🔴 必須 |
| 3 | `memory/PHASE_STATUS.md` | Phase 名、最初のタスク 2 件 | 🔴 必須 |
| 4 | `memory/RISK_REGISTER.md` | 初期リスク、失敗パターン | 🟡 推奨 |
| 5 | `memory/SESSION_START.md` | プロジェクト固有 fact-check コマンド | 🟡 推奨 |
| 6 | `.claude/01_knowledge/INITIATIVE_STATUS.md` | プロジェクトの起点・ゴール | 🟡 推奨 |
| 7 | `memory/handoff-YYYY-MM-DD-v1.md` | 次セッションのタスク | 🟢 初回スキップ可 |

#### ステップ 3: 記入完了の確認

```bash
# TODO マーカーがゼロになったか確認
grep -rn "###_TODO:" memory/ .claude/ | wc -l
# 期待結果: 0

# ゼロでない場合、未記入のプレースホルダ一覧を再表示
grep -rn "###_TODO:" memory/ .claude/
```

#### ステップ 4: L1 検知 hook の有効化 (任意、推奨)

L1 操作を自動検知して Red Team レビューを促す hook を有効化:

**A. サンプルファイルをコピー (最速)**:

```bash
# init-cof.sh 実行後、.claude/settings.local.json.example が展開されているはず
cp .claude/settings.local.json.example .claude/settings.local.json
```

**B. 既存の settings.local.json に手動追加**:

既に `.claude/settings.local.json` がある場合、以下の `hooks` セクションを統合:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/claude-code-review.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/claude-code-review.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/claude-code-review.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**重要な仕様**:
- hook は stdin から JSON (`tool_name`, `tool_input` 等) を受け取る
- 環境変数 `$CLAUDE_PROJECT_DIR` はプロジェクトルートを指す
- `timeout: 5` で 5 秒以内に完了しない場合は自動スキップ
- `jq` がインストールされていれば使う (Homebrew: `brew install jq`)、無ければ grep で簡易パース

**動作確認**:

```bash
# L1 キーワードを含む入力で hook をテスト
echo '{"tool_name":"Bash","tool_input":{"command":"supabase db push"}}' | \
  bash .claude/hooks/claude-code-review.sh

# 期待結果: stderr にチェックリスト表示、exit 0
```

**プロジェクト固有のキーワード追加**:
`.claude/hooks/claude-code-review.sh` の `L1_KEYWORDS` 配列を編集し、プロジェクト
固有のコマンド・文言を追加してください。

#### ステップ 5: CLAUDE.md への統合

1. `memory/MEMORY.md` の冒頭ポインタを最新 handoff に更新 (初回は雛形のままで OK)
2. `.claude/CLAUDE.md` に以下を追記:
   ```md
   ## セッション開始時の必須確認

   memory/SESSION_START.md のチェックリスト完了必須。
   詳細: `.claude/01_knowledge/INITIATIVE_STATUS.md`
   ```
5. 最初のセッションで Claude に以下を投げる:
   ```
   memory/MEMORY.md と memory/SESSION_START.md を読んで、
   チェックリスト完了後に本日のタスクを提示してください。
   ```

---

## 既存プロジェクトへの追加

既に `memory/` がある場合、以下を手動マージしてください:

### ステップ 1: バックアップ

```bash
cp -r memory memory.backup.$(date +%Y%m%d)
```

### ステップ 2: 既存ファイルと COF テンプレの比較

| 既存 | COF テンプレ | マージ方針 |
|---|---|---|
| `MEMORY.md` あり | あり | 既存を優先、COF の構造を追記 |
| `PHASE_STATUS.md` なし | あり | COF をそのままコピー |
| `RISK_REGISTER.md` なし | あり | COF をそのままコピー |
| `handoff-*.md` あり | `handoff-template.md` | 既存を優先、テンプレは雛形として残す |

### ステップ 3: CLAUDE.md 統合

既存の `CLAUDE.md` に以下セクションが**ない場合のみ**追記:

- セッション開始時の必須確認 (memory/SESSION_START.md 参照)
- 5 段階リスク分類
- 破壊的操作の確認必須

COF の [docs/concepts/](docs/concepts/) を参考に、プロジェクト固有の表現で書き直すことを推奨。

---

## 既存の dev-foundation テンプレートとの併用

既に `dev-foundation/templates/.claude/constitution.md` 等を使っている場合:

- **併用可能**: COF は `memory/` と `.claude/01_knowledge/INITIATIVE_STATUS.md` のみに手を加えるため、既存の `.claude/constitution.md` や `.claude/02_specs/` と衝突しない
- **推奨統合**: `.claude/CLAUDE.md` の「ルール」セクションに両方への参照を記載

```md
## ルール

### 設計・実装
→ `.claude/constitution.md` (dev-foundation)
→ `.claude/02_specs/README.md` (dev-foundation)

### 長期プロジェクト運用
→ `memory/SESSION_START.md` (claude-ops-framework)
→ `memory/project-ops-master-plan.md` (claude-ops-framework)
```

---

## アンインストール

```bash
# 注意: memory/ に蓄積された知識が失われます。必要なら事前に backup を。
rm -rf memory
rm -f .claude/01_knowledge/INITIATIVE_STATUS.md
# .claude/CLAUDE.md の COF 参照を手動削除
```

---

## トラブルシューティング

### Q. init-cof.sh 実行時に「既にファイルが存在します」と出る

A. 既存ファイルを上書きしません。`--force` オプションで強制上書き可能ですが、
事前にバックアップ推奨。

### Q. Claude が SESSION_START.md を読んでくれない

A. プロジェクトの `CLAUDE.md` に「セッション開始時に必ず memory/SESSION_START.md を読む」
と明記してください。CLAUDE.md は Claude Code が自動で毎セッション読むため、ここに指示を
書くのが最も確実。

### Q. handoff ファイルが溜まりすぎて管理できない

A. 7 日以上前の handoff は `memory/archive/` に移動してください。MEMORY.md の
ポインタは最新 handoff のみを指せば十分。
