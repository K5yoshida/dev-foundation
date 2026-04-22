---
name: {{PROJECT_NAME}} Risk Register
description: Critical/High リスクの発生履歴と対処記録。Phase ごとに追記、過去事故再発監視の正本
type: project
---
# {{PROJECT_NAME}} — Risk Register

**最終更新**: {{START_DATE}} 初版

> 本ファイルは **Critical/High リスクの発生履歴** を記録する正本。
> レビューで検出されたリスク・実運用で発覚した問題を、すべてここに記録する。
> セッション開始時に必ず確認し、過去事故パターンの再発を防ぐ。

---

## リスクレベル定義

| Level | 意味 | 対処緊急度 |
|-------|------|----------|
| 🔴 Critical | 過去事故再発・データ汚染拡大・本番障害 | 即対処、Phase 中断 |
| 🟠 High | Phase 目標未達・設計欠陥・盲点発見 | 当該 Phase 内で対処 |
| 🟡 Medium | 運用上の注意点・将来リスク | 次 Phase で対処 |
| 🟢 Low | 軽微な気付き・改善余地 | 随時記録 |

---

## 検出履歴

### {{START_DATE}} キックオフ時

プロジェクト開始時に identified されたリスクを記入。

#### 🟡 R-001: {{INITIAL_RISK_1}}

**検出元**: {{DETECTION_METHOD}}
**内容**: {{RISK_DETAIL}}
**対処計画**: {{MITIGATION_PLAN}}
**状態**: ⏳ 対処予定

---

## 対処済みリスク

### ✅ R-XXX: タイトル

対処完了したリスクはこのセクションに移動。

---

## 過去事故再発監視カウンター

以下は過去事故の失敗パターン。各セッションで発生数を記録:

| 失敗パターン | 本セッション発生 | 累計 |
|-------------|---------------|------|
| {{FAILURE_PATTERN_1}} | 0 | 0 |
| {{FAILURE_PATTERN_2}} | 0 | 0 |
| {{FAILURE_PATTERN_3}} | 0 | 0 |

**目標**: 全パターンで累計 0 を維持。

---

## 実施記録 (Day 単位のプロジェクト進行ログ)

### D-001: プロジェクトキックオフ ({{START_DATE}})

**実施内容**:
- master-plan 初版作成
- SESSION_START / PHASE_STATUS / RISK_REGISTER 初版作成
- 原則 N 個確立

**成果物**:
- `memory/project-ops-master-plan.md`
- `memory/SESSION_START.md`
- `memory/PHASE_STATUS.md`
- 本ファイル

**次のアクション**: Phase 0 のタスクリストを PHASE_STATUS に展開

---

## 更新履歴

| 日付 | 更新内容 |
|------|--------|
| {{START_DATE}} | 初版作成、キックオフ時リスク登録 |
