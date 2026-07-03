# dev-foundation — PJ 固有規約

吉田敬悟さま標準のグローバル規約 (`~/.claude/CLAUDE.md`) を継承し、本 PJ 固有のルールを追記する。

## 0. 必ず最初に確認すること

1. Codex/AGENTS 共通規約: `/Users/keigoyoshida/AGENTS.md`
2. Claude Code グローバル規約: `~/.claude/CLAUDE.md` (敬語・絵文字禁止・ファクトベース・Ask 必須 27 項目 等)
3. 本 PJ の不変原則: `./constitution.md`
4. 進行中タスク: `../_meta/current-context.md`
5. 5 軸 owner: `../_meta/team-assignment.md`

## 1. PJ 帰属（~/.claude/reference/org-and-projects.md §14-2 5 軸 owner）

| 軸 | owner |
|----|-------|
| legal_owner | abstconc |
| billing_owner | abstconc |
| repo_owner | abstconc |
| data_owner | abstconc |
| credential_owner | abstconc |

## 2. デプロイ方式（グローバル CLAUDE.md §8／reference/org-and-projects.md §13 該当箇所を必ず明記）

- 反映方式: (要記入: git push / PR / 手動 deploy 等) (例: git push origin main → Vercel 自動 / PR ワークフロー / 手動 deploy)
- main 直接 push 可否: (要記入: 可 / PR 必須 / 不明) (例: 可 / PR 必須)
- CI/CD: (要記入: GitHub Actions / Vercel / なし 等)

不明な場合は **必ず吉田さまに確認** (推測で PR 作成しない、グローバル CLAUDE.md §8／reference/org-and-projects.md §13)。

## 3. L1 滞留プロトコル参照

本 PJ で HIGH RISK 操作 (本番 DB 変更 / 課金発生 / 外部組織送信 等) を行う場合、`~/.claude/CLAUDE.md` §20「24 時間待ちロジックの境界」を必ず確認。AI 自律判断による「冷却のため一晩寝かせる」は禁止、人間承認待ちの L1 滞留プロトコルは維持。

## 4. PJ 固有のルール

(本 PJ 固有のルールがあれば追記)

## 5. 関連ファイル

- グローバル規約: `~/.claude/CLAUDE.md`
- Codex/AGENTS 共通規約: `/Users/keigoyoshida/AGENTS.md`
- precious-mixing-cook plan: `~/.claude/plans/precious-mixing-cook-v05.md`
- L1 滞留 audit: `~/Desktop/_core/_org-knowledge/01_contexts/forced-wait-logic-audit.md`
