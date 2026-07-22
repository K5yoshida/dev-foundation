/**
 * 探索的打鍵テスト用 Playwright設定（テンプレート）
 *
 * ━━━ カスタマイズ必須 ━━━
 * 1. BASE_URL — テスト対象のURL
 * 2. projects — ペルソナ別プロジェクトを auth.ts の PERSONAS に合わせて定義
 */

import { defineConfig, devices } from "@playwright/test";
import { storageStatePath } from "./lib/auth";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./scenarios",
  fullyParallel: false, // ペルソナ内は順序実行（業務フローの依存があるため）
  retries: 1,
  workers: 1, // 本番環境に負荷をかけすぎないよう1並列
  timeout: 120_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["html", { outputFolder: "e2e/reports", open: "never" }],
    ["json", { outputFile: "e2e/reports/results.json" }],
    ["list"],
  ],

  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1440, height: 900 },
  },

  globalSetup: "./global-setup.ts",

  projects: [
    // ─── セットアップ（全ペルソナのログインセッション準備） ───
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },

    // ─── ペルソナ別プロジェクト（auth.ts の PERSONAS に合わせて変更） ───
    {
      name: "new-user",
      testMatch: /new-user\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStatePath("new_user"),
      },
      dependencies: ["setup"],
    },
    {
      name: "power-user",
      testMatch: /power-user\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStatePath("power_user"),
      },
      dependencies: ["setup"],
    },
    {
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStatePath("admin"),
      },
      dependencies: ["setup"],
    },
  ],
});
