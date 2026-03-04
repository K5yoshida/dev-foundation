# Troubleshooting Guide

## よくあるエラーと対処法

### 1. Supabase接続エラー

**症状**: `Invalid API key` または `connection refused`

**対処**:

```bash
# 環境変数を確認
grep SUPABASE .env.local

# anon keyでアクセスできない場合はservice_role_keyを試す
# RLS有効テーブルはservice_role_keyが必要な場合がある
```

### 2. ウィジェットが表示されない

**確認手順**:

1. ブラウザのDevTools → Console でエラー確認
2. Network タブで widget.js の読み込み確認
3. API呼び出し（/api/widget/config）の応答確認
4. テナントID（data-tenant-id）が正しいか確認
5. 許可ドメインの設定確認

### 3. Stripe Webhookエラー

**症状**: Webhook署名検証失敗

**対処**:

```bash
# ローカル開発時
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# STRIPE_WEBHOOK_SECRET が stripe listen の出力と一致するか確認
```

### 4. ビルドエラー

**症状**: `npm run build` 失敗

**対処**:

```bash
# 型チェック
npx tsc --noEmit

# Lintチェック
npm run lint

# node_modules再インストール
rm -rf node_modules && npm install
```

### 5. RLSエラー（データが取得できない）

**症状**: API呼び出しで空配列が返る

**確認**:

1. Supabase Dashboard → Authentication でログインユーザーのUUID確認
2. tenant_members テーブルにユーザーとテナントの紐付けがあるか確認
3. RLSポリシーの条件を確認

---

## 変更履歴

| 日付       | 変更内容 |
| ---------- | -------- |
| 2026/02/20 | 初版作成 |
