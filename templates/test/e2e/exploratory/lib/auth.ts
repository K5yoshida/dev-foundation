/**
 * ペルソナ別認証ヘルパー（テンプレート）
 *
 * ━━━ カスタマイズ必須 ━━━
 * 以下をプロジェクトの認証方式に合わせて変更してください:
 * 1. PERSONAS — プロジェクトのユーザー層に合わせたペルソナ定義
 * 2. loginAsPersona() — プロジェクトのログインAPI呼び出し
 * 3. fetchCredential() — パスワード/合言葉/トークンの取得方法
 */

import type { Page, BrowserContext } from "@playwright/test";
import type { Persona, PersonaRole } from "./types";

// ─── ペルソナ定義（プロジェクトに合わせて変更） ───

export const PERSONAS: Record<string, Persona> = {
  // 例: 新人ユーザー（ITリテラシー低め → UIの分かりにくさを発見しやすい）
  new_user: {
    role: "new_user",
    label: "新規ユーザー",
    email: "e2e-new@example.com",
    appRole: "member",
    description:
      "初めてこのサービスを使う。専門用語に不慣れ。ボタンの意味やフローを理解するのに時間がかかる。",
    patience: 10,
    techLiteracy: "low",
  },
  // 例: パワーユーザー（効率重視 → ショートカット不足・速度問題を発見しやすい）
  power_user: {
    role: "power_user",
    label: "パワーユーザー",
    email: "e2e-power@example.com",
    appRole: "member",
    description:
      "毎日使っている熟練者。効率重視。ショートカットや一括操作を好む。3秒超のローディングに苛立つ。",
    patience: 3,
    techLiteracy: "high",
  },
  // 例: 管理者（権限の漏れ・メニュー出し分けを検証）
  admin: {
    role: "admin",
    label: "管理者",
    email: "e2e-admin@example.com",
    appRole: "admin",
    description:
      "ユーザー管理、設定変更を行う。技術に詳しい。",
    patience: 5,
    techLiteracy: "high",
  },
};

// ─── 認証情報の取得（プロジェクトに合わせて変更） ───

let _cachedCredential: string | null = null;

/**
 * ログインに必要な認証情報を取得する
 *
 * プロジェクトに合わせて変更:
 * - パスワード固定値: return "test-password"
 * - 環境変数: return process.env.E2E_PASSWORD
 * - DB取得: Supabase等から動的に取得
 */
export async function fetchCredential(): Promise<string> {
  if (_cachedCredential) return _cachedCredential;

  // 環境変数で明示指定されていればそちらを優先
  if (process.env.E2E_PASSWORD) {
    _cachedCredential = process.env.E2E_PASSWORD;
    return _cachedCredential;
  }

  // TODO: プロジェクトの認証方式に合わせて変更
  // 例: Supabaseから合言葉を取得する場合
  // const supabase = createClient(url, key);
  // const { data } = await supabase.from("config").select("value").eq("key", "passphrase").single();
  // _cachedCredential = data.value.current;

  throw new Error(
    "[Auth] E2E_PASSWORD 環境変数を設定するか、fetchCredential() をプロジェクトに合わせて修正してください",
  );
}

// ─── ログイン（プロジェクトに合わせて変更） ───

/**
 * 指定ペルソナでログインし、セッションをブラウザコンテキストにセットする
 */
export async function loginAsPersona(
  page: Page,
  persona: Persona,
): Promise<void> {
  const baseUrl =
    process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const credential = await fetchCredential();

  // TODO: プロジェクトのログインAPIに合わせて変更
  const response = await page.request.post(`${baseUrl}/api/auth/login`, {
    data: {
      email: persona.email,
      password: credential,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `[Auth] ${persona.label} のログインに失敗しました (${response.status()}): ${body}`,
    );
  }

  // TODO: プロジェクトのセッション管理に合わせて変更
  // Cookie ベースの場合:
  const cookies = response.headers()["set-cookie"];
  if (cookies) {
    const url = new URL(baseUrl);
    const tokenMatch = cookies.match(/session_token=([^;]+)/);
    if (tokenMatch) {
      await page.context().addCookies([
        {
          name: "session_token",
          value: tokenMatch[1],
          domain: url.hostname,
          path: "/",
        },
      ]);
    }
  }
}

/**
 * storageState ファイルパスを返す（ペルソナ別セッション保存用）
 */
export function storageStatePath(role: PersonaRole): string {
  return `e2e/.auth/${role}.json`;
}

/**
 * 全ペルソナのログインセッションを事前準備する（global-setup用）
 */
export async function prepareAllSessions(
  contextFactory: () => Promise<BrowserContext>,
): Promise<void> {
  const { mkdirSync } = await import("fs");
  mkdirSync("e2e/.auth", { recursive: true });

  for (const persona of Object.values(PERSONAS)) {
    const context = await contextFactory();
    const page = await context.newPage();

    try {
      await loginAsPersona(page, persona);
      await context.storageState({ path: storageStatePath(persona.role) });
    } catch (error) {
      console.warn(
        `[Auth] ${persona.label} のセッション準備に失敗: ${error}`,
      );
    } finally {
      await context.close();
    }
  }
}
