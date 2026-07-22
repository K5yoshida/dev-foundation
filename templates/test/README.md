# Test Foundation — テスト基盤

「ビルドは通るけど機能が壊れている」を防ぐAPI契約テスト + 「使いにくい」を発見するAI探索的打鍵テスト。

## 構成

```
test/
├── vitest/
│   ├── helpers/
│   │   └── api-contract-helpers.ts   ← フロント↔バックエンドのパラメータ整合性検証（コア）
│   └── contracts/
│       └── api-param-contract.test.ts ← テスト本体（テンプレート）
├── e2e/
│   ├── helpers/
│   │   └── api-flow-helpers.ts       ← Playwright APIキャプチャ＆検証ヘルパー
│   └── exploratory/                  ← AI Vision × ペルソナ探索的打鍵テスト
│       ├── playwright.config.ts      ← Playwright設定（ペルソナ別プロジェクト）
│       ├── global-setup.ts           ← 全ペルソナのログインセッション準備
│       ├── lib/
│       │   ├── types.ts              ← 型定義（Persona, Scenario, FlowStep等）
│       │   ├── auth.ts               ← 認証ヘルパー（要カスタマイズ）
│       │   ├── scenario-runner.ts    ← シナリオ実行エンジン
│       │   ├── explorer.ts           ← AI駆動ページ探索
│       │   ├── vision.ts             ← スクリーンショットAI分析
│       │   └── reporter.ts           ← 問題検出レポート生成
│       └── scenarios/
│           └── new-user.spec.ts      ← サンプルシナリオ（テンプレート）
└── README.md
```

## セットアップ手順

### 1. Vitest: APIパラメータ契約テスト

**何をするか**: フロントのfetch()呼び出しが、バックエンドのroute.tsが要求する必須パラメータを渡しているかを静的に検証する。

```bash
# ファイルをコピー
cp vitest/helpers/api-contract-helpers.ts  <your-project>/src/test/helpers/
cp vitest/contracts/api-param-contract.test.ts  <your-project>/src/test/contracts/
```

`api-param-contract.test.ts` の設定を変更:
```typescript
// APIルートのルートディレクトリ
const ROUTE_ROOT = path.join(PROJECT_ROOT, "src", "app", "api", "v1");

// fetch呼び出しを探すディレクトリ
const SCAN_ROOTS = [
  path.join(PROJECT_ROOT, "src", "app"),
  path.join(PROJECT_ROOT, "src", "components"),
  path.join(PROJECT_ROOT, "src", "hooks"),
];
```

package.json にスクリプト追加:
```json
"check:api-params": "vitest run src/test/contracts/api-param-contract.test.ts"
```

### 2. Playwright: API操作フローテスト

**何をするか**: ブラウザ操作時に「正しいAPIが正しいパラメータで呼ばれるか」をpage.route()でインターセプトして検証する。

```bash
cp e2e/helpers/api-flow-helpers.ts  <your-project>/e2e/helpers/
```

テスト内での使い方:
```typescript
import { withApiCapture, assertApiParams } from "./helpers/api-flow-helpers";

// APIレスポンスをキャプチャ
const { response } = await withApiCapture(page, "/api/v1/resource", async () => {
  await page.click("button");
});
expect(response.status()).toBe(200);

// APIパラメータを検証（モック付き）
const captured = await assertApiParams(
  page,
  "/api/v1/auth",
  { queryParams: { id: expect.any(String) } },
  async () => { await page.click("button"); },
  { status: 200, body: { success: true } }
);
```

### 3. CI組み込み

`.github/workflows/ci.yml` にジョブ追加:
```yaml
api-param-contract:
  name: API Param Contract
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
    - run: npm ci
    - run: npm run check:api-params
```

## 検出できるバグの例

| バグ | 検出方法 |
|------|---------|
| fetch()にクエリパラメータが欠けている | api-param-contract.test.ts |
| POST bodyに必須フィールドが欠けている | api-param-contract.test.ts |
| ボタン押下時にAPIが呼ばれない | assertApiParams (E2E) |
| APIのURL自体が間違っている | 既存のapi-route-contract.test.ts |

## 4. AI探索的打鍵テスト

**何をするか**: AIの「目」（Vision API）でスクリーンショットを見て、ペルソナごとに「初見で迷わないか」「エラーが放置されていないか」を自動評価する。

```bash
# テンプレートをコピー
cp -r e2e/exploratory/ <your-project>/e2e/
```

カスタマイズが必要なファイル:
1. `lib/auth.ts` — ペルソナ定義 + ログイン処理をプロジェクトに合わせる
2. `playwright.config.ts` — ベースURL + ペルソナ別プロジェクト定義
3. `scenarios/*.spec.ts` — プロジェクトの業務フローに合わせたシナリオ

package.json にスクリプト追加:
```json
"e2e:exploratory": "playwright test --config=e2e/playwright.config.ts"
```

詳細なセットアップ手順は `agent/prompts/04-quality/quality-exploratory.md` を参照。

### 3つのテストの使い分け

| テスト | 目的 | 実行タイミング |
|--------|------|---------------|
| API契約テスト (Vitest) | パラメータ整合性 | CI（毎コミット） |
| API操作フローテスト (Playwright) | 操作→API呼び出し検証 | CI（毎コミット） |
| 探索的打鍵テスト (Playwright + AI) | UX品質・認知負荷 | 週次 or リリース前 |

## 前提条件

- Next.js App Router (route.ts)
- Vitest
- Playwright (E2E用)
- Zod（使っていなくてもdestructuring / searchParams.getで検出可能）
- OpenAI API Key（探索的打鍵テストのVision分析用。なくても基本テストは動く）
