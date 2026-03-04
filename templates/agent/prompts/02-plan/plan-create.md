# スペック→プラン変換

> Input: 承認済みの `specs/{number}-{name}/spec.md`
> Output: `plan.md` + `tasks.md` の更新・詳細化
> 所要時間: 30分〜1時間
> 用途: spec-create で3ファイル一括作成した後、人間がspec.mdをレビュー・承認した後にplan/tasksを精密化する場合に使用

---

## 手順

### Step 1: spec.md を読み込む

承認済みの spec.md から以下を抽出:

- Data Model Changes → DB変更の詳細設計に展開
- API Changes → エンドポイント設計に展開
- UI/UX Requirements → コンポーネント設計に展開
- Test Design → テストファイル設計に展開

### Step 2: 既存コードベースを調査

- `app/api/` で既存APIパターン（認証チェック、エラーハンドリング、レスポンス形式）を把握
- `components/` で既存UIパターン（レイアウト、共通コンポーネント）を把握
- `lib/` で既存ユーティリティを把握（重複実装を避ける）
- `tests/` で既存テストパターンを把握

### Step 3: plan.md を精密化

- Technical Approach: 具体的なライブラリ・パターン選択を記載
- Files to Create / Modify: `app/api/xxx/route.ts` のような具体パスで記載
- Dependencies: 他スペックとの依存関係を明記
- Risk / Mitigation: 技術的リスクと対策

### Step 4: tasks.md を精密化

- 各タスクの粒度を「1〜2時間で完了する」サイズに分割
- `[P]` マーカーの見直し（本当に並列実行可能か確認）
- 各Phaseの完了条件を具体的に

## 完了条件

- [ ] plan.md のFiles to Create/Modifyが全て具体パス
- [ ] tasks.md の各タスクが1〜2時間粒度
- [ ] 既存コードとの重複がないことを確認済み
