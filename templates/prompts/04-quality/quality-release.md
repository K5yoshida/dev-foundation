# リリース前品質チェック

> Input: なし
> Output: リリース判定（GO / NO-GO）
> 所要時間: 2〜4時間

---

## Phase 1: 自動チェック

```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

## Phase 2: 手動レビュー
- セキュリティ: 認証チェック漏れ、機密情報漏洩
- データ整合性: マイグレーションの破壊的変更
- エッジケース: 0件、大量データ、同時操作

## Phase 3: リリース判定

| チェック | 結果 |
|---------|------|
| 全自動チェック通過 | |
| セキュリティ問題なし | |
| データ整合性問題なし | |
| Business Impact Hypothesis 記載済み | |
| Ship & Learn Plan 記載済み | |
| **リリース判定** | GO / NO-GO |
