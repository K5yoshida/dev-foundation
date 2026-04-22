# Claude Ops Framework (COF)

> **長期プロジェクトで AI (Claude Code) を安全に活用するための運用 OS**

---

## このフレームワークが解決する問題

AI は 1 セッションごとに記憶をリセットします。数週間〜数ヶ月に及ぶ長期プロジェクトで
AI と協働する時、以下の問題が必ず発生します:

- **前回何をやったか覚えていない** → 同じ調査を繰り返す
- **過去の失敗を忘れる** → 同じ事故を繰り返す
- **判断基準がセッションごとに揺らぐ** → 意思決定の一貫性なし
- **リスクの高い操作の承認フローが曖昧** → 本番事故リスク
- **レビューが自己完結** → 盲点見逃し

COF は**「人間と AI が共同で更新する構造化ドキュメント」**で、これらを解決します。

---

## 4 つの核心コンセプト

### 1. セッション間記憶システム

`memory/` ディレクトリに**プロジェクト台帳**を置き、AI が毎セッション冒頭で読む。
人間が読んでも意味がわかる普通のマークダウンで書くため、属人化しない。

```
memory/
├── MEMORY.md              # トップインデックス (毎セッション自動読込)
├── project-ops-master-plan.md  # プロジェクト憲法
├── SESSION_START.md       # 開始時チェックリスト
├── PHASE_STATUS.md        # 現在地マップ
├── RISK_REGISTER.md       # リスク + 実施記録台帳
└── handoff-YYYY-MM-DD.md  # 日次引き継ぎプロンプト
```

詳細: [docs/concepts/session-memory.md](docs/concepts/session-memory.md)

### 2. 5 段階リスク分類

操作の不可逆性で L0〜L4 の 5 段階に分け、承認フローをレベル別に設計。

| Lv | ラベル | 例 (開発プロジェクト) | 承認 |
|----|--------|----------------------|------|
| L0 | 🔴 IRREVERSIBLE | DB DELETE、本番マイグレ適用、git push --force | 対面協議 + 人間実行 |
| L1 | 🟠 HIGH RISK | 本番 UPDATE、staging→本番昇格、新マイグレ作成 | 個別事前承認 + 24h滞留 + 週上限 |
| L2 | 🟡 MID RISK | コード変更、ローカルマイグレ、staging INSERT | Phase 着手時一括承認 |
| L3 | 🟢 LOW | ドキュメント、memory 更新、小サンプル SELECT | 事後報告のみ |
| L4 | ⚪ READ ONLY | 調査、Read / Grep / Glob | 無制限 |

**分類が曖昧なら 1 段上を採用**。

詳細: [docs/concepts/five-level-risk.md](docs/concepts/five-level-risk.md)

### 3. 多層 Red Team レビュー

同一モデルの自己レビューは盲点を見落とすため、**敵対的サブエージェント + 異質モデル** で多層検証。

```
Round 1: 4 High + 4 Medium 出る想定
  ↓ 全反映
Round 2: 2 High + 1 Medium
  ↓ 全反映
Round 3: Critical 0 + High 0 に収束 (目安)
```

**リワーク上限 3 回まで**。4 回目以降はスコープ縮小を検討 (詳細: [docs/concepts/multi-layer-review.md](docs/concepts/multi-layer-review.md))。

詳細: [docs/concepts/multi-layer-review.md](docs/concepts/multi-layer-review.md)

### 4. セッション冒頭 3 点復唱

AI の思考の土台を毎回リセットするため、セッション開始時に**最重要原則を 3 つ復唱**させる。

例 (プロジェクトによって内容は変える):

1. 過去事故: 「〇〇の失敗を繰り返さない」
2. 最上位原則: 「△△ > ××」
3. 順序原則: 「まず □□、〇〇は後段」

詳細: [docs/concepts/three-point-recital.md](docs/concepts/three-point-recital.md)

---

## 導入方法

### 新規プロジェクトに導入

```bash
cd ~/Desktop/my-new-project
bash ~/Desktop/dev-foundation/templates/claude-ops-framework/scripts/init-cof.sh
```

対話形式でプロジェクト名・最上位原則・過去事故などを入力すると、
`.claude/` と `memory/` にテンプレートが展開されます。

詳細: [INSTALL.md](INSTALL.md)

### 既存プロジェクトに追加

既に `.claude/` がある場合は、手動マージが必要です。[INSTALL.md](INSTALL.md) の
「既存プロジェクトへの追加」セクションを参照してください。

---

## 向いているプロジェクト

- ✅ 数週間〜数ヶ月以上の長期開発
- ✅ 失敗が許されない (本番データ・顧客影響あり)
- ✅ 複数セッションにまたがる意思決定が必要
- ✅ 過去事故の教訓を組織的に継承したい
- ✅ AI と人間の責任分界点を明確化したい

### 向いていないプロジェクト

- ❌ 数時間で終わる単発タスク (過剰装備)
- ❌ 完全にリスクフリーなプロトタイピング
- ❌ 人間が全ての判断を AI に委ねたい (承認フローが面倒)

---

## 既存 dev-foundation テンプレートとの関係

| 領域 | 担当テンプレート |
|---|---|
| **設計・実装支援** (specs, hooks, design-system) | `templates/.claude/` (既存) |
| **AI 生成コードレビュー** (AI_GOVERNANCE) | `templates/agent/shared/` (既存) |
| **長期プロジェクト運用 OS** (handoff, risk, memory) | `templates/claude-ops-framework/` (本パッケージ) |

3 領域は独立しており、必要に応じて組み合わせて使えます。

---

## 実績

- **MEDICA SOERUTE** (Project Apex、2026-04〜): 18-24週間の長期データ基盤改善プロジェクトで本フレームワークを運用中。Day 0A 封じ込めで 7 コミット/日、6 ラウンド Red Team レビュー、Codex Stop hook 2 回対処を完走。

---

## ライセンス

内部利用 (吉田敬悟の開発環境専用)。将来的に OSS 公開を検討。
