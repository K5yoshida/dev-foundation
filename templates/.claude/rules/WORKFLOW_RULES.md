# ワークフロー運用ルール（汎用テンプレート）

> このファイルはプロジェクト非依存の運用ルール。
> Claude Code がセッション開始時に毎回読み込むこと。
> 個人作業習慣（敬語など）は `~/.claude/CLAUDE.md`、不変原則は `.claude/constitution.md` を参照。
> Portability: プロジェクト固有の用語やブランド名を含まない。

---

## ルール 1 — プランモード時は AskUserQuestion を積極使用

プランモード（3ステップ以上のタスク）に入ったら、判断が割れる箇所では**勝手に決めず必ず `AskUserQuestion` で吉田に選ばせる**。

### 使うべき場面

- 配置先・ディレクトリ構造の選択
- 削除/保持の判断（既存資産を消すかどうか）
- スコープの確定（どこまでを今回の作業に含めるか）
- 設計上の二択以上（ライブラリ選定、認証方式、データフロー方向）
- 既存ファイルを上書き・移動する前

### 避けるべき場面

- 単純な表記揺れ・タイプミス（自分で直してよい）
- 計画の最終承認（→ `ExitPlanMode` を使う）
- 「進めていいですか？」型の確認（既に許可されている時は再確認しない）

### 書き方の鉄則

- 選択肢には必ず「(Recommended)」を付けた**推奨を1つ**含める
- 各選択肢に「メリット・デメリット」を1〜2文で添える
- 「Other」は自動付与されるので含めない
- 1問あたり選択肢は2〜4個まで

---

## ルール 2 — Codex レビューゲート（ドキュメント類作成後は必ずレビュー）

**プラン・仕様書・設計書・メモリ・タスク台帳など「ドキュメント類」を作成または大幅更新した後は、必ず Codex レビューを実行してから完了報告する**。実装コードと違って構造化テストが効かないため、Codex の独立した目で論理矛盾・抜け漏れを検出させる。

### レビュー必須対象

| 種別 | パス例 |
|------|--------|
| 実装計画書 | `.claude/03_plans/*.md` |
| 仕様書3点セット | `.claude/02_specs/*/spec.md`, `plan.md`, `tasks.md` |
| 上流設計書 | `.claude/01_docs/*.md`, `docs/*.md` |
| メモリ・進捗台帳 | `tasks/lessons.md`, `IMPLEMENTATION_STATUS.md` |
| プロジェクトCLAUDE.md/AGENTS.md/constitution.md | 大幅変更時 |

### 呼び出し方（ローカル `/codex-review` プラグイン）

結果が `.claude/codex-reviews/` に保存されるため、こちらを主に使う。

```
# 直近のステージ差分をレビュー（デフォルト）
/codex-review:codex-review staged

# 指定ブランチとの差分をレビュー
/codex-review:codex-review branch [base_ref]

# 特定ファイル群を直接レビュー
/codex-review:codex-review file path/to/doc1.md path/to/doc2.md
```

未セットアップ時は `/codex:setup` で初期化を案内する。

### 補助的な使い分け

- `/codex:review` — 公式プラグイン。結果保存なし、出力をそのまま返す軽量版
- `/codex:adversarial-review` — 敵対的視点で論理破綻を突きにいく深堀り版
- `/codex:rescue` — 行き詰まった時の調査・修正依頼（レビューではなく実装委譲）

### レビュー後の振る舞い

1. Codex の出力は **そのまま吉田に提示する**（要約・改変しない）
2. 指摘の対応可否は吉田に判断を仰ぐ（勝手に修正しない）
3. 「軽微な指摘のみ」「重大な指摘あり」程度のサマリは付けてよい
4. 保存先パス（`.claude/codex-reviews/...`）も併記する

### スキップしてよい例外

- 既存ドキュメントの誤字修正・1〜2行の軽微更新
- README の一行追記など、明らかにレビュー価値が低い変更
- ユーザーから「Codexレビューはスキップ」と明示された時

---

## ルール 3 — CLAUDE.md は `.claude/CLAUDE.md` に配置

プロジェクト固有のルールは `.claude/CLAUDE.md` に置く（root `CLAUDE.md` は使わない）。

- グローバル: `~/.claude/CLAUDE.md`（個人作業習慣）
- プロジェクト固有: `<project>/.claude/CLAUDE.md`（プロジェクト概要・技術スタック・固有ルール）
- マルチエージェント共通: `<project>/AGENTS.md`（root配置・Claude Code以外も読む）
- 不変原則: `<project>/.claude/constitution.md`（10条・dev-foundation由来）

これによりグローバルとプロジェクトの分離が明確になり、Claude Code のCLAUDE.md自動ロード経路が一意になる。
