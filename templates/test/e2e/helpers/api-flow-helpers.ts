/**
 * Playwright API Flow Helpers
 *
 * 管理画面の操作フローで「APIが正しく呼ばれるか」を検証するヘルパー。
 * page.route() でAPIをインターセプトし、リクエスト内容を検証する。
 *
 * 他プロジェクトへの転用:
 *   このファイルはプロジェクト非依存。Playwrightプロジェクトにコピーするだけ。
 */

import { type Page, type Request, type Response, expect } from "@playwright/test";

// ─── 型定義 ─────────────────────────────────────

export interface CapturedApiCall {
  url: string;
  method: string;
  queryParams: Record<string, string>;
  body: Record<string, unknown> | null;
  status: number;
}

export interface CrudFlowConfig {
  /** 一覧ページのURL */
  listUrl: string;
  /** 作成ページのURL */
  createUrl: string;
  /** APIエンドポイントのパターン（部分一致） */
  apiEndpoint: string;
  /** フォームに入力する値 */
  formFields: Record<string, string>;
  /** 一覧に表示されるべきテキスト */
  expectedInList: string;
}

// ─── API呼び出しキャプチャ ──────────────────────────

/**
 * 指定パターンに一致するAPIレスポンスをキャプチャしながらアクションを実行する。
 *
 * @example
 * const captured = await withApiCapture(page, "/api/v1/admin/integrations/gbp", async () => {
 *   await page.goto("/admin/settings/integrations");
 * });
 * expect(captured.status).toBe(200);
 */
export async function withApiCapture(
  page: Page,
  apiPattern: string | RegExp,
  action: () => Promise<void>
): Promise<{ request: Request; response: Response }> {
  const responsePromise = page.waitForResponse(
    (resp) => {
      const url = resp.url();
      if (typeof apiPattern === "string") {
        return url.includes(apiPattern);
      }
      return apiPattern.test(url);
    },
    { timeout: 15_000 }
  );

  await action();
  const response = await responsePromise;
  return { request: response.request(), response };
}

/**
 * 複数のAPI呼び出しをキャプチャする。
 */
export async function withMultipleApiCapture(
  page: Page,
  apiPatterns: (string | RegExp)[],
  action: () => Promise<void>
): Promise<{ request: Request; response: Response }[]> {
  const promises = apiPatterns.map((pattern) =>
    page.waitForResponse(
      (resp) => {
        const url = resp.url();
        if (typeof pattern === "string") return url.includes(pattern);
        return pattern.test(url);
      },
      { timeout: 15_000 }
    )
  );

  await action();
  const responses = await Promise.all(promises);
  return responses.map((resp) => ({
    request: resp.request(),
    response: resp,
  }));
}

// ─── パラメータ検証 ──────────────────────────────────

/**
 * API呼び出しが正しいパラメータを持つことを検証する。
 * page.route() でインターセプトし、リクエスト内容をキャプチャ→検証。
 *
 * @example
 * await assertApiParams(page, "/api/v1/gbp/auth", {
 *   queryParams: { location_id: expect.any(String) },
 * }, async () => {
 *   await page.click("text=連携する");
 * });
 */
export async function assertApiParams(
  page: Page,
  apiPattern: string,
  expected: {
    queryParams?: Record<string, unknown>;
    bodyKeys?: string[];
    method?: string;
  },
  triggerAction: () => Promise<void>,
  mockResponse?: { status?: number; body?: Record<string, unknown> }
): Promise<CapturedApiCall> {
  let capturedCall: CapturedApiCall | null = null;

  await page.route(`**${apiPattern}*`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    let body: Record<string, unknown> | null = null;
    try {
      const postData = request.postData();
      if (postData) {
        body = JSON.parse(postData);
      }
    } catch {
      // non-JSON body
    }

    capturedCall = {
      url: request.url(),
      method: request.method(),
      queryParams,
      body,
      status: mockResponse?.status ?? 200,
    };

    await route.fulfill({
      status: mockResponse?.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(mockResponse?.body ?? { success: true }),
    });
  });

  await triggerAction();

  // キャプチャされたことを確認
  expect(capturedCall, `API call to ${apiPattern} was not captured`).not.toBeNull();

  const call = capturedCall!;

  // メソッド検証
  if (expected.method) {
    expect(call.method).toBe(expected.method);
  }

  // クエリパラメータ検証
  if (expected.queryParams) {
    for (const [key, value] of Object.entries(expected.queryParams)) {
      expect(
        call.queryParams,
        `Missing query param "${key}" in ${apiPattern}`
      ).toHaveProperty(key);
      if (value !== expect.any(String)) {
        expect(call.queryParams[key]).toBe(value);
      }
    }
  }

  // ボディキー検証
  if (expected.bodyKeys && call.body) {
    for (const key of expected.bodyKeys) {
      expect(
        call.body,
        `Missing body key "${key}" in ${apiPattern}`
      ).toHaveProperty(key);
    }
  }

  return call;
}

// ─── ページ遷移ヘルパー ──────────────────────────────

/**
 * ページ遷移してAPI呼び出しが完了するまで待機する。
 */
export async function gotoAndWaitForApi(
  page: Page,
  url: string,
  apiPattern: string | RegExp
): Promise<Response> {
  const responsePromise = page.waitForResponse(
    (resp) => {
      const respUrl = resp.url();
      if (typeof apiPattern === "string") return respUrl.includes(apiPattern);
      return apiPattern.test(respUrl);
    },
    { timeout: 30_000 }
  );

  await page.goto(url, { waitUntil: "domcontentloaded" });
  return responsePromise;
}

/**
 * 要素が表示されるまで待機（カスタムタイムアウト付き）
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeout = 15_000
): Promise<void> {
  await page.waitForSelector(selector, { state: "visible", timeout });
}
