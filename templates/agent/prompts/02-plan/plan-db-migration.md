# DB設計＆マイグレーション

> Input: `specs/{number}-{name}/spec.md` の Data Model Changes セクション
> Output: マイグレーションSQL + RLSポリシー + TypeScript型定義更新
> 所要時間: 30分〜1時間
> モード: プランモード推奨

---

## 手順

### Step 1: 既存スキーマ把握

1. `docs/12_DB一覧.md` で全テーブル構造を確認
2. `supabase/migrations/` で適用済みマイグレーションを確認
3. `lib/supabase/` で既存の型定義を確認

### Step 2: 差分設計

spec.md の Data Model Changes に基づき:

- 新規テーブル / 新規カラム / 変更カラム / 削除カラムを一覧化
- 外部キー制約、UNIQUE制約、CHECK制約を設計
- インデックス設計（検索パフォーマンスを考慮）

### Step 3: マイグレーションSQL作成

ファイル名: `supabase/migrations/YYYYMMDDHHMMSS_{description}.sql`

含めるもの:

- テーブル作成/変更のDDL
- RLSポリシー（`tenant_id = auth.jwt()->>'tenant_id'` パターン）
- インデックス
- 必要に応じてシードデータ

### Step 4: RLSポリシー設計

全テーブルに必須。パターン:

```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table}_tenant_isolation" ON {table}
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
```

### Step 5: 型定義更新

- Supabase CLI で型を再生成: `npx supabase gen types typescript`
- または手動で `lib/supabase/database.types.ts` を更新

### Step 6: 設計書同期

- `docs/12_DB一覧.md` を更新（自然な統合で）

## 完了条件

- [ ] マイグレーションファイル作成済み
- [ ] 全新規テーブルにRLSポリシーあり
- [ ] `npx supabase db push` 成功（ローカル確認可能な場合）
- [ ] 型定義が最新
- [ ] `docs/12_DB一覧.md` 更新済み

## 禁止

- RLSポリシーなしのテーブル作成
- `public` スキーマ以外への直接アクセス（`service_role` 経由のみ）
- テナント間データアクセスを許す設計
