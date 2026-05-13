# dev-foundation — Team Assignment（5 軸 owner）

本 PJ の組織帰属を 5 軸で確定する。CLAUDE.md §14-2「5 軸 owner モデル」準拠。

## 5 軸 owner

| 軸 | owner | 値の選択肢 | 備考 |
|----|-------|------------|------|
| **legal_owner** | abstconc | `abstconc` / `cyxen` | 契約・法務責任の組織 |
| **billing_owner** | abstconc | `abstconc` / `cyxen` / `personal` | 課金請求先 |
| **repo_owner** | abstconc | GitHub org / username | コード所有 |
| **data_owner** | abstconc | `abstconc` / `cyxen` / `customer` | PII / 機密データ責任 |
| **credential_owner** | abstconc | `abstconc` / `cyxen` | API key / Keychain entry の組織 |

## 確定根拠

(要記入: 5 軸 owner 確定の根拠)

## 変更履歴

| Date | 変更前 → 変更後 | 理由 |
|------|----------------|------|
| 2026-05-11 | - → 初版 | init-project 自動生成 + AskUserQuestion で吉田さま判断 |

## 関連

- グローバル規約: `~/.claude/CLAUDE.md` §14-2 5 軸 owner モデル
- precious-mixing-cook plan: `~/.claude/plans/precious-mixing-cook-v05.md` §2 / §16-1
