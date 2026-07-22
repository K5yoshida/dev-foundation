# {PROJECT NAME} — Claude Code Project Instructions

このファイルはプロジェクト固有の Claude Code 入口です。全AI共通の入口はプロジェクトrootの `AGENTS.md` です。

## 必読

1. `/Users/keigoyoshida/AGENTS.md`
2. `/Users/keigoyoshida/CLAUDE.md`
3. `/Users/keigoyoshida/.claude/CLAUDE.md`
4. `../AGENTS.md`
5. `../CLAUDE.md`
6. `.claude/constitution.md`
7. `.claude/01_docs/00_INDEX.md`
8. `.claude/02_specs/README.md`
9. `.claude/03_plans/PLANS.md`
10. `tasks/todo.md`
11. `tasks/lessons.md`

## プロジェクト概要

(1-3 lines: what this product is, who uses it, current phase)

## 技術スタック

(Framework / database / hosting / testing — one line each. Link to `../AGENTS.md` for full commands.)

## 開発ワークフロー

| 種類 | 役割 | 作成タイミング | 置き場 |
| --- | --- | --- | --- |
| docs | WHY + 全体WHAT | プロジェクト開始時に1回書き切る | `.claude/01_docs/` |
| specs | 個別機能のWHAT + HOW + UI/UX | その機能を実装する直前 | `.claude/02_specs/<feature>/` |
| plans | 実装の手順書 | 3ステップ以上のタスク | `.claude/03_plans/` |
| tasks | 現在のスプリント作業 | セッション開始・終了時 | `tasks/todo.md` |
| lessons | ミスと学習 | 再発防止が必要な時 | `tasks/lessons.md` |

## クイックリファレンス

| 目的 | ファイル |
| --- | --- |
| All-agent instructions | `../AGENTS.md` |
| Claude root entry | `../CLAUDE.md` |
| Immutable principles | `.claude/constitution.md` |
| 設計書ナビゲーター | `.claude/01_docs/00_INDEX.md` |
| Feature spec workflow | `.claude/02_specs/README.md` |
| プラン一覧 | `.claude/03_plans/PLANS.md` |
| Current tasks | `tasks/todo.md` |
| Mistakes & learnings | `tasks/lessons.md` |

## プロジェクト固有ルール

- 重要な変更前には「現状・問題・変更後の効果」を簡潔に説明してください。
- 推測でPR運用、deploy方式、DB変更、外部送信、料金影響を決めないでください。
- 秘密情報、APIキー、トークン、Cookie、PII は表示しないでください。
- 破壊的操作、本番影響、DB変更、外部送信、commit / push / deploy は事前確認してください。
- Codex と引き継ぐ作業文脈は、秘密情報とPIIを除外して `/Users/keigoyoshida/Desktop/_core/_org-knowledge/03_claude-handoff/ai-handoff/` に要約してください。
