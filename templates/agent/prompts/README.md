# プロンプトライブラリ

> **「どれかを投げまくれば、プロダクトが完成する」**
> 23個のプロンプトで、ビジネス思考から実装・運用までをカバー。

---

## 使い方

1. このREADMEの「次は？」セクションを読んで、今やるべきプロンプトを特定する
2. 該当プロンプトの `.md` ファイルの内容をClaudeに投げる
3. 完了したら「次は？」と聞く → Claudeが最適な次のプロンプトを提示

---

## 全プロンプト一覧（23個）

### 00-think — プロダクト思考（最上位レイヤー）

| #   | プロンプト                                           | 用途                              | 所要時間  |
| --- | ---------------------------------------------------- | --------------------------------- | --------- |
| 0a  | [product-conviction](00-think/product-conviction.md) | WHO × WHAT × HOW の整合性チェック | 30min〜1h |
| 0b  | [ship-and-learn](00-think/ship-and-learn.md)         | Ship後の仮説検証 → 学習ループ     | 30min     |

**他の全プロンプトより上位**。プロダクトは3層構造:

```
WHO（誰に）× WHAT（どんな価値を）= 売れるか？
       ↓
市場規模 × 競合性 × モート = 維持・拡大できるか？
       ↓
HOW = プロダクト ← 01〜08のプロンプトが扱う範囲
```

HOW をいくら精密に作っても、WHO × WHAT が間違っていれば全てゴミ。
00-think はこの上2層を扱う唯一のプロンプト群。

### 01-spec — 設計

| #   | プロンプト                                | 用途                                  | 所要時間 |
| --- | ----------------------------------------- | ------------------------------------- | -------- |
| 1   | [spec-create](01-spec/spec-create.md)     | P0スペック新規作成（最重要）          | 2〜3h    |
| 2   | [spec-review](01-spec/spec-review.md)     | 設計書の精密レビュー + ゼロベース再考 | 1〜2h    |
| 3   | [spec-gap-fill](01-spec/spec-gap-fill.md) | 設計書間の矛盾・漏れ検出              | 1〜2h    |

### 02-plan — 計画

| #   | プロンプト                                        | 用途                               | 所要時間 |
| --- | ------------------------------------------------- | ---------------------------------- | -------- |
| 4   | [plan-create](02-plan/plan-create.md)             | 承認済みスペックから実装計画を作成 | 1〜2h    |
| 5   | [plan-db-migration](02-plan/plan-db-migration.md) | DB設計 + マイグレーション生成      | 1〜2h    |

### 03-build — 実装

| #   | プロンプト                                             | 用途                             | 所要時間  |
| --- | ------------------------------------------------------ | -------------------------------- | --------- |
| 6   | [build-feature](03-build/build-feature.md)             | 機能実装（tasks.mdに沿って進行） | 2〜4h     |
| 7   | [build-widget](03-build/build-widget.md)               | ウィジェットJS実装（15KB制限）   | 2〜4h     |
| 8   | [build-test-skeleton](03-build/build-test-skeleton.md) | Phase 0: テスト骨格を先に作成    | 30min〜1h |

### 04-quality — 品質

| #   | プロンプト                                         | 用途                           | 所要時間  |
| --- | -------------------------------------------------- | ------------------------------ | --------- |
| 9   | [quality-scan](04-quality/quality-scan.md)         | 5フェーズ品質スキャン          | 1〜2h     |
| 10  | [quality-review](04-quality/quality-review.md)     | 12観点コードレビュー           | 30min〜1h |
| 11  | [quality-release](04-quality/quality-release.md)   | リリース前品質チェック         | 2〜4h     |
| 12  | [quality-e2e](04-quality/quality-e2e.md)           | Playwright E2Eテスト生成・実行 | 1〜3h     |
| 13  | [quality-visual](04-quality/quality-visual.md)     | 打鍵テスト（3デバイスサイズ）  | 1〜2h     |
| 14  | [quality-security](04-quality/quality-security.md) | セキュリティ監査               | 1〜2h     |

### 05-plumbing — 配管

| #   | プロンプト                                              | 用途                                      | 所要時間 |
| --- | ------------------------------------------------------- | ----------------------------------------- | -------- |
| 15  | [plumbing-data-flow](05-plumbing/plumbing-data-flow.md) | データフロー追跡 + 型・バリデーション統一 | 1〜2h    |
| 16  | [plumbing-ux-flow](05-plumbing/plumbing-ux-flow.md)     | UXフロー最適化（5軸レビュー）             | 1〜2h    |

### 06-polish — 磨き込み

| #   | プロンプト                                        | 用途                          | 所要時間 |
| --- | ------------------------------------------------- | ----------------------------- | -------- |
| 17  | [polish-product](06-polish/polish-product.md)     | UI/UX磨き込み（8ポイント）    | 2〜3h    |
| 18  | [polish-copy-a11y](06-polish/polish-copy-a11y.md) | コピー品質 + アクセシビリティ | 1〜2h    |

### 07-docs — ドキュメント

| #   | プロンプト                        | 用途                   | 所要時間 |
| --- | --------------------------------- | ---------------------- | -------- |
| 19  | [docs-sync](07-docs/docs-sync.md) | 設計書と実コードの同期 | 1〜2h    |

### 08-ops — 運用

| #   | プロンプト                           | 用途                     | 所要時間  |
| --- | ------------------------------------ | ------------------------ | --------- |
| 20  | [ops-deploy](08-ops/ops-deploy.md)   | デプロイ前チェックリスト | 30min〜1h |
| 21  | [ops-monitor](08-ops/ops-monitor.md) | 運用監視セットアップ     | 1〜2h     |

---

## 6つの推奨チェーン

### チェーンA: 新機能パイプライン（最頻出）

```
product-conviction → spec-create → spec-review → plan-create → plan-db-migration → build-test-skeleton → build-feature → quality-review → ship-and-learn
```

新しい機能を1本作り切る流れ。最初に `product-conviction` で「作るべきか？」を問い、最後に `ship-and-learn` で「作った結果どうだったか？」を回収する。このループが回らないと成長しない。

### チェーンB: 週次メンテナンス

```
quality-scan → docs-sync → plumbing-ux-flow
```

週1回実行。コードの健康診断 → 設計書の同期 → UXの改善。
溜まった技術的負債を定期的に返済するルーチン。

### チェーンC: リリース前

```
quality-security → quality-e2e → quality-visual → quality-release → ops-deploy
```

本番デプロイ前に実行。セキュリティ → E2E → 目視確認 → 最終判定 → デプロイ。
1つでもNGならデプロイしない。

### チェーンD: 設計スプリント

```
spec-gap-fill → spec-review → spec-create (×複数)
```

設計書を一気に固めたいとき。まず全体の矛盾を潰し、既存をレビューし、新しいスペックを量産する。

### チェーンE: 月次品質

```
polish-product → polish-copy-a11y → quality-visual → ops-monitor
```

月1回実行。プロダクト全体の品質を底上げ。
UI磨き → コピー改善 → 目視確認 → 監視体制確認。

### チェーンF: プロダクト思考ループ

```
product-conviction → spec-create(Step 0) → [実装] → ship-and-learn → product-conviction(次の機能)
```

全チェーンの上位に位置する思考ループ。
「作るべきか？」→「作った」→「結果どうだったか？」→「次に作るべきものは？」を回す。
このループが回らないプロジェクトは、HOWの精度に関わらず失敗する。

---

## 「次は？」自動判定ロジック

> ユーザーが「次は？」と聞いたら、Claudeはこのロジックに従って最適な次のプロンプトを提案する。

### 判定フロー

```
0. ラテラルチェック（最優先 — 他の全判定より上位）
   ├─ CONVICTION_LOG.md が空、または直近2週間で未実行？
   │   → product-conviction（WHO × WHAT の接続を先に確認しろ）
   │
   └─ Shipした機能の ship-and-learn が未実行？
       → ship-and-learn（学習を回収しろ）

1. IMPLEMENTATION_STATUS.md を読む
2. specs/ ディレクトリの状態を確認
3. 以下の優先順位で判定:

   ┌─ P0スペックが0件？
   │   → spec-create（まずスペックを作れ）
   │
   ├─ 未レビューのスペックがある？
   │   → spec-review（レビューして承認しろ）
   │
   ├─ 承認済みスペックにplan.mdがない？
   │   → plan-create（計画を立てろ）
   │
   ├─ DB変更が必要なプランがある？
   │   → plan-db-migration（DBを先に準備しろ）
   │
   ├─ テスト骨格がないプランがある？
   │   → build-test-skeleton（テストを先に書け）
   │
   ├─ 未実装のタスクがある？
   │   → build-feature（実装しろ）
   │
   ├─ 実装済みだがレビューしていない？
   │   → quality-review（レビューしろ）
   │
   ├─ 設計書と実コードがズレてる？
   │   → docs-sync（同期しろ）
   │
   ├─ 上記全て完了？
   │   → quality-scan（品質スキャンして磨き込め）
   │
   └─ リリース準備完了？
       → quality-release + ops-deploy（リリースしろ）
```

### 判定に使うファイル

| ファイル                                 | 用途                     |
| ---------------------------------------- | ------------------------ |
| `.agent/shared/IMPLEMENTATION_STATUS.md` | 全体の進捗状況           |
| `specs/*/spec.md`                        | 各機能のスペック         |
| `specs/*/plan.md`                        | 各機能の実装計画         |
| `specs/*/tasks.md`                       | 各機能のタスクリスト     |
| `docs/`                                  | 設計書（同期チェック用） |
| `.agent/shared/CONVICTION_LOG.md`        | 確信度チェック履歴       |
| `.agent/shared/LEARN_LOG.md`             | Ship後学習の履歴         |

### 実行例

```
ユーザー: 「次は？」

Claude:
1. IMPLEMENTATION_STATUS.md を確認 → P0スペックが3/15完了
2. specs/ を確認 → 2件が承認済みだがplan.mdなし
3. 判定: plan-create が最優先

回答: 「承認済みのスペックが2件あるのにまだ計画が立っていません。
       plan-create を実行して、実装計画を作りましょう。
       対象: specs/banner-decision-engine/ と specs/proof-layer/」
```

---

## よくある組み合わせ

| シチュエーション                 | 推奨プロンプト                                   |
| -------------------------------- | ------------------------------------------------ |
| 「何から始めればいい？」         | spec-create（設計から）                          |
| 「この画面なんか使いにくい」     | plumbing-ux-flow → polish-product                |
| 「バグが多い気がする」           | quality-scan → quality-e2e                       |
| 「デプロイしていい？」           | quality-release → ops-deploy                     |
| 「設計書が古い」                 | docs-sync                                        |
| 「セキュリティ大丈夫？」         | quality-security                                 |
| 「ウィジェットを改修したい」     | build-widget                                     |
| 「この機能、本当に必要？」       | product-conviction                               |
| 「リリースしたけど効果あった？」 | ship-and-learn                                   |
| 「全体的にもっと良くしたい」     | チェーンB（週次メンテ） or チェーンE（月次品質） |
