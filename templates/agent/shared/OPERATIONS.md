# Operations Guide

## 開発環境セットアップ

```bash
# 1. リポジトリクローン
git clone <repo-url>
cd tokusetu-page

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.example .env.local
# .env.local を編集（Supabase, Stripe, SendGrid等の値を設定）

# 4. Supabase ローカル起動（オプション）
npx supabase start

# 5. DBマイグレーション
npx supabase db push

# 6. 開発サーバー起動
npm run dev
```

## デプロイ手順

### Staging

```bash
git push origin staging
# Vercel Preview Deploymentが自動実行
```

### Production

```bash
git push origin main
# Vercel Production Deploymentが自動実行
```

### ロールバック

```bash
# Vercel Dashboard から Previous Deployment を Promote
# または
vercel rollback
```

## 障害対応フロー

| レベル             | 対応                           | タイムライン |
| ------------------ | ------------------------------ | ------------ |
| P0（全停止）       | 即座にロールバック、原因調査   | 15分以内     |
| P1（主要機能障害） | 影響範囲特定、ホットフィックス | 1時間以内    |
| P2（一部障害）     | 次回リリースで修正             | 24時間以内   |
| P3（軽微）         | バックログに追加               | 1週間以内    |

---

## 変更履歴

| 日付       | 変更内容 |
| ---------- | -------- |
| 2026/02/20 | 初版作成 |
