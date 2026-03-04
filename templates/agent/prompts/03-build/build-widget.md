# ウィジェット実装

> Input: ウィジェット関連の変更内容
> Output: widget/ 配下のコード変更 + テスト + サイズ確認
> 所要時間: 1〜3時間
> 特殊制約: 15KB以下、外部依存ゼロ、Vanilla JS

---

## ウィジェット固有ルール

| 制約           | 値                                                              |
| -------------- | --------------------------------------------------------------- |
| バンドルサイズ | 15KB以下 (gzip)                                                 |
| 外部ライブラリ | 禁止（Vanilla JSのみ）                                          |
| DOM操作        | Shadow DOM (closed mode)                                        |
| XSS対策        | DOM API の textContent 使用（innerHTML は escapeHtml 経由のみ） |
| 型共有         | `shared/widget-contracts.ts` 経由                               |

## 実装前チェック

1. `docs/26_バナーウィジェット仕様書.md` を読む
2. `shared/widget-contracts.ts` で型定義を確認
3. `widget/src/` の既存コードを読む（特に `index.ts`, `renderer.ts`, `styles.ts`）
4. 変更が `shared/widget-contracts.ts` に影響するか確認

## 実装後チェック

```bash
npm run widget:build     # ビルド成功
npm run widget:size      # 15KB以内
npm run test             # ウィジェットテスト通過
```

## 完了条件

- [ ] `npm run widget:build` 成功
- [ ] `npm run widget:size` → 15KB以内
- [ ] 既存のwidgetテスト全通過
- [ ] 新機能にテスト追加済み
- [ ] XSS安全（innerHTML使用箇所は escapeHtml 経由）
