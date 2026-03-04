# 運用監視セットアップ

> Input: なし（プロジェクトの監視体制を構築・確認）
> Output: 監視設定 + アラート設定 + ヘルスチェック
> 所要時間: 1〜2時間
> 参照: `docs/19_エラーカタログと監視ポリシー.md`, `docs/22_テレメトリとKPI定義一覧.md`

---

## 何をするか

プロダクトが本番で「壊れた」ときに、ユーザーから報告される前に自分たちで気付ける仕組みを作る。
お店のセキュリティカメラ + 火災報知器のようなもの。

---

## Phase 1: ヘルスチェックエンドポイント

アプリケーションが生きているか確認するためのAPIを用意する。

### 必要なヘルスチェック

| エンドポイント       | チェック内容           |
| -------------------- | ---------------------- |
| `/api/health`        | アプリ自体が応答するか |
| `/api/health/db`     | Supabaseに接続できるか |
| `/api/health/stripe` | Stripeに接続できるか   |

### レスポンス形式

```json
{
  "status": "healthy",
  "timestamp": "2026-03-04T10:00:00Z",
  "checks": {
    "database": "ok",
    "stripe": "ok"
  }
}
```

## Phase 2: エラー監視

### エラーログの構造化

全APIルートのエラーハンドリングが以下のパターンに従っているか確認:

```typescript
// ✅ 正しいパターン
try {
  // 処理
} catch (error) {
  console.error('[API名] エラー内容:', {
    path: request.url,
    method: request.method,
    error: error instanceof Error ? error.message : 'Unknown error',
    // ❌ スタックトレースやDB構造は本番ログに出さない
  })
  return NextResponse.json({ error: 'ユーザーにわかるメッセージ' }, { status: 500 })
}
```

### チェック項目

```bash
# 構造化されていないconsole.errorを検索
grep -rn "console.error" app/api/ --include="*.ts" -B2 -A2

# エラーレスポンスが内部情報を漏洩していないか
grep -rn "error.stack\|error.message" app/api/ --include="*.ts" | grep "json"
```

## Phase 3: パフォーマンス監視

### Vercel Analytics 確認

- Web Vitals（LCP, FID, CLS）が良好か
  - LCP（最大要素の表示時間）: < 2.5秒
  - FID（最初の操作への応答時間）: < 100ms
  - CLS（レイアウトのズレ具合）: < 0.1

### API応答時間

```bash
# APIルートの実行時間をログに出しているか確認
grep -rn "performance\|Date.now\|console.time" app/api/ --include="*.ts"
```

重要なAPIルート（バナー設定取得、LP表示等）には応答時間の計測を入れる。

## Phase 4: ビジネスメトリクス監視

`docs/22_テレメトリとKPI定義一覧.md` に基づき、以下が計測できているか確認:

| メトリクス              | 計測方法             | 確認方法       |
| ----------------------- | -------------------- | -------------- |
| バナー表示数            | ウィジェットイベント | ダッシュボード |
| CTR（クリック率）       | 表示数 / クリック数  | ダッシュボード |
| CVR（コンバージョン率） | クリック数 / CV数    | ダッシュボード |
| アクティブテナント数    | ログイン回数         | 管理者画面     |

## Phase 5: アラート設定

### Cron Jobs（定期実行タスク）

```bash
# Cron設定を確認
cat vercel.json | grep -A5 "crons"
```

定期実行が正常に動いているか確認:

- 週次ダイジェストメール配信
- その他の定期バッチ

### ダウンタイム通知

Vercelのステータス通知が有効か確認:

- デプロイ失敗時の通知
- ドメインSSL証明書の期限切れ通知

## Phase 6: 本番smoke テスト

```bash
# smoke テスト実行（本番環境の基本動作確認）
npm run smoke:prod
```

smoke テスト = 煙が出ていないか確認する最小限のテスト。
本番URLにアクセスして、主要画面が表示されるか、主要APIが応答するかだけ確認。

## 完了条件

- [ ] ヘルスチェックエンドポイント実装済み
- [ ] 全APIルートのエラーハンドリングが統一パターン
- [ ] エラーログに内部情報（スタックトレース、DB構造）が漏洩していない
- [ ] ビジネスメトリクス（表示数、CTR、CVR）が計測できている
- [ ] Cronジョブが正常稼働
- [ ] `npm run smoke:prod` 通過
