/**
 * Playwright グローバルセットアップ
 *
 * テスト実行前に全ペルソナのログインセッションを準備する。
 */

import { chromium, type FullConfig } from "@playwright/test";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { prepareAllSessions } from "./lib/auth";

// .env.local から環境変数を読み込む
dotenv.config({ path: resolve(__dirname, "../.env.local") });

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch();

  try {
    await prepareAllSessions(async () => {
      return browser.newContext();
    });
  } finally {
    await browser.close();
  }
}
