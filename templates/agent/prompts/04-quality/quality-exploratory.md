# 探索的打鍵テスト（AI Vision × ペルソナ）

> Input: テスト対象のプロジェクト（Next.js + Supabase）
> Output: ペルソナ別E2Eテスト一式 + テスト実行 + 問題レポート
> 所要時間: 2〜4時間（初回セットアップ込み）
> フレームワーク: Playwright + OpenAI Vision API

---

## 概要

「AIの目」でスクリーンショットを見て、ペルソナごとに「初見のユーザーが迷わないか」「エラーが放置されていないか」を自動評価する探索的打鍵テスト。

従来のE2E（`quality-e2e.md`）が「壊れていないか」を検証するのに対し、こちらは **「使いにくくないか」** を検証する。

## テンプレート

`templates/test/e2e/exploratory/` に一式が用意されている。

## Phase 1: ペルソナ設計（最重要）

プロジェクトの **実際のユーザー層** をヒアリングし、3〜5人のペルソナを設計する。

```typescript
// 各ペルソナに必要な属性
interface Persona {
  role: string;           // 識別子（例: "junior_sales"）
  label: string;          // 表示名（例: "新人営業マン"）
  email: string;          // テスト用メールアドレス
  appRole: string;        // アプリ内の権限ロール
  description: string;    // AIが行動判断に使う特徴説明（性格・行動パターン）
  patience: number;       // 待機許容秒数（超えたら「遅い」判定）
  techLiteracy: string;   // ITリテラシーレベル（low / medium / high）
}
```

### ペルソナ設計のコツ

| 属性 | 値の選び方 | 発見できる問題 |
|------|-----------|---------------|
| patience: 3 | 経営層、ベテラン | ローディング速度の問題 |
| patience: 10 | 新人、非IT | 忍耐強いが迷いやすい |
| techLiteracy: low | 初回ユーザー | UIラベルの分かりにくさ |
| techLiteracy: high | パワーユーザー | ショートカット不足、効率問題 |
| appRole が違う | 管理者 vs 一般 | 権限の漏れ、メニュー出し分け |

**必ず1人は「ITリテラシーが低い新人」を含める。** このペルソナが最も多くのUX問題を発見する。

## Phase 2: シナリオ設計

各ペルソナの **主要業務フロー** を5〜8シナリオ作成する。

```typescript
interface Scenario {
  id: string;                        // 一意ID（例: "S01"）
  title: string;                     // タイトル
  goal: string;                      // ゴール（人間語）
  startPage: string;                 // 開始URL
  expectedFlow: FlowStep[];          // 操作ステップ
  cognitiveCheckpoints: CognitiveCheckpoint[];  // AI認知チェック
  successCriteria: string[];         // 成功条件
  uxQualityChecks: string[];         // UX品質チェック項目
  timeout: number;                   // タイムアウト（ms）
}
```

### FlowStep アクション一覧

| action | target | value | 用途 |
|--------|--------|-------|------|
| `navigate` | URL | - | ページ遷移 |
| `click` | セレクタ | - | クリック |
| `type` | セレクタ | 入力値 | テキスト入力 |
| `wait` | - | ミリ秒 | 待機 |
| `screenshot_check` | - | - | スクリーンショット撮影+AI分析 |
| `assert_visible` | セレクタ | - | 要素の表示確認 |
| `assert_not_visible` | セレクタ | - | 要素の非表示確認 |
| `select` | セレクタ | 選択値 | プルダウン選択 |
| `viewport` | - | "WxH" | 画面サイズ変更 |

### aiCheck（AI認知チェック）の書き方

良い質問の例:
- 「ログインフォームが表示されているか？『合言葉』というラベルの意味が初見で分かるか？」
- 「初見のユーザーが次に何をすべきか明示されているか？」
- 「エラーメッセージが『何が間違っているか』を明確に伝えるか？」

悪い質問の例:
- 「ページが表示されているか？」（具体性が低い）
- 「正常か？」（判断基準がない）

### シナリオ設計の鉄則

1. **ログインから始める**: S01は必ずログインフロー
2. **失敗パスも含める**: ログイン失敗、検索結果0件、権限エラー
3. **認知チェックポイント**: 各シナリオに1〜3個の「初見でわかるか？」質問
4. **業務順序を守る**: ペルソナの実際の作業順にシナリオを並べる

## Phase 3: テンプレートの適用

### 3-1. テンプレートファイルをコピー

```bash
cp -r templates/test/e2e/exploratory/ e2e/
```

### 3-2. プロジェクトの認証方式に合わせて auth.ts を修正

テンプレートの `auth.ts` は合言葉認証を前提にしている。プロジェクトに合わせて以下を変更:
- `loginAsPersona()` — ログインAPI呼び出し
- `fetchCurrentPassphrase()` → パスワード/OAuth等に変更
- Cookie名 (`session_token`) → プロジェクトのセッション管理に合わせる

### 3-3. ペルソナ定義を書く（auth.ts の PERSONAS）

### 3-4. シナリオファイルを作成（scenarios/[persona].spec.ts）

### 3-5. package.json にスクリプト追加

```json
{
  "scripts": {
    "e2e:exploratory": "playwright test --config=e2e/playwright.config.ts",
    "e2e:setup-users": "npx tsx e2e/setup-test-users.ts"
  }
}
```

## Phase 4: 実行と問題修正

```bash
# 全ペルソナ実行
npm run e2e:exploratory

# 特定ペルソナのみ
npm run e2e:exploratory -- --project=junior-sales

# UIモード（ブラウザ表示あり）
npm run e2e:exploratory -- --headed

# レポート表示
npx playwright show-report e2e/reports
```

### 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `E2E_BASE_URL` | 任意 | テスト対象URL（デフォルト: localhost:3000） |
| `OPENAI_API_KEY` | 任意 | Vision API用（なくても基本テストは動く） |
| `E2E_ENABLE_VISION` | 任意 | `false` でVision分析を無効化 |

## Phase 5: 問題の分類と修正

テスト結果から検出された問題を分類:

| 優先度 | カテゴリ | 対応 |
|--------|---------|------|
| High | bug（エラー表示、画面崩れ） | 即修正 |
| High | UX（初見で操作できない） | 即修正 |
| Medium | improvement（分かりにくいラベル） | 次スプリント |
| Low | feature（あったら嬉しい機能） | バックログ |

## 完了条件

- [ ] 3人以上のペルソナが定義されている
- [ ] 各ペルソナに5シナリオ以上
- [ ] 全シナリオが通過（赤テストなし）
- [ ] Vision分析で検出された High 問題が全て修正済み
- [ ] レポートがチームに共有されている

## quality-e2e.md との違い

| 観点 | quality-e2e.md | quality-exploratory.md |
|------|---------------|----------------------|
| 目的 | 「壊れていないか」 | 「使いにくくないか」 |
| 手法 | 再帰的UI要素クロール | ペルソナ業務フロー再現 |
| 判定 | assert成功/失敗 | AI Vision + 認知チェック |
| 発見する問題 | バグ、リグレッション | UX問題、認知負荷、導線不良 |
| 実行タイミング | CI（毎コミット） | 週次 or リリース前 |
