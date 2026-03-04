# デプロイチェックリスト

> Input: なし（デプロイ前に自動実行）
> Output: デプロイ可否判定 + 必要なら修正
> 所要時間: 30分〜1時間
> タイミング: Vercelへのデプロイ前

---

## 何をするか

本番環境にコードを出す前の最終チェック。飛行機の離陸前点検と同じ。1つでもNGなら飛ばない。

---

## Phase 1: ビルド＆テスト

```bash
# 全て通過が必須
npm run build          # ビルドが通るか
npm run typecheck      # TypeScript型エラーがないか（tsc = TypeScript Compiler）
npm run lint           # コードスタイル違反がないか
npm run test           # テストが全て合格するか
```

1つでも失敗 → 修正してから再実行。デプロイ禁止。

## Phase 2: ウィジェットチェック

```bash
npm run widget:build   # ウィジェットJSをビルド
npm run widget:size    # サイズが15KB以内か確認
```

ウィジェットは外部サイトに埋め込むJSなので、サイズが大きいとお客さんのサイトが遅くなる。

## Phase 3: 環境変数チェック

```bash
# 本番に必要な環境変数が全てVercelに設定されているか
# （ローカルの .env.local と Vercel の環境変数を突き合わせ）
```

必須環境変数:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `SENDGRID_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_WIDGET_CDN_URL`

## Phase 4: マイグレーションチェック

新しいDBマイグレーションがある場合:

```bash
# マイグレーションファイルの確認
git diff main --name-only | grep "supabase/migrations"
```

マイグレーションがある場合:

1. マイグレーションの中身をレビュー（破壊的変更がないか）
2. ロールバック手順を確認
3. `npx supabase db push` を本番で実行（デプロイ前に）

## Phase 5: セキュリティ最終チェック

```bash
# 機密情報がコードに含まれていないか
grep -rn "sk_live\|whsec_\|SG\.\|service_role" app/ components/ lib/ --include="*.ts" --include="*.tsx"

# npm audit
npm audit --production
```

## Phase 6: デプロイ判定

| チェック                 | 結果       |
| ------------------------ | ---------- |
| ビルド通過               |            |
| 型エラー 0件             |            |
| Lintエラー 0件           |            |
| テスト全通過             |            |
| ウィジェット 15KB以内    |            |
| 環境変数設定済み         |            |
| マイグレーション確認済み |            |
| 機密情報漏洩なし         |            |
| **デプロイ判定**         | GO / NO-GO |

### GO の場合

```bash
git push origin main
# Vercelが自動デプロイ
```

### NO-GO の場合

ブロッカーを修正し、Phase 1 から再実行。

## Phase 7: デプロイ後確認

デプロイ完了後、本番環境で以下を確認:

```bash
npm run smoke:prod     # 本番smoke通過（本番URLにアクセスして基本機能が動くか確認するスクリプト）
```

- [ ] トップページが表示される
- [ ] ログインできる
- [ ] ダッシュボードが表示される
- [ ] APIが応答する

問題があれば即座にロールバック（Vercelダッシュボードから前のデプロイに戻す）。
