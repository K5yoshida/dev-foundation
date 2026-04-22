# セッション間記憶システム

## 問題

AI は 1 セッションごとに記憶をリセットする。数週間〜数ヶ月に及ぶ長期プロジェクトで
AI と協働する時、以下が必ず発生する:

- 前回の決定事項を忘れる
- 過去の失敗パターンを繰り返す
- 判断基準がセッションごとに揺らぐ
- 同じ調査を何度も繰り返す

## 解決策: 構造化ドキュメントによる共同管理

COF では `memory/` ディレクトリに**人間と AI が共同で更新する**構造化ドキュメントを置く。
AI が毎セッション冒頭で読み、人間も読めば意味がわかる普通のマークダウンで書く。

## ファイル階層

```
memory/
├── MEMORY.md                          # トップインデックス (毎セッション自動読込)
│   └── 各ファイルへのポインタのみ、詳細は書かない
│
├── project-ops-master-plan.md         # プロジェクト憲法
│   └── 原則・Phase 構成・凍結施策・失敗定義
│
├── SESSION_START.md                   # 開始時チェックリスト
│   └── 9 ステップの手順
│
├── PHASE_STATUS.md                    # 現在地マップ
│   └── 現在 Phase・進捗%・Active Agents
│
├── RISK_REGISTER.md                   # リスク台帳
│   └── Critical/High リスク履歴・D-XXX 実施記録
│
├── feedback_principles.md             # N 大原則
│   └── 最上位・順序・個別原則の詳細
│
├── past-incident-*.md                 # 過去事故記録 (あれば)
│   └── 実体験と教訓
│
├── handoff-YYYY-MM-DD-vN.md           # 日次引き継ぎ
│   └── Part 1: プロンプト / Part 2: Claude 向け思考手順
│
└── daily-self-review/                 # 日次自己レビュー
    └── YYYY-MM-DD.md (8 問 Q&A)
```

## 読み込み順序 (SESSION_START.md で強制)

```
1. MEMORY.md (自動読込)
   ↓
2. past-incident-*.md (あれば)
   ↓
3. feedback_principles.md
   ↓
4. project-ops-master-plan.md
   ↓
5. SESSION_START.md (本ファイル)
   ↓
6. PHASE_STATUS.md
   ↓
7. RISK_REGISTER.md
   ↓
8. 最新 handoff-YYYY-MM-DD.md
```

この順序で読むことで、AI は**原則 → プロジェクト全体 → 現在地 → 本日のタスク**の順に
コンテキストを構築する。

## 各ファイルの更新タイミング

| ファイル | 更新タイミング | 更新者 |
|---|---|---|
| MEMORY.md | handoff 作成時にポインタ更新 | AI (終了時) |
| project-ops-master-plan.md | 月 1 回のレビュー、Phase 完了時 | 人間 (AI 提案) |
| SESSION_START.md | プロジェクト固有チェックを追加する時 | AI (人間確認) |
| PHASE_STATUS.md | Phase 進捗が変わるたび、セッション終了時 | AI |
| RISK_REGISTER.md | リスク検出時、対処完了時、D-XXX 実施時 | AI |
| feedback_principles.md | 新しい原則が確立した時 | 人間 |
| past-incident-*.md | 新しい事故・教訓が発生した時 | 人間 |
| handoff-YYYY-MM-DD.md | セッション終了時 | AI |
| daily-self-review/ | セッション終了時 | AI |

## アンチパターン

### ❌ AI に自由に memory を書かせる

AI は「書きやすい形」で書くため、構造が崩れて人間が読めなくなる。
テンプレートを用意し、AI はテンプレートに従って書く。

### ❌ MEMORY.md に詳細を書く

毎セッション自動読込されるため、肥大化すると context window を圧迫。
200 行を超えると truncate される (Claude Code の仕様)。
詳細は個別ファイルへのリンクのみに留める。

### ❌ handoff を上書きする

過去の handoff は履歴として残す (`handoff-YYYY-MM-DD-vN.md` と日付 + バージョンで命名)。
最新 1 つだけ MEMORY.md が指せば十分。

### ❌ 複数プロジェクトで memory を共有

プロジェクト固有の過去事故・凍結施策が他プロジェクトに誤適用される。
必ずプロジェクトごとに分ける。

## グローバル vs プロジェクトごと

| 配置 | メリット | デメリット |
|---|---|---|
| グローバル (~/.claude/) | 全プロジェクトで共通知識を持てる | プロジェクト固有知識が混在、CLAUDE.md 階層が崩れる |
| **プロジェクトごと (推奨)** | 汚染なし、git 管理可能、プロジェクト削除時に綺麗 | 新規プロジェクトで初期化が必要 |

COF は**プロジェクトごと**を推奨。テンプレートから複製することで初期化コストを最小化する。

## 記憶の寿命

- **短期記憶 (handoff)**: 1-3 セッション。古くなったら archive へ
- **中期記憶 (PHASE_STATUS, RISK_REGISTER)**: プロジェクト終了まで
- **長期記憶 (master-plan, past-incident, feedback_principles)**: 組織資産として永続

プロジェクト終了後も `past-incident` と `feedback_principles` は次プロジェクトに引き継ぐ価値がある。
