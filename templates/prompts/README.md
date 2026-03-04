# プロンプトライブラリ テンプレート

> **「どれかを投げまくれば、プロダクトが完成する」**
> 23個のプロンプトで、ビジネス思考から実装・運用までをカバー。

## セットアップ

1. `templates/prompts/` を `.claude/prompts/` にコピー
2. 各 `.md` ファイル内の `{{PROJECT_NAME}}`, `{{DOCS_DIR}}` 等を自分のプロジェクトに合わせて置換
3. README.md の「次は？」ロジックをそのまま使う
4. `.claude/CONVICTION_LOG.md` と `.claude/LEARN_LOG.md` を空ファイルで作成

## 全プロンプト一覧（23個）

### 00-think — プロダクト思考（最上位レイヤー）

| カテゴリ | プロンプト | 用途 |
|---------|----------|------|
| 00-think | product-conviction | WHO × WHAT × HOW の整合性チェック |
| 00-think | ship-and-learn | Ship後の仮説検証 → 学習ループ |

**他の全プロンプトより上位**。プロダクトは3層構造:

```
WHO（誰に）× WHAT（どんな価値を）= 売れるか？
       ↓
市場規模 × 競合性 × モート = 維持・拡大できるか？
       ↓
HOW = プロダクト ← 01〜08のプロンプトが扱う範囲
```

HOW をいくら精密に作っても、WHO × WHAT が間違っていれば全てゴミ。

### 01-spec 〜 08-ops

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

## 6つの推奨チェーン

| チェーン | 用途 | フロー |
|---------|------|--------|
| A: 新機能 | 1機能を作り切る | product-conviction → spec-create → spec-review → plan-create → plan-db-migration → build-test-skeleton → build-feature → quality-review → ship-and-learn |
| B: 週次メンテ | コード健康診断 | quality-scan → docs-sync → plumbing-ux-flow |
| C: リリース前 | 本番デプロイ前 | quality-security → quality-e2e → quality-visual → quality-release → ops-deploy |
| D: 設計スプリント | 設計書を固める | spec-gap-fill → spec-review → spec-create (×複数) |
| E: 月次品質 | 品質底上げ | polish-product → polish-copy-a11y → quality-visual → ops-monitor |
| F: プロダクト思考 | WHO × WHAT 検証 | product-conviction → spec-create(Step 0) → [実装] → ship-and-learn → product-conviction(次) |

## 「次は？」自動判定ロジック

ユーザーが「次は？」と聞いたら:

```
0. ラテラルチェック（最優先 — 他の全判定より上位）
   ├─ CONVICTION_LOG.md が空、または直近2週間で未実行？
   │   → product-conviction（WHO × WHAT の接続を先に確認しろ）
   └─ Shipした機能の ship-and-learn が未実行？
       → ship-and-learn（学習を回収しろ）

1. IMPLEMENTATION_STATUS.md を読む
2. specs/ ディレクトリの状態を確認
3. 優先順位に従って最適なプロンプトを提案:

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

### 判定に使うファイル

| ファイル | 用途 |
|---------|------|
| `.claude/IMPLEMENTATION_STATUS.md` | 全体の進捗状況 |
| `specs/*/spec.md` | 各機能のスペック |
| `specs/*/plan.md` | 各機能の実装計画 |
| `specs/*/tasks.md` | 各機能のタスクリスト |
| `docs/` | 設計書（同期チェック用） |
| `.claude/CONVICTION_LOG.md` | 確信度チェック履歴 |
| `.claude/LEARN_LOG.md` | Ship後学習の履歴 |

## 適用事例

[tokusetu-page](https://github.com/K5yoshida/tokusetu-page) の `.claude/prompts/` に
プロジェクト固有のカスタマイズ版が実装されています。
