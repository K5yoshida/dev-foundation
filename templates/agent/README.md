# Agent Orchestrator

> **Claude Code × OpenAI Codex を1コマンドで自動連携**

Claude（設計・レビュー担当）と Codex（実装担当）が自動でバトンリレーしながら開発を進める仕組みです。

## セットアップ

### 1. 依存インストール

```bash
cd .agent && npm install
```

### 2. API キー設定

```bash
export ANTHROPIC_API_KEY="sk-ant-xxx"   # Claude Agent SDK 用
export OPENAI_API_KEY="sk-xxx"          # OpenAI Codex 用
```

### 3. Codex CLI のインストール（未インストールの場合）

```bash
npm install -g @openai/codex
```

## 使い方（ショートカット）

`.agent/` ディレクトリ内で `npm run` を使えば、短いコマンドで実行できます。

```bash
cd .agent
```

| やりたいこと           | コマンド                           | 意味                                                   |
| ---------------------- | ---------------------------------- | ------------------------------------------------------ |
| **完全自動**           | `npm run auto`                     | nextをループで回し続ける（最大10回 or 予算到達で停止） |
| **完全自動（空撃ち）** | `npm run auto:dry`                 | autoのドライラン版。何が実行されるか確認だけ           |
| **「次は？」1回だけ**  | `npm run next`                     | プロジェクト状態を読み取り、最適な1タスクを実行        |
| **ドライラン**         | `npm run dry`                      | nextのドライラン版。判定結果だけ確認                   |
| **新機能フル実行**     | `npm run new -- "モーダル直CV"`    | チェーンA: 設計→実装→レビューの全工程                  |
| **リリース前チェック** | `npm run release`                  | チェーンC: セキュリティ→E2E→ビジュアル→デプロイ        |
| **プロダクト思考**     | `npm run think`                    | 確信ログ更新（2週間に1回）                             |
| **チェーン指定**       | `npm run chain:a -- --feature "X"` | チェーンA〜Fを直接指定                                 |

> **`--` の意味**: `npm run` の後に追加の引数を渡すときは `--` を挟みます。
> 例: `npm run new -- "離脱キャプチャ"` → `tsx orchestrate.ts --chain A --feature "離脱キャプチャ"` に変換されます。

### フルコマンド（ショートカットを使わない場合）

プロジェクトルートから直接実行する場合:

```bash
# 「次は？」自動判定
npx tsx .agent/orchestrate.ts next

# タスク指定（自然言語）
npx tsx .agent/orchestrate.ts "バナー表示のレスポンシブ対応を実装して"

# プロンプト直接指定
npx tsx .agent/orchestrate.ts --prompt spec-create --feature "離脱キャプチャ"

# チェーン実行
npx tsx .agent/orchestrate.ts --chain A --feature "モーダル直CV"

# ドライラン
npx tsx .agent/orchestrate.ts --dry-run next

# モデル指定
npx tsx .agent/orchestrate.ts next --claude-model claude-opus-4-6
```

## チェーン一覧

| チェーン | 用途           | フロー                                                                                  |
| -------- | -------------- | --------------------------------------------------------------------------------------- |
| **A**    | 新機能         | conviction → spec → review → plan → db → test-skeleton → build → quality-review → learn |
| **B**    | 週次メンテ     | quality-scan → docs-sync → ux-flow                                                      |
| **C**    | リリース前     | security → e2e → visual → release → deploy                                              |
| **D**    | 設計スプリント | gap-fill → review → create                                                              |
| **E**    | 月次品質       | polish → copy-a11y → visual → monitor                                                   |
| **F**    | プロダクト思考 | conviction → spec → learn                                                               |

## エージェント役割分担

| プロンプトカテゴリ  | 担当                                       |
| ------------------- | ------------------------------------------ |
| 00-think（思考）    | Claude のみ                                |
| 01-spec（設計）     | Claude のみ                                |
| 02-plan（計画）     | Claude のみ                                |
| 03-build（実装）    | Claude 設計 → Codex 実装 → Claude レビュー |
| 04-quality（品質）  | Claude のみ（e2e は Codex 併用）           |
| 05-plumbing（配管） | Claude 分析 → Codex 修正                   |
| 06-polish（磨き）   | Claude 分析 → Codex 修正                   |
| 07-docs（文書）     | Claude のみ                                |
| 08-ops（運用）      | Claude のみ                                |

## 予算管理

`.agent/budget.json` に月ごとの利用状況が記録されます。

```json
{
  "2026-03": {
    "tasks_completed": 15,
    "estimated_cost_usd": 45.2
  }
}
```

`config.ts` で上限を設定:

```typescript
budget: {
  maxMonthlyUsd: 150,     // 月額 $150 まで
  maxMonthlyTasks: 50,    // 月 50 タスクまで
}
```

## ファイル構成

```
.agent/
├── orchestrate.ts          # エントリーポイント
├── config.ts               # 設定（API キー、モデル、予算）
├── agents/
│   ├── claude-designer.ts  # Claude 設計エージェント
│   ├── codex-builder.ts    # Codex 実装エージェント
│   └── claude-reviewer.ts  # Claude レビューエージェント
├── lib/
│   ├── prompt-router.ts    # 「次は？」自動判定ロジック
│   ├── task-parser.ts      # tasks.md パーサー
│   ├── budget-tracker.ts   # 予算管理
│   └── logger.ts           # ログ出力
├── package.json
├── tsconfig.json
└── README.md
```

## 他プロジェクトへの導入

1. `.agent/` ディレクトリをコピー
2. `cd .agent && npm install`
3. API キーを設定
4. `.claude/prompts/` にプロンプトライブラリを配置
5. `npx tsx .agent/orchestrate.ts next` で開始
