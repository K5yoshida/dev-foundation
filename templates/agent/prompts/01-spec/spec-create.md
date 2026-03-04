# P0スペック作成

> Input: P0番号（例: "001"）または対応するdocs番号（例: "32"）
> Output: `specs/{number}-{name}/spec.md`, `plan.md`, `tasks.md`
> 所要時間: 1〜2時間
> モード: プランモード必須

---

## 手順

### Step 0: 5つの根本質問（省略禁止）

スペックを1行も書く前に、設計書のビジネス戦略セクションを読み、この機能が WHO × WHAT に接続しているかを確認する。

1. CLAUDE.md の「設計書クイックリファレンス」からビジョン・戦略・市場分析・競合分析に該当するドキュメントを読む
2. 以下の5問に回答する

| #   | 質問                                                                                   | 回答 | 合格基準                                        |
| --- | -------------------------------------------------------------------------------------- | ---- | ----------------------------------------------- |
| Q1  | **WHO接続**: この機能は、設計書に定義されたターゲットのどの課題を解決するか？          |      | 因果関係を1文で説明できる                       |
| Q2  | **WHAT接続**: この機能は、設計書に定義された価値提案のどれを実現するか？               |      | 対応する価値提案を指し示せる                    |
| Q3  | **モート**: 競合がこれを真似するのに何ヶ月かかるか？                                   |      | 6ヶ月以上、または6ヶ月未満でも必要な理由を明記  |
| Q4  | **必須性**: この機能がなくても設計書の目標を達成できるか？                             |      | 「できない」→ 必須 / 「できる」→ 優先度を下げる |
| Q5  | **Ship翌日テスト**: 明日リリースしたら、ターゲット顧客に「使ってください」と言えるか？ |      | 「言える」→ Ship価値あり                        |

#### 判定

- 5問中4問以上「合格」→ Step 1 に進む
- 3問「合格」→ `product-conviction` プロンプトを先に実行してから戻る
- 2問以下「合格」→ この機能のスペック作成を中止。別の機能を検討

### Step 1: 設計書を読む

`docs/INDEX.md` の Reading Path B に従い、以下の順で読む:

1. `docs/29_ゼロベース再設計戦略.md` — 完了の定義
2. `docs/30_設計漏れ是正と実装規律.md` — 10軸バリデーション
3. `docs/31_実装着手前チェックリスト.md` — Go/No-Goゲート
4. `docs/44_最高意思決定基準書.md` — 7ゲートバリデーション
5. 該当P0のチェックシート（`docs/32〜47`）

### Step 2: 既存コードを調査

- 該当機能に関連する既存ファイルを `grep` / `glob` で探す
- `docs/12_DB一覧.md` + `supabase/migrations/` でDBスキーマを把握
- `docs/13_APIエンドポイント一覧.md` + `app/api/` でAPIを把握
- `docs/09_画面一覧.md` + `app/(dashboard)/` で画面を把握

### Step 3: spec.md を作成

`specs/README.md` の spec.md テンプレートに沿って作成する。

必須セクション:

- Overview（1〜3文）
- User Personas テーブル
- User Stories（As a [persona], I want to...）
- Acceptance Criteria（全て `[ ]` チェックボックス）
- Data Model Changes（テーブル/カラム/制約の差分）
- API Changes（新規/変更エンドポイント）
- UI/UX Requirements（画面ごとの要件）
- Test Design テーブル（Scenario / Type / Input / Expected Output）
- 10-Axis Validation（docs/30 の10軸チェック）
- 7-Gate Validation（docs/44 の7ゲートチェック）
- Business Impact Hypothesis（WHO × WHAT への接続仮説 + 計測方法）
- Ship & Learn Plan（リリース後48時間以内に確認する指標3つ）

### Step 4: plan.md を作成

`specs/README.md` の plan.md テンプレートに沿って作成する。

必須セクション:

- Technical Approach（アーキテクチャ判断）
- Files to Create / Modify（具体的なファイルパス）
- Database Changes（マイグレーションSQL概要）
- Test Strategy + Phase 0 Checklist

### Step 5: tasks.md を作成

`specs/README.md` の tasks.md テンプレートに沿って作成する。

- Phase 0: Test Skeleton（テスト骨格）
- Phase 1: Data Layer（DB + 型定義）
- Phase 2: API Layer
- Phase 3: UI Layer
- Phase 4: Integration + Polish
- 各タスクに `[P]` マーカー（並列実行可能な場合）

### Step 6: 最終チェック

- `memory/constitution.md` の10条に違反していないか
- `[NEEDS CLARIFICATION]` が残っていないか（残す場合は理由を明記）
- Acceptance Criteria が全て検証可能か（曖昧な形容詞がないか）

## 禁止

- コードの実装は行わない（スペック文書の作成のみ）
- 推測で受入基準を書かない（不明点は `[NEEDS CLARIFICATION]` に記載）
- 既存の設計書と矛盾する内容を書かない

## 完了条件

- [ ] `specs/{number}-{name}/spec.md` 作成済み
- [ ] `specs/{number}-{name}/plan.md` 作成済み
- [ ] `specs/{number}-{name}/tasks.md` 作成済み
- [ ] 10-Axis Validation 全チェック済み
- [ ] 7-Gate Validation 全チェック済み
- [ ] `[NEEDS CLARIFICATION]` が空、または理由付きで残っている
- [ ] Step 0: 5つの根本質問に全て回答済み（判定: 続行）
- [ ] Business Impact Hypothesis セクション記載済み
- [ ] Ship & Learn Plan セクション記載済み
