# デザインシステムルール（汎用テンプレート）

> このファイルはプロジェクト非依存の汎用ルール。
> プロダクト固有の色やブランドは各プロジェクトの CLAUDE.md でオーバーライドする。
> Portability: プロジェクト固有の用語やブランド名を含まない。

---

## フォント

```
font-family: Inter, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
```

- 英数字: Inter（UI/データ表示に最適化。Variable Font対応）
- 日本語: Noto Sans JP（7ウェイト。Variable Font対応）
- 数値表示: `tabular-nums` クラスで等幅数字（桁が揃う）
- 見出し: line-height 1.3, letter-spacing 0.02em
- 本文: line-height 1.7, letter-spacing 0.02em（日本語混在環境）
- font-feature-settings: `"cv02" 1, "cv03" 1, "cv04" 1`（Inter最適化グリフ）

### 根拠
- Inter: Shopify Polaris, Linear, GitHub Primer が採用
- Noto Sans JP: Google + Adobe共同開発。日本語フォントで最も品質が高い
- line-height 1.7: 英語（1.5）と日本語（1.8）の中間値。混在環境での最適解
- letter-spacing 0.02em: 日本語はデフォルトだと詰まって見える。Polaris準拠

## フォントサイズ（絶対ルール）

| Tailwindクラス | サイズ | 用途 |
|---------------|--------|------|
| text-xs | 12px | **最小**。補助バッジ・タイムスタンプのみ |
| **text-sm** | **14px** | **本文・ラベル・テーブル（デフォルト）** |
| text-base | 16px | セクション見出し |
| text-lg | 18px | カードタイトル |
| text-xl | 20px | ページ見出し |
| text-2xl | 24px | KPI数値・大きな指標 |
| text-3xl | 30px | ヒーロー数値 |

### 禁止
- `text-[11px]`, `text-[10px]`, `text-[9px]` — 完全禁止
- `fontSize: 10` 以下（SVG内含む）— 完全禁止
- 最小は `text-xs`(12px)。それ未満は理由を問わず使用不可

### 根拠
- Primer(GitHub), Carbon(IBM), Polaris(Shopify), Ant Design: 全て最小12px
- WCAG 2.2: テキストは200%拡大で破綻しないこと。12px未満は拡大しても読みにくい
- B2B SaaSのユーザー層（40-60代の管理者も多い）には小さい文字が致命的

## カラー階層

| 用途 | 最低限の濃さ | 例 |
|------|-------------|-----|
| 見出し | gray-900 | 最も濃い |
| 本文 | gray-700 | 読みやすい |
| ラベル・補助 | gray-500 | これが下限 |
| プレースホルダー | gray-400 | これのみ薄い色を許容 |
| 無効状態 | gray-400 | disabled UI |

### 禁止
- `text-gray-300`, `text-gray-400` をアクティブなテキストに使用（プレースホルダー・disabled以外）
- `style={{ color: '#xxx' }}`（インラインスタイル）
- `text-[#xxx]`（Tailwindの任意値で色を直指定）

### 根拠
- WCAG AA: 通常テキストのコントラスト比 4.5:1 以上が必要
- gray-400 (#a1a1aa) は白背景で 3.5:1（AA非準拠）。大テキスト(18px+)のみ許容

## スペーシング

| 用途 | クラス |
|------|--------|
| ページルート | `px-4 py-4 sm:px-8 sm:py-6`（必須） |
| セクション間 | `space-y-6` |
| カード内パディング | `p-5` または `p-6` |
| テーブルヘッダー | `px-3 py-2.5` |
| テーブル行 | `px-3 py-2` |

### 根拠
- 4pxベースグリッド: Polaris, Primer, Ant Design と同じ
- Tailwindのデフォルトスペーシングをそのまま使用（カスタム不要）

## アイコン

- 最小: `h-4 w-4`
- `h-3`, `h-3.5` は禁止
- ボタン内: `h-4 w-4`
- ヒーロー/KPI: `h-5 w-5` 以上

## ボタン

- 最小高さ: `h-8` (32px)
- `h-7` (28px) 以下は禁止
- 重要アクション: `size="default"` — size="sm" は補助ボタンのみ

## コンポーネント

1. shadcn/ui の既存コンポーネントを優先使用
2. なければ Tailwind CSSで構築（インラインスタイル禁止）
3. 新規コンポーネント作成前に `src/components/ui/` を確認

## グリッド

- カードグリッド: `grid-cols-2` を基本（3列以上は慎重に）
- KPIカード: `grid-cols-2 lg:grid-cols-4`

## UIラベル

- 日本語プロダクトでは必ず日本語ラベル
- 英語の内部名称（例: "Parse Rate"）をそのまま表示しない
- 技術用語は避け、ユーザーの言葉を使う

## ESLint強制（推奨設定）

```json
{
  "no-restricted-syntax": [
    "warn",
    {
      "selector": "Literal[value=/text-\\[(?:[0-9]|1[01])px\\]/]",
      "message": "Design System違反: text-[11px]以下は禁止。最小はtext-xs(12px)。"
    }
  ]
}
```

## globals.css に追加すべき設定

```css
body {
  line-height: 1.7;
  letter-spacing: 0.02em;
  font-feature-settings: "cv02" 1, "cv03" 1, "cv04" 1;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "cv02" 1, "cv03" 1, "cv04" 1;
}

h1, h2, h3, h4, h5, h6 {
  line-height: 1.3;
  letter-spacing: 0.02em;
}
```

## tailwind.config.ts に追加すべき設定

```typescript
fontSize: {
  'xs':   ['0.75rem',  { lineHeight: '1rem' }],     // 12px
  'sm':   ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  'base': ['1rem',     { lineHeight: '1.5rem' }],   // 16px
  'lg':   ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],  // 20px
  '2xl':  ['1.5rem',   { lineHeight: '2rem' }],     // 24px
  '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
  '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],   // 36px
},
```
