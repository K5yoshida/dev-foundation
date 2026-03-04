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

## 使い方

### 基本: 「次は？」自動判定

```bash
npx tsx .agent/orchestrate.ts next
```

プロジェクトの状態（CONVICTION_LOG, LEARN_LOG, specs/, IMPLEMENTATION_STATUS.md）を読み取り、最適なプロンプトを自動選択して実行します。

### タスク指定

```bash
npx tsx .agent/orchestrate.ts "バナー表示のレスポンシブ対応を実装して"
```

### プロンプト直接指定

```bash
npx tsx .agent/orchestrate.ts --prompt spec-create --feature "離脱キャプチャ"
npx tsx .agent/orchestrate.ts --prompt quality-scan
npx tsx .agent/orchestrate.ts --prompt build-feature --feature "モーダル直CV"
```

### チェーン実行

```bash
# A: 新機能チェーン（設計→実装→レビューの全工程）
npx tsx .agent/orchestrate.ts --chain A --feature "モーダル直CV"

# B: 週次メンテ
npx tsx .agent/orchestrate.ts --chain B

# C: リリース前チェック
npx tsx .agent/orchestrate.ts --chain C

# D: 設計スプリント
npx tsx .agent/orchestrate.ts --chain D

# E: 月次品質
npx tsx .agent/orchestrate.ts --chain E

# F: プロダクト思考ループ
npx tsx .agent/orchestrate.ts --chain F
```

### ドライラン（API呼び出しなし）

```bash
npx tsx .agent/orchestrate.ts --dry-run next
npx tsx .agent/orchestrate.ts --dry-run --chain A --feature "テスト機能"
```

### モデル指定

```bash
npx tsx .agent/orchestrate.ts next --claude-model claude-opus-4-6 --codex-model gpt-5.3-codex
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
