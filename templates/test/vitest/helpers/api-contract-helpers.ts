/**
 * API Contract Helpers — フロント↔バックエンドのパラメータ整合性検証
 *
 * 他プロジェクトへの転用:
 *   このファイルをコピーし、テスト側の ROUTE_ROOT / SCAN_ROOTS を書き換えるだけ。
 *   Next.js + Zod のプロジェクトなら設定変更なしで動作する。
 */

import fs from "node:fs";
import path from "node:path";

// ─── 型定義 ─────────────────────────────────────

export interface FetchCall {
  /** フロントエンドのソースファイルパス */
  filePath: string;
  /** 呼び出し先APIパス（例: /api/v1/gbp/auth） */
  apiPath: string;
  /** HTTPメソッド（GET / POST / PATCH / DELETE） */
  method: string;
  /** クエリパラメータ名一覧（例: ["location_id"]） */
  queryParams: string[];
  /** リクエストボディのキー一覧（例: ["locationId", "summary"]） */
  bodyKeys: string[];
  /** 行番号（デバッグ用） */
  line: number;
}

export interface ZodFieldInfo {
  name: string;
  required: boolean;
}

export interface RouteParamSpec {
  /** route.ts のファイルパス */
  filePath: string;
  /** 正規化されたAPIパス（例: /api/v1/gbp/auth） */
  apiPath: string;
  /** Zodスキーマまたはdestructuringから抽出されたフィールド */
  queryFields: ZodFieldInfo[];
  bodyFields: ZodFieldInfo[];
}

export interface ContractViolation {
  /** 呼び出し先APIパス */
  apiPath: string;
  /** 不足しているパラメータ名 */
  missingParams: string[];
  /** フロントエンドのファイルパス */
  frontFile: string;
  /** 行番号 */
  frontLine: number;
  /** バックエンドのファイルパス */
  routeFile: string;
  /** query / body のどちらで不足しているか */
  source: "query" | "body";
}

// ─── ファイル走査 ─────────────────────────────────

export function listFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── フロントエンド: fetch呼び出し抽出 ────────────────────

/**
 * ソースコードからfetch("/api/v1/...")呼び出しを構造化して抽出する。
 *
 * 検出対象:
 * - fetch("/api/v1/gbp/auth?location_id=...")
 * - fetch(`/api/v1/gbp/auth?location_id=${id}`)
 * - fetch("/api/v1/admin/stories", { method: "POST", body: JSON.stringify({ title, body }) })
 */
export function extractFetchCalls(
  code: string,
  filePath: string
): FetchCall[] {
  const results: FetchCall[] = [];
  const lines = code.split("\n");

  // fetch呼び出しの先頭を検出し、周辺コンテキストを取得
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // fetch( を含む行を検出
    if (!line.includes("fetch(")) continue;

    // 周辺20行を結合してコンテキストを取得（複数行のfetch呼び出し対応）
    const contextLines = lines.slice(i, Math.min(i + 20, lines.length));
    const context = contextLines.join("\n");

    // APIパス抽出（文字列リテラル）
    const stringMatch = context.match(
      /fetch\(\s*(['"])(\/api\/v1\/[^'"?]+)(\?[^'"]*)?['"]/
    );
    // APIパス抽出（テンプレートリテラル）
    const templateMatch = context.match(
      /fetch\(\s*`(\/api\/v1\/[^`?]+)(\?[^`]*)?\`/
    );

    const match = stringMatch || templateMatch;
    if (!match) continue;

    const apiPath = normalizeApiPath(match[1] + (match[2] || ""));
    const queryString = match[2] || match[3] || "";

    // クエリパラメータ抽出
    const queryParams = extractQueryParamNames(queryString);

    // HTTPメソッド抽出
    const method = extractMethod(context);

    // ボディキー抽出（POST/PATCH/PUT/DELETE）
    const bodyKeys =
      method !== "GET" ? extractBodyKeys(context) : [];

    results.push({
      filePath,
      apiPath: normalizeApiPath(apiPath.split("?")[0]),
      method,
      queryParams,
      bodyKeys,
      line: i + 1,
    });
  }

  return results;
}

function normalizeApiPath(input: string): string {
  // テンプレート変数を __VAR__ に置換
  let normalized = input.replace(/\$\{[^}]+\}/g, "__VAR__");
  // クエリパラメータを除去
  normalized = normalized.split("?")[0];
  // 末尾スラッシュを除去
  if (normalized.endsWith("/") && normalized !== "/") {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function extractQueryParamNames(queryString: string): string[] {
  if (!queryString) return [];
  const params: string[] = [];

  // ?key=value&key2=value2 形式
  const staticMatch = queryString.matchAll(/[?&](\w+)=/g);
  for (const m of staticMatch) {
    if (m[1]) params.push(m[1]);
  }

  // テンプレートリテラル内 ?key=${...} 形式
  const templateMatch = queryString.matchAll(/[?&](\w+)=\$\{/g);
  for (const m of templateMatch) {
    if (m[1]) params.push(m[1]);
  }

  return [...new Set(params)];
}

function extractMethod(context: string): string {
  const methodMatch = context.match(/method:\s*['"](\w+)['"]/);
  return methodMatch ? methodMatch[1].toUpperCase() : "GET";
}

function extractBodyKeys(context: string): string[] {
  const keys: string[] = [];

  // JSON.stringify({ key1, key2: value }) 形式
  const stringifyMatch = context.match(
    /JSON\.stringify\(\s*\{([^}]+)\}/
  );
  if (stringifyMatch && stringifyMatch[1]) {
    const content = stringifyMatch[1];
    // key: value 形式
    const kvMatches = content.matchAll(/(\w+)\s*[,:]/g);
    for (const m of kvMatches) {
      if (m[1]) keys.push(m[1]);
    }
  }

  // body: JSON.stringify({ ... }) の代わりに
  // body: JSON.stringify(変数) のケースもある（この場合はスキップ）

  return [...new Set(keys)];
}

// ─── バックエンド: route.ts からパラメータ仕様抽出 ──────────

/**
 * route.ts ファイルからZodスキーマおよびdestructuringを解析し、
 * 必須パラメータを抽出する。
 */
export function extractRouteParamSpec(
  code: string,
  filePath: string,
  routeRoot: string
): RouteParamSpec {
  const apiPath = routeFileToApiPath(filePath, routeRoot);

  return {
    filePath,
    apiPath,
    queryFields: extractZodFields(code, "query"),
    bodyFields: extractZodFields(code, "body"),
  };
}

function routeFileToApiPath(filePath: string, routeRoot: string): string {
  const relativeDir = path.relative(routeRoot, path.dirname(filePath));
  const segments =
    relativeDir === "" ? [] : relativeDir.split(path.sep).filter(Boolean);

  const normalized = segments.map((seg) => {
    if (/^\[\.\.\.[^\]]+\]$/.test(seg)) return "__VAR__";
    if (/^\[[^\]]+\]$/.test(seg)) return "__VAR__";
    return seg;
  });

  return `/api/v1${normalized.length > 0 ? `/${normalized.join("/")}` : ""}`;
}

function extractZodFields(
  code: string,
  source: "query" | "body"
): ZodFieldInfo[] {
  const fields: ZodFieldInfo[] = [];

  // Zodスキーマ検出: z.object({ field: z.string(), field2: z.number().optional() })
  // クエリ用: querySchema, searchParams関連
  // ボディ用: bodySchema, request.json()関連
  const zodObjectRegex = /z\.object\(\s*\{([^}]+)\}\s*\)/g;

  for (const match of code.matchAll(zodObjectRegex)) {
    const content = match[1];
    if (!content) continue;

    // このZodオブジェクトがquery用かbody用か推定
    const isQuery = isQuerySchema(code, match.index || 0);
    if ((source === "query" && !isQuery) || (source === "body" && isQuery)) {
      continue;
    }

    // フィールドを抽出
    const fieldMatches = content.matchAll(
      /(\w+)\s*:\s*z\.\w+\([^)]*\)((?:\.\w+\([^)]*\))*)/g
    );
    for (const fm of fieldMatches) {
      const name = fm[1];
      const chainedMethods = fm[2] || "";
      if (!name) continue;
      fields.push({
        name,
        required: !chainedMethods.includes(".optional()"),
      });
    }
  }

  // Zodが使われていない場合: const { field1, field2 } = await request.json()
  if (source === "body" && fields.length === 0) {
    const destructureMatch = code.match(
      /(?:const|let)\s*\{([^}]+)\}\s*=\s*(?:await\s+)?(?:request\.json\(\)|body)/
    );
    if (destructureMatch && destructureMatch[1]) {
      const content = destructureMatch[1];
      const names = content.matchAll(/(\w+)/g);
      for (const n of names) {
        if (n[1]) {
          // 型注釈で `field?: type` となっているかチェック
          const isOptionalInType = new RegExp(
            `${n[1]}\\??\\s*:\\s*`
          ).test(code) && new RegExp(`${n[1]}\\?\\s*:`).test(code);
          // 条件付きバリデーション `if (!field)` がある場合も条件付き必須 = optional扱い
          const isConditionallyRequired = new RegExp(
            `if\\s*\\([^)]*&&[^)]*!${n[1]}`
          ).test(code);
          fields.push({
            name: n[1],
            required: !isOptionalInType && !isConditionallyRequired,
          });
        }
      }
    }
  }

  // クエリ: searchParams.get("key") パターン（GETハンドラ内のみ）
  if (source === "query" && fields.length === 0) {
    // GETハンドラの範囲を特定（export async function GET ... から次のexportまで）
    const getHandlerMatch = code.match(
      /export\s+async\s+function\s+GET\b[\s\S]*?(?=export\s+async\s+function\s+\w+|$)/
    );
    const searchScope = getHandlerMatch ? getHandlerMatch[0] : code;

    const getMatches = searchScope.matchAll(
      /searchParams\.get\(\s*['"](\w+)['"]\s*\)/g
    );
    for (const gm of getMatches) {
      if (gm[1]) {
        // `if (!param)` + エラーレスポンスがあれば必須、なければオプショナル
        // パターン: if (!paramName) { return NextResponse.json(..., { status: 400 })
        const requiredPattern = new RegExp(
          `if\\s*\\(\\s*!${gm[1]}\\b[^)]*\\)\\s*\\{[^}]*(?:status:\\s*400|throw|return\\s+NextResponse\\.json)`
        );
        const isRequired = requiredPattern.test(searchScope);
        fields.push({ name: gm[1], required: isRequired });
      }
    }
  }

  return fields;
}

function isQuerySchema(code: string, position: number): boolean {
  // z.object() の周辺コンテキストからquery用かbody用か推定
  const before = code.slice(Math.max(0, position - 200), position);
  const queryIndicators = [
    "query",
    "searchParams",
    "Query",
    "params",
    "querySchema",
  ];
  const bodyIndicators = ["body", "Body", "request.json", "bodySchema"];

  const hasQueryIndicator = queryIndicators.some((ind) =>
    before.toLowerCase().includes(ind.toLowerCase())
  );
  const hasBodyIndicator = bodyIndicators.some((ind) =>
    before.toLowerCase().includes(ind.toLowerCase())
  );

  if (hasQueryIndicator && !hasBodyIndicator) return true;
  if (hasBodyIndicator && !hasQueryIndicator) return false;
  // デフォルト: GET handler内ならquery、それ以外ならbody
  return before.includes("GET");
}

// ─── 契約検証 ────────────────────────────────────

/**
 * フロントのfetch呼び出しとバックエンドのルートパラメータ仕様を突き合わせ、
 * 不足しているパラメータ（契約違反）を検出する。
 */
export function validateParamContracts(
  fetchCalls: FetchCall[],
  routeSpecs: RouteParamSpec[]
): ContractViolation[] {
  const violations: ContractViolation[] = [];

  for (const call of fetchCalls) {
    // 対応するルートを探す
    const matchingSpec = routeSpecs.find((spec) =>
      pathsMatch(call.apiPath, spec.apiPath)
    );
    if (!matchingSpec) continue; // ルート未実装は別テストでカバー

    // クエリパラメータの契約チェック
    const requiredQueryFields = matchingSpec.queryFields
      .filter((f) => f.required)
      .map((f) => f.name);

    if (call.method === "GET" && requiredQueryFields.length > 0) {
      const missing = requiredQueryFields.filter(
        (field) => !call.queryParams.includes(field)
      );
      if (missing.length > 0) {
        violations.push({
          apiPath: call.apiPath,
          missingParams: missing,
          frontFile: call.filePath,
          frontLine: call.line,
          routeFile: matchingSpec.filePath,
          source: "query",
        });
      }
    }

    // ボディパラメータの契約チェック（POSTのみ — PATCH/PUTは部分更新のため除外）
    if (call.method === "POST") {
      const requiredBodyFields = matchingSpec.bodyFields
        .filter((f) => f.required)
        .map((f) => f.name);

      if (requiredBodyFields.length > 0 && call.bodyKeys.length > 0) {
        const missing = requiredBodyFields.filter(
          (field) => !call.bodyKeys.includes(field)
        );
        if (missing.length > 0) {
          violations.push({
            apiPath: call.apiPath,
            missingParams: missing,
            frontFile: call.filePath,
            frontLine: call.line,
            routeFile: matchingSpec.filePath,
            source: "body",
          });
        }
      }
    }
  }

  return violations;
}

function pathsMatch(fetchPath: string, routePath: string): boolean {
  const fetchSegments = fetchPath.split("/").filter(Boolean);
  const routeSegments = routePath.split("/").filter(Boolean);

  if (fetchSegments.length !== routeSegments.length) return false;

  return fetchSegments.every((seg, i) => {
    const routeSeg = routeSegments[i];
    if (seg === "__VAR__" || routeSeg === "__VAR__") return true;
    return seg === routeSeg;
  });
}
