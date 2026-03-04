# 機能実装

> Input: `specs/{number}-{name}/tasks.md`
> Output: 実装コード + テスト + ビルド通過
> 所要時間: 2〜6時間（機能規模による）
> モード: プランモード必須

---

## 実装前チェック（省略禁止）

1. `.agent/shared/IMPLEMENTATION_STATUS.md` で現在地を確認
2. `specs/{number}-{name}/tasks.md` を読み、Phase順序を把握
3. `specs/{number}-{name}/plan.md` で技術アプローチとファイル一覧を確認
4. 関連する既存コードを読む（設計思想・パターン・命名規則を把握）
5. 影響範囲を特定し報告

## 実装ルール

### 基本姿勢

- tasks.md の Phase 順に進める（Phase 0 → 1 → 2 → 3 → 4）
- 1 Phase ずつ完了・検証してから次へ
- 既存コードの設計パターン・命名規則に厳密に従う
- 重複コードを書かない（既存の共通処理を探す）

### 各Phase完了時の検証

```bash
npm run build     # ビルド通過
npm run test      # テスト通過
npm run lint      # Lint通過
```

### 外部連携がある場合

- 既存のAPI連携パターン（認証方式、エラーハンドリング、リトライ）を踏襲
- レート制限・タイムアウト・フォールバックを考慮
- 環境変数が必要な場合は `.env.example` に追記

### コード品質基準

- TypeScript strict mode: エラー0件
- `any` 型禁止（`unknown` を使う）
- `console.log` 禁止（loggerを使う）
- エッジケース・エラーハンドリングを網羅
- セキュリティリスクのない実装

## 完了時

1. tasks.md のチェックボックスを `[x]` に更新
2. `.agent/shared/IMPLEMENTATION_STATUS.md` を更新
3. コミット: `feat({module}): {概要}`

## 完了条件

- [ ] tasks.md の全Phase完了
- [ ] `npm run build` 通過
- [ ] `npm run test` 通過
- [ ] `npm run lint` 通過
- [ ] 新規コードにテストが追加されている
- [ ] IMPLEMENTATION_STATUS.md 更新済み

## 禁止

- 既存コードを読まずに新規実装を始める
- TODO / FIXME / ハードコードを残す
- テストなしでの完了宣言
- 「とりあえず動く」状態での提出
