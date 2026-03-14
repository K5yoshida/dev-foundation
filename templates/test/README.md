# Test Foundation — API契約テスト基盤

「ビルドは通るけど機能が壊れている」を防ぐテスト基盤。

## 構成

```
test/
├── vitest/
│   ├── helpers/
│   │   └── api-contract-helpers.ts   ← フロント↔バックエンドのパラメータ整合性検証（コア）
│   └── contracts/
│       └── api-param-contract.test.ts ← テスト本体（テンプレート）
├── e2e/
│   └── helpers/
│       └── api-flow-helpers.ts       ← Playwright APIキャプチャ＆検証ヘルパー
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

## 前提条件

- Next.js App Router (route.ts)
- Vitest
- Playwright (E2E用)
- Zod（使っていなくてもdestructuring / searchParams.getで検出可能）
