---
name: {{PROJECT_NAME}} 現在 Phase ステータス
description: 現在地の Phase・進捗%・未解決タスク・Active Agents の正本
type: project
---
# {{PROJECT_NAME}} — 現在 Phase ステータス

**最終更新**: {{START_DATE}} 初版
**現在 Phase**: **Phase 0 準備中**

---

## 進行状況

| Phase | 期間 | 状態 | 進捗 |
|-------|------|------|------|
| Phase 0: 準備 + 封じ込め | ###_TODO: PHASE_0_DURATION ### | 🟡 進行中 | 0% |
| Phase 1: ###_TODO: PHASE_1_NAME ### | ###_TODO: PHASE_1_DURATION ### | ⏳ 待機 | 0% |
| Phase 2: ###_TODO: PHASE_2_NAME ### | ###_TODO: PHASE_2_DURATION ### | ⏳ 待機 | 0% |
| Phase 3: ###_TODO: PHASE_3_NAME ### | ###_TODO: PHASE_3_DURATION ### | ⏳ 待機 | 0% |
| Phase 4: ###_TODO: PHASE_4_NAME ### | ###_TODO: PHASE_4_DURATION ### | ⏳ 待機 | 0% |
| Phase 5: 最終検証 | ###_TODO: PHASE_5_DURATION ### | ⏳ 待機 | 0% |

---

## 次セッション最優先タスク

### Phase 0 準備タスク

| # | タスク | Lv | 状態 |
|---|-------|-----|------|
| 0-1 | ###_TODO: PHASE_0_TASK_1 ### | ###_TODO: PHASE_0_TASK_1_LEVEL ### | 未着手 |
| 0-2 | ###_TODO: PHASE_0_TASK_2 ### | ###_TODO: PHASE_0_TASK_2_LEVEL ### | 未着手 |

### 適用前の必須手順 (全 L1 共通)
1. プロジェクトオーナー個別事前承認
2. 24h 滞留プロトコル満了確認
3. 凍結例外マトリクス抵触なし確認
4. 直前に件数実測で drift なし確認
5. 本番適用コマンド実行
6. 事後検証

### Phase 0 完了判定基準 (Phase 1 着手前チェック)
- [ ] 成果物ドキュメント作成完了
- [ ] Claude 3 並列 + Codex 2 並列最終レビュー Critical 0 件
- [ ] 業務受入承認
- [ ] RISK_REGISTER に対応する D-XXX 実施記録追加

---

## 直近の重要事項

### {{START_DATE}}
- プロジェクトキックオフ
- ###_TODO: KICKOFF_DETAILS ###

---

## Active Agents (参照可能、SendMessage で継続可)

サブエージェントを起動したら ID をここに記録。形式:

```
- agentID_example_1 (タスク名 / 起動日時 / 状態)
```

---

## Phase 完了ゲート記録

| Phase | 完了日 | Claude 3並列 | Codex 2並列 | 盲検テスト | 業務受入 | PO承認 |
|-------|--------|-------------|-----------|-----------|---------|--------|
| Phase 0 | - | - | - | N/A | - | - |
| Phase 1 | - | - | - | - | - | - |
| Phase 2 | - | - | - | - | - | - |
| Phase 3 | - | - | - | 実施 | - | - |
| Phase 4 | - | - | - | 実施 | - | - |
| Phase 5 | - | - | - | 実施 | 実施 | - |

---

## 更新履歴

| 日付 | 更新内容 |
|------|--------|
| {{START_DATE}} | 初版作成 |
