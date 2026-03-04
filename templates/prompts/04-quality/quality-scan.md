# 品質スキャン

> Input: なし（プロジェクト全体を走査）
> Output: 問題リスト + 修正
> 所要時間: 1〜2時間

---

## 5フェーズ

### Phase 1: 静的解析
```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

### Phase 2: コード品質
- any 型の使用箇所
- console.log の残存
- 未使用の変数・インポート
- 重複コード

### Phase 3: セキュリティ
- 認証チェック漏れ
- 入力バリデーション漏れ
- 機密情報の漏洩

### Phase 4: パフォーマンス
- N+1問題
- 不要な再レンダリング
- バンドルサイズ

### Phase 5: 修正
Critical → High → Medium の順に修正。

## 完了条件
- [ ] 全自動チェック通過
- [ ] Critical / High 問題 0件
