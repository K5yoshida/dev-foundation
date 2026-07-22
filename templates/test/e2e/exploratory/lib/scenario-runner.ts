/**
 * シナリオ実行エンジン
 *
 * FlowStep を順次実行し、AIチェックポイントで画像分析を行い、
 * 問題検出時は自動でレポートする。
 *
 * テストの合否判定（4フェーズ）:
 * 1. ステップ実行 — navigate/click 等が失敗したらFAIL
 * 2. DOM ヘルスチェック — 404/空ページ/JSエラー等を検出（Vision API不要）
 * 3. successCriteria — DOM上にテキスト/要素が存在するかチェック（Vision API不要）
 * 4. Vision分析 — high priority の問題があればFAIL
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type {
  Scenario,
  FlowStep,
  Persona,
  StepResult,
  ScenarioResult,
  DetectedIssue,
} from "./types";
import { analyzeScreenshot, hasIssues } from "./vision";
import { reportIssue, analysisToIssues } from "./reporter";

const ENABLE_VISION =
  process.env.OPENAI_API_KEY && process.env.E2E_ENABLE_VISION !== "false";

/**
 * 1つのFlowStepを実行する
 */
async function executeStep(
  page: Page,
  step: FlowStep,
  persona: Persona,
  scenarioId: string,
): Promise<StepResult> {
  const start = Date.now();
  const issues: DetectedIssue[] = [];

  try {
    switch (step.action) {
      case "navigate": {
        await page.goto(step.target!, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);
        break;
      }

      case "click": {
        const locator = page.locator(step.target!).first();
        await locator.waitFor({ state: "visible", timeout: 10_000 });
        await locator.click();
        await page.waitForTimeout(500);
        break;
      }

      case "type": {
        const input = page.locator(step.target!).first();
        await input.waitFor({ state: "visible", timeout: 10_000 });
        await input.fill(step.value!);
        break;
      }

      case "wait": {
        const ms = parseInt(step.value ?? "1000", 10);
        await page.waitForTimeout(ms);
        break;
      }

      case "assert_visible": {
        const el = page.locator(step.target!).first();
        await expect(el).toBeVisible({ timeout: 10_000 });
        break;
      }

      case "assert_not_visible": {
        const el = page.locator(step.target!).first();
        await expect(el).not.toBeVisible({ timeout: 5_000 });
        break;
      }

      case "select": {
        const sel = page.locator(step.target!).first();
        await sel.selectOption(step.value!);
        break;
      }

      case "viewport": {
        const [w, h] = (step.value ?? "1440x900").split("x").map(Number);
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(500);
        break;
      }

      case "screenshot_check": {
        // screenshot_check 自体は何もしない
        // 直後の aiCheck ブロックでスクリーンショット分析が行われる
        break;
      }
    }

    // AIチェック（aiCheck があり、Vision APIが有効な場合）
    let visionAnalysis = undefined;
    if (step.aiCheck && ENABLE_VISION) {
      const screenshot = await page.screenshot({ fullPage: false });
      visionAnalysis = await analyzeScreenshot(screenshot, {
        persona,
        currentPage: page.url(),
        expectedState: step.description,
        question: step.aiCheck,
      });

      if (hasIssues(visionAnalysis)) {
        const detected = analysisToIssues(visionAnalysis, {
          scenarioId,
          persona,
          pageUrl: page.url(),
          screenshotBuffer: screenshot,
        });

        for (const issue of detected) {
          await reportIssue(page, issue);
          issues.push(issue);
        }
      }
    }

    // Vision分析で high priority の問題があればステップを失敗にする
    const hasHighPriority = issues.some((i) => i.priority === "high");

    return {
      step,
      passed: !hasHighPriority,
      visionAnalysis,
      issues,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    const screenshot = await page
      .screenshot({ fullPage: false })
      .catch(() => null);

    const issue: DetectedIssue = {
      title: `ステップ失敗: ${step.description}`,
      description: `アクション「${step.action}」が失敗しました。\n\nターゲット: ${step.target ?? "なし"}\nエラー: ${error instanceof Error ? error.message : String(error)}`,
      category: "bug",
      priority: "high",
      screenshotBuffer: screenshot ?? undefined,
      pageUrl: page.url(),
      scenarioId,
      persona: persona.role,
    };
    await reportIssue(page, issue);
    issues.push(issue);

    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      issues,
      durationMs: Date.now() - start,
    };
  }
}

// ─── successCriteria の検証 ───

/**
 * successCriteria を検証する。
 *
 * criteria の形式によって検証方法が変わる:
 * - "selector:..." → CSSセレクタで要素の可視性をチェック
 * - "url:..." → 現在URLにその文字列が含まれるかチェック
 * - "text:..." → ページ内にそのテキストが存在するかチェック
 * - それ以外 → 「人間向け説明文」として扱い、DOM検証は basicHealthCheck に任せる
 *              （後方互換: 既存の日本語説明文はスキップされる）
 */
async function verifySuccessCriteria(
  page: Page,
  criteria: string[],
  scenarioId: string,
  persona: Persona,
): Promise<{ passed: boolean; issues: DetectedIssue[] }> {
  const issues: DetectedIssue[] = [];
  let allPassed = true;

  for (const criterion of criteria) {
    let found = false;
    let isVerifiable = true;

    if (criterion.startsWith("selector:")) {
      const selector = criterion.slice("selector:".length);
      found = await page.locator(selector).first().isVisible().catch(() => false);
    } else if (criterion.startsWith("url:")) {
      const urlPart = criterion.slice("url:".length);
      found = page.url().includes(urlPart);
    } else if (criterion.startsWith("text:")) {
      const text = criterion.slice("text:".length);
      found = await page
        .getByText(text, { exact: false })
        .first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (!found) {
        const bodyText = await page.locator("body").innerText().catch(() => "");
        found = bodyText.includes(text);
      }
    } else {
      // 日本語の説明文（例: 「ダッシュボードが表示される」）はDOMチェック不可
      // basicHealthCheck に検証を委ねる
      isVerifiable = false;
      found = true;
    }

    if (isVerifiable && !found) {
      allPassed = false;
      const issue: DetectedIssue = {
        title: `successCriteria 未達: ${criterion}`,
        description: `シナリオの成功条件「${criterion}」がページ上で確認できませんでした。\n\nURL: ${page.url()}\nペルソナ: ${persona.label}`,
        category: "bug",
        priority: "high",
        pageUrl: page.url(),
        scenarioId,
        persona: persona.role,
      };
      await reportIssue(page, issue);
      issues.push(issue);
    }
  }

  return { passed: allPassed, issues };
}

// ─── ページ基本ヘルスチェック（Vision API 不要） ───

/**
 * Vision APIがなくてもDOMレベルで最低限のチェックを行う。
 * これが「全PASSにならない」ための防衛線。
 *
 * チェック項目:
 * 1. エラーページ検出（404, 500 等）
 * 2. 空ページ検出（レンダリング失敗）
 * 3. JSエラーオーバーレイ検出（Next.js等）
 * 4. インタラクティブ要素の存在チェック
 * 5. 認証リダイレクト検出
 */
async function basicHealthCheck(
  page: Page,
  scenarioId: string,
  persona: Persona,
  startPage?: string,
): Promise<DetectedIssue[]> {
  // TODO: プロジェクトの認証ページパスに合わせて変更してください
  const AUTH_PAGES = ["/login", "/register", "/signup", "/"];
  const startPageIsAuth = AUTH_PAGES.some((p) => startPage === p);

  const issues: DetectedIssue[] = [];

  // 1. エラーページ検出（404, 500, etc.）
  const title = await page.title().catch(() => "");
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  const errorPatterns = [
    /\b404\b/,
    /not found/i,
    /\b500 Internal/i,
    /internal server error/i,
    /application error/i,
    /エラーが発生/,
    /問題が発生しました/,
    /ページが見つかりません/,
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(title) || pattern.test(bodyText.slice(0, 500))) {
      issues.push({
        title: `エラーページ検出: ${pattern.source}`,
        description: `ページにエラーが表示されています。\n\nタイトル: ${title}\nURL: ${page.url()}\n本文冒頭: ${bodyText.slice(0, 200)}`,
        category: "bug",
        priority: "high",
        pageUrl: page.url(),
        scenarioId,
        persona: persona.role,
      });
      break;
    }
  }

  // 2. 空ページ検出（body が実質空 = レンダリング失敗の可能性）
  const textLength = bodyText.trim().length;
  if (textLength < 10) {
    issues.push({
      title: "ページが空または極端に短い",
      description: `ページの本文テキストが ${textLength} 文字しかありません。レンダリングに失敗している可能性があります。\n\nURL: ${page.url()}`,
      category: "bug",
      priority: "high",
      pageUrl: page.url(),
      scenarioId,
      persona: persona.role,
    });
  }

  // 3. JSエラーオーバーレイ検出（Next.js のエラー画面）
  const jsErrorVisible = await page
    .locator("text=/Unhandled Runtime Error|uncaught|TypeError|ReferenceError/i")
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);

  if (jsErrorVisible) {
    issues.push({
      title: "JavaScript エラーが画面に表示されている",
      description: `フレームワークのエラーオーバーレイまたは未処理エラーが画面に表示されています。\n\nURL: ${page.url()}`,
      category: "bug",
      priority: "high",
      pageUrl: page.url(),
      scenarioId,
      persona: persona.role,
    });
  }

  // 4. インタラクティブ要素の存在チェック
  // 正常なページには最低1つはボタンかリンクがあるはず
  const interactiveCount = await page
    .locator("a[href], button, [role='button'], input[type='submit']")
    .count()
    .catch(() => 0);

  if (interactiveCount === 0 && textLength > 10) {
    issues.push({
      title: "インタラクティブ要素が存在しない",
      description: `ページにボタン・リンクが1つもありません。エラーページやレンダリング不完全の可能性があります。\n\nURL: ${page.url()}\n本文テキスト長: ${textLength}文字`,
      category: "bug",
      priority: "high",
      pageUrl: page.url(),
      scenarioId,
      persona: persona.role,
    });
  }

  // 5. ログインリダイレクト検出
  // 認証が切れてログインページにリダイレクトされた場合
  const currentUrl = page.url();
  if (
    !startPageIsAuth &&
    AUTH_PAGES.some(
      (p) => p !== "/" && currentUrl.includes(p),
    )
  ) {
    issues.push({
      title: "認証切れ: ログインページにリダイレクトされた",
      description: `認証セッションが無効で、ログインページにリダイレクトされました。\n\n期待startPage: ${startPage}\n実際URL: ${currentUrl}`,
      category: "bug",
      priority: "high",
      pageUrl: currentUrl,
      scenarioId,
      persona: persona.role,
    });
  }

  return issues;
}

/**
 * シナリオ全体を実行する
 */
export async function runScenario(
  page: Page,
  scenario: Scenario,
  persona: Persona,
): Promise<ScenarioResult> {
  const start = Date.now();
  const steps: StepResult[] = [];
  const allIssues: DetectedIssue[] = [];

  // TODO: プロジェクトの認証ページパスに合わせて変更してください
  if (scenario.startPage === "/login") {
    await page.context().clearCookies();
  }

  // ─── Phase 1: FlowStep を順次実行 ───
  for (const step of scenario.expectedFlow) {
    const result = await executeStep(page, step, persona, scenario.id);
    steps.push(result);

    // ステップで検出された問題を集約
    if (result.issues) {
      allIssues.push(...result.issues);
    }

    // ステップが失敗したら中断（後続ステップは依存している可能性が高い）
    if (!result.passed) {
      break;
    }
  }

  const stepsAllPassed = steps.every((s) => s.passed);

  // ─── Phase 2: DOM ヘルスチェック（Vision API 不要） ───
  if (stepsAllPassed) {
    const healthIssues = await basicHealthCheck(
      page,
      scenario.id,
      persona,
      scenario.startPage,
    );
    allIssues.push(...healthIssues);
  }

  // ─── Phase 3: successCriteria の DOM 検証 ───
  let criteriaResult = { passed: true, issues: [] as DetectedIssue[] };
  if (stepsAllPassed && scenario.successCriteria.length > 0) {
    criteriaResult = await verifySuccessCriteria(
      page,
      scenario.successCriteria,
      scenario.id,
      persona,
    );
    allIssues.push(...criteriaResult.issues);
  }

  // ─── Phase 4: Cognitive Checkpoints の AI分析 ───
  if (ENABLE_VISION && stepsAllPassed) {
    for (const checkpoint of scenario.cognitiveCheckpoints) {
      const screenshot = await page.screenshot({ fullPage: false });
      const analysis = await analyzeScreenshot(screenshot, {
        persona,
        currentPage: page.url(),
        question: checkpoint.question,
        uxQualityChecks: scenario.uxQualityChecks,
      });

      if (hasIssues(analysis)) {
        const detected = analysisToIssues(analysis, {
          scenarioId: scenario.id,
          persona,
          pageUrl: page.url(),
          screenshotBuffer: screenshot,
        });

        for (const issue of detected) {
          await reportIssue(page, issue);
          allIssues.push(issue);
        }
      }

      // 信頼度が低い場合は警告（テストはFAILにしないが記録する）
      if (analysis.confidenceScore > 0 && analysis.confidenceScore < 0.4) {
        console.warn(
          `[${scenario.id}] ⚠️ AI分析の信頼度が低い (${analysis.confidenceScore}): ${checkpoint.description}`,
        );
      }
    }
  }

  // ─── 最終合否判定 ───
  // 1. 全ステップがPASS
  // 2. DOM ヘルスチェックで high priority 問題なし
  // 3. successCriteria が全て満たされている
  // 4. Vision分析で high priority 問題なし
  const hasHighPriorityIssues = allIssues.some((i) => i.priority === "high");
  const passed = stepsAllPassed && criteriaResult.passed && !hasHighPriorityIssues;

  // サマリーログ
  if (!passed) {
    const highCount = allIssues.filter((i) => i.priority === "high").length;
    const medCount = allIssues.filter((i) => i.priority === "medium").length;
    console.log(
      `❌ [${scenario.id}] FAIL — high: ${highCount}, medium: ${medCount}`,
    );
  }

  return {
    scenario,
    passed,
    steps,
    issues: allIssues,
    totalDurationMs: Date.now() - start,
  };
}
