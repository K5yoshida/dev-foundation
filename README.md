# dev-foundation

AI駆動開発のための基盤テンプレート。
新プロジェクトで「Use this template」するだけで、品質自動チェック・マルチエージェント協調・テストファースト開発の仕組みが手に入ります。

---

## 使い方

### 1. テンプレートからリポジトリ作成

GitHub の「Use this template」ボタンで新リポジトリを作成してください。

### 2. AI に setup.md を渡す

```
@setup.md この手順に従って、このプロジェクトの開発基盤をセットアップしてください。
```

Claude Code に `setup.md` を渡すと、9ステップで基盤構築が完了します。

---

## 含まれるもの

### そのままコピーできるファイル（プロジェクト非依存）

| ファイル | 中身 |
|---------|------|
| `templates/.claudeignore` | `.env`ファイルのAI読み取りブロック（セキュリティ対策） |
| `templates/memory/constitution.md` | 不変原則10条（全プロジェクト共通） |
| `templates/memory/CURRENT_CONTEXT.template.md` | 事業の現在地テンプレート（新AIセッションが最初に読むファイル） |
| `templates/specs/README.md` | Spec-Driven ワークフロー + テンプレート3種 |
| `templates/specs/DEPRECATION_GUIDE.md` | Spec状態マーキングガイド（廃止・実装済み・統合・アーカイブ） |
| `templates/tasks/lessons.md` | ミスと学習の記録フォーマット |
| `templates/.claude/rules/DESIGN_SYSTEM.md` | デザインシステムルール（フォント・色・サイズ・余白） |
| `templates/.claude/hooks/check-code-quality.sh` | console.log / any型 / .env 書き込みブロック |
| `templates/.claude/hooks/stop-reminder.sh` | IMPLEMENTATION_STATUS 更新リマインダー |
| `templates/.husky/pre-commit` | コミット前の自動lint |
| `templates/.husky/commit-msg` | コミットメッセージ検証 |
| `templates/commitlint.config.js` | コミットメッセージルール |
| `templates/prompts/` | 21個の開発プロンプトライブラリ（8カテゴリ） |

### プロジェクトごとに生成が必要なファイル

| ファイル | カスタマイズ箇所 |
|---------|----------------|
| `AGENTS.md` | 技術スタック、コマンド、プロジェクト構造 |
| `docs/INDEX.md` | ドキュメント一覧（プロジェクトの docs/ に依存） |
| `.claude/CLAUDE.md` | サービス概要、料金、ルール |
| `.claude/settings.json` | permissions（プロジェクトで使うコマンド） |
| `tasks/todo.md` | 現在のスプリントタスク |
| `package.json` | husky / lint-staged / commitlint の追加 |

生成手順は `setup.md` に記載されています。

---

## 前提条件

- Node.js 18+
- npm
- GitHub CLI (`gh`)
- Claude Code（または AGENTS.md 対応の AI エディタ）

---

## 仕組みの概要

```
templates/
├── memory/constitution.md              ← 10の不変原則
├── memory/CURRENT_CONTEXT.template.md  ← 事業の現在地（セッション再現性）
├── specs/README.md                     ← specify → plan → tasks フロー
├── specs/DEPRECATION_GUIDE.md          ← 廃止specのマーキングルール
├── tasks/lessons.md                    ← ミス記録 → 再発防止
├── .claude/hooks/            ← AI の書き込みを自動チェック
├── .husky/                   ← git commit 時の自動チェック
└── commitlint.config.js      ← コミットメッセージ規約

templates/prompts/            ← 21個の開発プロンプト（投げまくって完成させる）

setup.md                      ← AI が読んで実行する9ステップ手順
```

### 品質が自動で守られる仕組み

| タイミング | チェック | 仕組み |
|-----------|---------|--------|
| プロジェクト読み込み時 | .env秘密情報の読み取りブロック | .claudeignore |
| AI がコードを書く瞬間 | console.log, any型, .env | Claude Code Hooks |
| git commit 時 | ESLint + Prettier | Husky + lint-staged |
| git commit 時 | メッセージ形式 | commitlint |
| セッション終了時 | 進捗更新忘れ | Stop Hook |

---

## プロンプトライブラリ（21個）

「どれかを投げまくれば、プロダクトが完成する」プロンプト集。
詳細は [`templates/prompts/README.md`](templates/prompts/README.md) を参照。

| カテゴリ | プロンプト数 | 内容 |
|---------|------------|------|
| 01-spec | 3 | 設計書の作成・レビュー・矛盾検出 |
| 02-plan | 2 | 実装計画・DBマイグレーション |
| 03-build | 2 | 機能実装・テスト骨格 |
| 04-quality | 6 | 品質スキャン・レビュー・E2E・打鍵・セキュリティ・リリース |
| 05-plumbing | 2 | データフロー・UXフロー |
| 06-polish | 2 | UI磨き込み・コピー/a11y |
| 07-docs | 1 | 設計書同期 |
| 08-ops | 2 | デプロイ・監視 |

---

## 適用事例

### [tokusetu-page](https://github.com/K5yoshida/tokusetu-page)

CVR特化プラットフォーム（Next.js / Supabase / Stripe）で、この基盤を最初に適用したプロジェクトです。

実際にどう使われているかの参考になるファイル:

| ファイル | 見どころ |
|---------|---------|
| [AGENTS.md](https://github.com/K5yoshida/tokusetu-page/blob/main/AGENTS.md) | Claude Code / Codex の役割分担、ハンドオフプロトコル |
| [docs/INDEX.md](https://github.com/K5yoshida/tokusetu-page/blob/main/docs/INDEX.md) | 48個のドキュメントを5層に分類 + 5つの読み順パス |
| [specs/README.md](https://github.com/K5yoshida/tokusetu-page/blob/main/specs/README.md) | Phase 0 テストスケルトン付きの仕様テンプレート |
| [.claude/hooks/](https://github.com/K5yoshida/tokusetu-page/tree/main/.claude/hooks) | console.log / any型 の自動ブロックが実稼働中 |
| [.claude/IMPLEMENTATION_STATUS.md](https://github.com/K5yoshida/tokusetu-page/blob/main/.claude/IMPLEMENTATION_STATUS.md) | v2完了の5つの客観基準を定義 |

> テンプレートの各ファイルが実プロジェクトでどうカスタマイズされるかを見ると、setup.md の手順がより具体的にイメージできます。

---

## ライセンス

MIT
