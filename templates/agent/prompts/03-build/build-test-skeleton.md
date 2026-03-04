# テスト骨格作成（Phase 0）

> Input: `specs/{number}-{name}/plan.md` の Test Strategy セクション
> Output: テストファイル骨格（describe blocks + .todo() テストケース）
> 所要時間: 30分
> タイミング: 実装コードを書く**前に**実行

---

## 目的

テストファイルを実装コードより先に作る。空のテストケース（`.todo()`）を定義することで:

1. 何をテストすべきかが明確になる
2. 実装中に「これテストあったっけ」と迷わない
3. テストカバレッジの目標が最初から見える

## 手順

### Step 1: plan.md の Test Strategy を読む

テスト対象:

- ユニットテスト（ビジネスロジック、ユーティリティ）
- APIテスト（各エンドポイントの 200/401/400/404）
- E2Eテスト（主要ユーザーフロー）

### Step 2: テストファイル作成

```typescript
// tests/{feature-name}.test.ts
import { describe, it } from 'vitest'

describe('{Feature Name}', () => {
  describe('Happy path', () => {
    it.todo('正常な入力で期待通りの結果を返す')
    it.todo('複数データがある場合も正しく処理する')
  })

  describe('Error cases', () => {
    it.todo('不正な入力でエラーを返す')
    it.todo('存在しないIDでエラーを返す')
  })

  describe('Edge cases', () => {
    it.todo('0件の場合の挙動')
    it.todo('上限値の場合の挙動')
  })
})
```

### Step 3: 検証

```bash
npm run test  # .todo() テストは pending になるがfailしない
```

## 完了条件

- [ ] テストファイル作成済み
- [ ] `npm run test` 実行成功（pending tests あり、fail 0）
- [ ] tasks.md の Phase 0 チェックボックス更新済み
