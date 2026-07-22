/**
 * 問題レポート生成
 *
 * Vision分析やDOM検証で検出された問題を構造化レポートとして出力する。
 * テスト完了後にサマリーを表示し、問題の全体像を把握できるようにする。
 */

import type { Page } from "@playwright/test";
import type {
  Persona,
  PersonaRole,
  VisionAnalysis,
  DetectedIssue,
  ScenarioResult,
} from "./types";

interface IssueContext {
  scenarioId: string;
  persona: Persona;
  pageUrl: string;
  screenshotBuffer?: Buffer;
}

/**
 * VisionAnalysis の問題を DetectedIssue[] に変換する
 */
export function analysisToIssues(
  analysis: VisionAnalysis,
  context: IssueContext,
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  // ページ未読み込み
  if (!analysis.pageLoaded) {
    issues.push({
      title: "ページが読み込まれていない",
      description: `ペルソナ「${context.persona.label}」がアクセスしたページが正常に読み込まれていません。\n\n画面評価: ${analysis.overallAssessment}`,
      category: "bug",
      priority: "high",
      screenshotBuffer: context.screenshotBuffer,
      pageUrl: context.pageUrl,
      scenarioId: context.scenarioId,
      persona: context.persona.role,
    });
  }

  // エラー表示
  for (const error of analysis.errorsVisible) {
    issues.push({
      title: `エラー表示: ${error.slice(0, 80)}`,
      description: `ペルソナ「${context.persona.label}」の操作中にエラーが表示されました。\n\n${error}\n\n画面評価: ${analysis.overallAssessment}`,
      category: "bug",
      priority: "high",
      screenshotBuffer: context.screenshotBuffer,
      pageUrl: context.pageUrl,
      scenarioId: context.scenarioId,
      persona: context.persona.role,
    });
  }

  // UX問題
  for (const ux of analysis.uxIssues) {
    issues.push({
      title: `UX問題: ${ux.slice(0, 80)}`,
      description: `ペルソナ「${context.persona.label}」（${context.persona.description}）にとってのUX問題:\n\n${ux}`,
      category: "improvement",
      priority: "medium",
      pageUrl: context.pageUrl,
      scenarioId: context.scenarioId,
      persona: context.persona.role,
    });
  }

  // 読みにくさ
  for (const readability of analysis.readabilityIssues) {
    issues.push({
      title: `読みにくさ: ${readability.slice(0, 80)}`,
      description: `ペルソナ「${context.persona.label}」にとって読みにくい要素:\n\n${readability}`,
      category: "improvement",
      priority: "low",
      pageUrl: context.pageUrl,
      scenarioId: context.scenarioId,
      persona: context.persona.role,
    });
  }

  // スピナー停滞
  if (analysis.stuckSpinners) {
    issues.push({
      title: "ローディングが停滞している",
      description: `ペルソナ「${context.persona.label}」の許容待機時間 ${context.persona.patience}秒 を超過する可能性あり。`,
      category: "bug",
      priority: "high",
      pageUrl: context.pageUrl,
      scenarioId: context.scenarioId,
      persona: context.persona.role,
    });
  }

  return issues;
}

/**
 * 問題をレポートする（コンソール出力 + オプションでAPI送信）
 */
export async function reportIssue(
  _page: Page,
  issue: DetectedIssue,
): Promise<void> {
  const emoji =
    issue.priority === "high"
      ? "🔴"
      : issue.priority === "medium"
        ? "🟡"
        : "🔵";
  console.log(
    `${emoji} [${issue.scenarioId}] ${issue.title} (${issue.category}/${issue.priority})`,
  );
  console.log(`   URL: ${issue.pageUrl}`);
  console.log(`   ${issue.description.split("\n")[0]}`);
}

/**
 * ペルソナ全体のテスト結果サマリーを出力する
 */
export function printSummary(
  personaLabel: string,
  results: ScenarioResult[],
): void {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  const allIssues = results.flatMap((r) => r.issues);
  const highCount = allIssues.filter((i) => i.priority === "high").length;
  const medCount = allIssues.filter((i) => i.priority === "medium").length;
  const lowCount = allIssues.filter((i) => i.priority === "low").length;

  console.log("\n" + "═".repeat(60));
  console.log(`📊 ${personaLabel} テスト結果サマリー`);
  console.log("═".repeat(60));
  console.log(`  シナリオ: ${passed}/${total} PASS (${failed} FAIL)`);
  console.log(
    `  検出問題: 🔴 high=${highCount}  🟡 medium=${medCount}  🔵 low=${lowCount}`,
  );

  if (failed > 0) {
    console.log("\n  ❌ 失敗シナリオ:");
    for (const r of results.filter((r) => !r.passed)) {
      const reasons = r.issues
        .filter((i) => i.priority === "high")
        .map((i) => i.title)
        .join(", ");
      console.log(
        `     ${r.scenario.id}: ${r.scenario.title} — ${reasons || "ステップ失敗"}`,
      );
    }
  }

  if (highCount > 0) {
    console.log("\n  🔴 High Priority Issues:");
    const uniqueTitles = new Set<string>();
    for (const issue of allIssues.filter((i) => i.priority === "high")) {
      if (uniqueTitles.has(issue.title)) continue;
      uniqueTitles.add(issue.title);
      console.log(`     [${issue.scenarioId}] ${issue.title}`);
      console.log(`       URL: ${issue.pageUrl}`);
    }
  }

  console.log("═".repeat(60) + "\n");
}
