---
name: {{PROJECT_NAME}} プロジェクト運用マスタープラン
description: {{PROJECT_NAME}} の長期プロジェクト運用ルール。期間・原則・リスク分類・監査体制・凍結施策の正本
type: project
---
# {{PROJECT_NAME}} マスタープラン v1.0

**期間**: {{START_DATE}} 開始、終了予定 **{{END_DATE}}（{{DURATION}}目安）**
**ステータス**: {{CURRENT_PHASE}}

> このファイルは {{PROJECT_NAME}} の**唯一の正本**。他と矛盾した場合これが優先。

---

## 🔥 最上位原則

1. **{{TOP_PRINCIPLE}}**
2. **{{SECOND_PRINCIPLE}}**
3. **{{THIRD_PRINCIPLE}}**
4. **失敗は許されない**

---

## 完璧の定義

> {{DEFINITION_OF_DONE}}
> 全体期限は柔軟、**成果物単位は期限あり、品質基準は事前固定**。

---

## N 大原則

記入例:

| # | 原則 |
|---|------|
| ① | {{PRINCIPLE_1}} |
| ② | {{PRINCIPLE_2}} |
| ③ | {{PRINCIPLE_3}} |
| 🌟 | **順序原則**: {{ORDER_PRINCIPLE}} |

---

## 5段階リスク分類

| Lv | ラベル | 例 | 承認 |
|----|------|------|------|
| L0 | 🔴 IRREVERSIBLE | 本番 DB DELETE/TRUNCATE、本番マイグレ適用、データ不可逆変換 | 対面 + 本人実行 |
| L1 | 🟠 HIGH RISK | 本番 UPDATE、staging→本番昇格、新マイグレ作成 | **個別事前承認 + 24h滞留 + 週2件上限** |
| L2 | 🟡 MID RISK | コード変更、staging INSERT、ローカルマイグレ | Phase 着手時一括承認 |
| L3 | 🟢 LOW | ドキュメント、memory、サンプル100件以下 SELECT | 事後報告 |
| L4 | ⚪ READ ONLY | 調査、Read/Glob/Grep | 無制限 |

**運用ルール**:
- L1 上限: **週2件** (負荷 + 判断疲労対策)
- L1 24時間滞留必須 (緊急時のみスキップ可、事前承認必須)
- L0 週最大2回
- 各操作冒頭で「これは Lv X です」を宣言
- 分類が曖昧な場合は 1 段上を採用

---

## 監査体制

| 層 | 監査者 | タイミング |
|---|--------|-----------|
| 層1-Claude | 敵対的サブエージェント 3 並列 (Red Team / Fact Check / Incident Sim) | Phase完了時、L0/L1 操作前 |
| 層1-Codex | GPT-5 系 異質モデル 2 並列 | 同上、必須 (quota 切れ時は Claude Red Team Round 3+ で代替) |
| 層2: 盲検テスト | {{BLIND_TEST_SIZE}} 件層別 | L1/L2 本番書き込み前 |
| 層3: 業務受入 | プロジェクトオーナー本人 | Phase 完了時 |
| Review Gate | 停止前 Codex 自動 | 全停止時 |

**衝突裁定ルール**:
優先順位: **データ破壊 > rollback 不能 > 影響件数 > UI/文書**

---

## Phase 構成

期間枠ではなく**成果物単位の期限**で管理。

### Phase 0: 準備 + 封じ込め ({{PHASE_0_DURATION}})

成果物:
- {{PHASE_0_DELIVERABLE_1}}
- {{PHASE_0_DELIVERABLE_2}}

完了基準:
- 事前定義した成果物全達成
- Claude 3並列 + Codex 2並列レビュー Critical 0件
- プロジェクトオーナー業務受入

### Phase 1: ... ({{PHASE_1_DURATION}})

{{PHASE_1_DETAILS}}

### Phase 2: ... ({{PHASE_2_DURATION}})

{{PHASE_2_DETAILS}}

---

## 凍結例外マトリクス

| 事象 | 対応 |
|------|------|
| 本番障害 (業務停止) / セキュリティ | 即プロジェクト中断、修正最優先 |
| データ汚染拡大 | 即封じ込め → プロジェクト内統合 |
| 本番障害 (業務継続可能) | 24h 以内判断: 並行修正 or Feature Flag OFF or プロジェクト後 |
| 営業要望 / UI 改善 | Backlog 登録、プロジェクト後 |
| コンプライアンス要請 | 法的期限優先 |
| 外部 API 仕様変更通知 | Phase 1 検知設計に統合 |

**運用**:
- 凍結例外発動週次上限 1 件
- 例外発動時はスコープ同時縮小 (先送り禁止)

---

## 失敗の定義

1. 検知ルール見逃し
2. 成果物書き直し (実装中の重大見落とし)
3. 本番への誤データ書き込み
4. 盲検テスト不正
5. プロジェクトオーナーの判断疲労による L1 雑承認 3 回以上
6. Codex Critical 指摘を Claude が要約・無視・上書き
7. Phase 完了時に Critical 残存
8. 想定期間の大幅超過 ({{FAILURE_DURATION}} 超過)

### Phase 完了「Critical 0件」運用ルール

- **リワーク回数上限**: 各 Phase で Critical 0件達成のためのリワークは **3回まで**
- 3回超過時はスコープ縮小判断
- リワーク回数を `PHASE_STATUS.md` に追記

---

## 凍結施策リスト

本プロジェクト期間中は以下に手出ししない:

| # | 施策 | 凍結理由 |
|---|------|--------|
| F-1 | {{FROZEN_1}} | {{FROZEN_1_REASON}} |
| F-2 | {{FROZEN_2}} | {{FROZEN_2_REASON}} |

---

## セッション継続性

`memory/SESSION_START.md` を毎回読む。

---

## 日次自己レビュー Q&A (8 問)

```md
## YYYY-MM-DD
1. 今日の実装で「実データ未検証の前提」はあるか
2. 単一キー判断を 1 箇所でもしていないか
3. 数値・件数は SELECT クエリで実測したか
4. 既存コード / メモリ / 設計書を読まずに進めた箇所はあるか
5. 「完璧」「OK」「問題なし」と思った瞬間、裏取りされているか
6. 起動した Agent ID 一覧
7. 採用 / 却下した指摘とその根拠
8. 明日引き継ぐ判断根拠
```

保存先: `memory/daily-self-review/YYYY-MM-DD.md`

---

## Phase 完了判定基準

各 Phase 完了には以下すべて必要:

- [ ] 成果物ドキュメント作成完了
- [ ] 事前定義した期限・合格基準・非目標を全達成
- [ ] 層1-Claude 3 並列レビュー Critical 0 件
- [ ] 層1-Codex 2 並列レビュー Critical 0 件
- [ ] 層2 盲検テスト (該当時) {{BLIND_TEST_THRESHOLD}} 以上
- [ ] 層3 業務受入 (プロジェクトオーナー本人)
- [ ] 日次自己レビュー Q&A 記録 (8 問)
- [ ] **evidence bundle 添付** (再現SQL + 実測ログ + 外部仕様証跡 + 変更前後 diff)
- [ ] 前 Phase の High 指摘消化確認
- [ ] プロジェクトオーナーゲート承認
- [ ] RISK_REGISTER.md 更新

---

## 更新履歴

| 日付 | バージョン | 更新内容 |
|------|---------|--------|
| {{START_DATE}} | v1.0 | 初版作成 |

---

## プレースホルダ一覧 (初期化時に置換必須)

以下のプレースホルダを実際の値に置換してください:

- `{{PROJECT_NAME}}`: プロジェクト名
- `{{START_DATE}}`: 開始日 (YYYY-MM-DD)
- `{{END_DATE}}`: 終了予定日
- `{{DURATION}}`: 期間目安 (例: 「12週間」)
- `{{CURRENT_PHASE}}`: 現在の Phase (例: 「Phase 0 準備中」)
- `{{TOP_PRINCIPLE}}`, `{{SECOND_PRINCIPLE}}`, `{{THIRD_PRINCIPLE}}`: 最上位 3 原則
- `{{DEFINITION_OF_DONE}}`: 完璧の定義 (1 文)
- `{{PRINCIPLE_1}}` 〜 `{{PRINCIPLE_3}}`: N 大原則の詳細
- `{{ORDER_PRINCIPLE}}`: 順序原則
- `{{BLIND_TEST_SIZE}}`: 盲検テストサンプルサイズ (例: 500)
- `{{BLIND_TEST_THRESHOLD}}`: 合格閾値 (例: 99%)
- `{{PHASE_0_DURATION}}` 等: Phase ごとの期間目安
- `{{PHASE_0_DELIVERABLE_1}}` 等: Phase ごとの成果物
- `{{FAILURE_DURATION}}`: 失敗判定期間 (例: 「24週間」)
- `{{FROZEN_1}}`, `{{FROZEN_1_REASON}}` 等: 凍結施策
