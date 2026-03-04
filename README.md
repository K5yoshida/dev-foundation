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
| `templates/memory/constitution.md` | 不変原則10条（全プロジェクト共通） |
| `templates/specs/README.md` | Spec-Driven ワークフロー + テンプレート3種 |
| `templates/tasks/lessons.md` | ミスと学習の記録フォーマット |
| `templates/.claude/hooks/check-code-quality.sh` | console.log / any型 / .env 書き込みブロック |
| `templates/.claude/hooks/stop-reminder.sh` | IMPLEMENTATION_STATUS 更新リマインダー |
| `templates/.husky/pre-commit` | コミット前の自動lint |
| `templates/.husky/commit-msg` | コミットメッセージ検証 |
| `templates/commitlint.config.js` | コミットメッセージルール |

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
├── memory/constitution.md    ← 10の不変原則
├── specs/README.md           ← specify → plan → tasks フロー
├── tasks/lessons.md          ← ミス記録 → 再発防止
├── .claude/hooks/            ← AI の書き込みを自動チェック
├── .husky/                   ← git commit 時の自動チェック
└── commitlint.config.js      ← コミットメッセージ規約

setup.md                      ← AI が読んで実行する9ステップ手順
```

### 品質が自動で守られる仕組み

| タイミング | チェック | 仕組み |
|-----------|---------|--------|
| AI がコードを書く瞬間 | console.log, any型, .env | Claude Code Hooks |
| git commit 時 | ESLint + Prettier | Husky + lint-staged |
| git commit 時 | メッセージ形式 | commitlint |
| セッション終了時 | 進捗更新忘れ | Stop Hook |

---

## ライセンス

MIT
