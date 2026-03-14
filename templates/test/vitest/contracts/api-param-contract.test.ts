/**
 * API Parameter Contract Test — テンプレート
 *
 * フロントエンドのfetch呼び出しが、バックエンドのAPIルートが要求する
 * 必須パラメータを正しく渡しているかを自動検証する。
 *
 * 使い方:
 *   1. このファイルを src/test/contracts/ にコピー
 *   2. ROUTE_ROOT と SCAN_ROOTS をプロジェクトに合わせて変更
 *   3. `vitest run src/test/contracts/api-param-contract.test.ts` で実行
 *
 * 依存:
 *   - ../helpers/api-contract-helpers.ts（同じくコピー）
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  listFilesRecursively,
  extractFetchCalls,
  extractRouteParamSpec,
  validateParamContracts,
  type FetchCall,
  type RouteParamSpec,
} from "../helpers/api-contract-helpers";

// ─── ★ プロジェクト固有の設定（ここだけ書き換える） ──────

const PROJECT_ROOT = process.cwd();

/** APIルートのルートディレクトリ（Next.js App Router前提） */
const ROUTE_ROOT = path.join(PROJECT_ROOT, "src", "app", "api", "v1");

/** フロントエンドのfetch呼び出しを探すディレクトリ */
const SCAN_ROOTS = [
  path.join(PROJECT_ROOT, "src", "app"),
  path.join(PROJECT_ROOT, "src", "components"),
  path.join(PROJECT_ROOT, "src", "hooks"),
];

// テスト対象外のパス（テストコード自体やAPIルート内部は除外）
const EXCLUDE_PATTERNS = [
  `${path.sep}api${path.sep}`,
  `${path.sep}test${path.sep}`,
  `${path.sep}__tests__${path.sep}`,
  ".test.",
  ".spec.",
];

// ─── テスト ──────────────────────────────────────

describe("API parameter contract (/api/v1)", () => {
  // フロントのfetch呼び出しを全て抽出
  const sourceFiles = SCAN_ROOTS.flatMap((root) => listFilesRecursively(root))
    .filter((file) => !EXCLUDE_PATTERNS.some((pat) => file.includes(pat)));

  const allFetchCalls: FetchCall[] = [];
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    allFetchCalls.push(...extractFetchCalls(content, file));
  }

  // バックエンドのroute.tsからパラメータ仕様を抽出
  const routeFiles = listFilesRecursively(ROUTE_ROOT).filter(
    (file) =>
      file.endsWith(`${path.sep}route.ts`) ||
      file.endsWith(`${path.sep}route.tsx`)
  );

  const allRouteSpecs: RouteParamSpec[] = routeFiles.map((file) => {
    const content = fs.readFileSync(file, "utf-8");
    return extractRouteParamSpec(content, file, ROUTE_ROOT);
  });

  it("フロントのfetch呼び出しが検出されること", () => {
    expect(allFetchCalls.length).toBeGreaterThan(0);
  });

  it("バックエンドのルート仕様が検出されること", () => {
    expect(allRouteSpecs.length).toBeGreaterThan(0);
  });

  it("フロントが必須クエリパラメータを渡していること", () => {
    const violations = validateParamContracts(allFetchCalls, allRouteSpecs);

    const queryViolations = violations.filter((v) => v.source === "query");

    if (queryViolations.length > 0) {
      const messages = queryViolations.map(
        (v) =>
          `  ${v.apiPath}: missing ${v.source} params [${v.missingParams.join(", ")}]\n` +
          `    front: ${path.relative(PROJECT_ROOT, v.frontFile)}:${v.frontLine}\n` +
          `    route: ${path.relative(PROJECT_ROOT, v.routeFile)}`
      );
      expect.fail(
        `API parameter contract violations:\n${messages.join("\n\n")}`
      );
    }
  });

  it("フロントが必須ボディパラメータを渡していること", () => {
    const violations = validateParamContracts(allFetchCalls, allRouteSpecs);

    const bodyViolations = violations.filter((v) => v.source === "body");

    if (bodyViolations.length > 0) {
      const messages = bodyViolations.map(
        (v) =>
          `  ${v.apiPath}: missing ${v.source} params [${v.missingParams.join(", ")}]\n` +
          `    front: ${path.relative(PROJECT_ROOT, v.frontFile)}:${v.frontLine}\n` +
          `    route: ${path.relative(PROJECT_ROOT, v.routeFile)}`
      );
      expect.fail(
        `API parameter contract violations:\n${messages.join("\n\n")}`
      );
    }
  });
});
