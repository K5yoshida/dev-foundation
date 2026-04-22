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

### 導入後の初期化

1. `memory/project-ops-master-plan.md` を開き、プレースホルダ `{{...}}` を実際の値に置換
2. `memory/feedback_principles.md` を開き、原則の詳細を記入
3. `memory/MEMORY.md` の冒頭ポインタを最新 handoff に更新 (初回は雛形のままで OK)
4. `.claude/CLAUDE.md` に以下を追記:
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
