# プロンプトライブラリ テンプレート

> **「どれかを投げまくれば、プロダクトが完成する」**
> 21個のプロンプトで開発ライフサイクル全体をカバー。

## セットアップ

1. `templates/prompts/` を `.claude/prompts/` にコピー
2. 各 `.md` ファイル内の `{{PROJECT_NAME}}`, `{{DOCS_DIR}}` 等を自分のプロジェクトに合わせて置換
3. README.md の「次は？」ロジックをそのまま使う

## 全プロンプト一覧（21個）

| カテゴリ | プロンプト | 用途 |
|---------|----------|------|
| 01-spec | spec-create | P0スペック新規作成（最重要） |
| 01-spec | spec-review | 設計書の精密レビュー + ゼロベース再考 |
| 01-spec | spec-gap-fill | 設計書間の矛盾・漏れ検出 |
| 02-plan | plan-create | 承認済みスペックから実装計画を作成 |
| 02-plan | plan-db-migration | DB設計 + マイグレーション生成 |
| 03-build | build-feature | 機能実装（tasks.mdに沿って進行） |
| 03-build | build-test-skeleton | Phase 0: テスト骨格を先に作成 |
| 04-quality | quality-scan | 5フェーズ品質スキャン |
| 04-quality | quality-review | 12観点コードレビュー |
| 04-quality | quality-release | リリース前品質チェック |
| 04-quality | quality-e2e | E2Eテスト生成・実行 |
| 04-quality | quality-visual | 打鍵テスト（3デバイスサイズ） |
| 04-quality | quality-security | セキュリティ監査 |
| 05-plumbing | plumbing-data-flow | データフロー追跡 + 型・バリデーション統一 |
| 05-plumbing | plumbing-ux-flow | UXフロー最適化 |
| 06-polish | polish-product | UI/UX磨き込み |
| 06-polish | polish-copy-a11y | コピー品質 + アクセシビリティ |
| 07-docs | docs-sync | 設計書と実コードの同期 |
| 08-ops | ops-deploy | デプロイ前チェックリスト |
| 08-ops | ops-monitor | 運用監視セットアップ |

## 5つの推奨チェーン

| チェーン | 用途 | フロー |
|---------|------|--------|
| A: 新機能 | 1機能を作り切る | spec-create → spec-review → plan-create → plan-db-migration → build-test-skeleton → build-feature → quality-review |
| B: 週次メンテ | コード健康診断 | quality-scan → docs-sync → plumbing-ux-flow |
| C: リリース前 | 本番デプロイ前 | quality-security → quality-e2e → quality-visual → quality-release → ops-deploy |
| D: 設計スプリント | 設計書を固める | spec-gap-fill → spec-review → spec-create (×複数) |
| E: 月次品質 | 品質底上げ | polish-product → polish-copy-a11y → quality-visual → ops-monitor |

## 「次は？」自動判定ロジック

ユーザーが「次は？」と聞いたら:

1. `IMPLEMENTATION_STATUS.md` を読む
2. `specs/` ディレクトリの状態を確認
3. 優先順位に従って最適なプロンプトを提案:

```
スペックが不足？ → spec-create
未レビュー？ → spec-review
計画がない？ → plan-create
DB変更必要？ → plan-db-migration
テスト骨格なし？ → build-test-skeleton
未実装タスク？ → build-feature
未レビュー実装？ → quality-review
設計書がズレてる？ → docs-sync
全部完了？ → quality-scan
リリース準備？ → quality-release + ops-deploy
```

## 適用事例

[tokusetu-page](https://github.com/K5yoshida/tokusetu-page) の `.claude/prompts/` に
プロジェクト固有のカスタマイズ版が実装されています。
