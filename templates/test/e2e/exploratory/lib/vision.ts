/**
 * AI Vision スクリーンショット分析
 *
 * OpenAI Vision API でスクリーンショットを分析し、
 * UIの問題点を自動検出する。
 *
 * OPENAI_API_KEY がなければ分析をスキップする。
 * その場合は scenario-runner の basicHealthCheck が検証の主力になる。
 */

import OpenAI from "openai";
import type { Persona, VisionAnalysis } from "./types";

interface AnalysisContext {
  persona: Persona;
  currentPage: string;
  expectedState?: string;
  question?: string;
  /** シナリオ定義の uxQualityChecks をプロンプトに含める */
  uxQualityChecks?: string[];
}

/**
 * スクリーンショットをAIに分析させる
 */
export async function analyzeScreenshot(
  screenshot: Buffer,
  context: AnalysisContext,
): Promise<VisionAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return createSkippedAnalysis("OPENAI_API_KEY 未設定");
  }

  const client = new OpenAI({ apiKey });
  const base64Image = screenshot.toString("base64");

  const prompt = buildPrompt(context);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return createSkippedAnalysis("AIレスポンスなし");

    return JSON.parse(content) as VisionAnalysis;
  } catch (error) {
    console.warn(`[Vision] 分析エラー: ${error}`);
    return createSkippedAnalysis(`分析エラー: ${error}`);
  }
}

/**
 * 分析結果に問題が含まれるか判定する
 */
export function hasIssues(analysis: VisionAnalysis): boolean {
  return (
    analysis.errorsVisible.length > 0 ||
    analysis.uxIssues.length > 0 ||
    analysis.readabilityIssues.length > 0 ||
    analysis.stuckSpinners ||
    !analysis.pageLoaded
  );
}

function buildPrompt(context: AnalysisContext): string {
  const parts = [
    `あなたはUXテスターです。「${context.persona.label}」の視点でこの画面を評価してください。`,
    `ペルソナの特徴: ${context.persona.description}`,
    `ITリテラシー: ${context.persona.techLiteracy}`,
    `待機許容: ${context.persona.patience}秒`,
    `現在のURL: ${context.currentPage}`,
  ];

  if (context.expectedState) {
    parts.push(`期待される状態: ${context.expectedState}`);
  }
  if (context.question) {
    parts.push(`特に確認すべき点: ${context.question}`);
  }
  if (context.uxQualityChecks && context.uxQualityChecks.length > 0) {
    parts.push(
      `UX品質チェック項目（各項目について問題があれば uxIssues に追記）:\n${context.uxQualityChecks.map((c) => `- ${c}`).join("\n")}`,
    );
  }

  parts.push(`
重要な注意:
- 問題がない場合は空配列を返してください。問題がある場合のみ具体的に記述してください。
- 「ページが正常に表示されていない」「エラーが見える」「ローディングが止まっている」等の深刻な問題は必ず報告してください。
- UX改善提案は uxIssues に、表示エラーは errorsVisible に分けてください。
- confidenceScore は「自分の分析にどれだけ自信があるか」を 0.0〜1.0 で示してください。

以下のJSON形式で回答してください:
{
  "pageLoaded": boolean,
  "errorsVisible": ["エラーメッセージがあれば列挙（なければ空配列）"],
  "warningsVisible": ["警告があれば列挙（なければ空配列）"],
  "stuckSpinners": boolean,
  "visibleElements": ["見えている主要UI要素を列挙"],
  "uxIssues": ["このペルソナにとってのUX問題を列挙（なければ空配列）"],
  "readabilityIssues": ["読みにくい要素があれば列挙（なければ空配列）"],
  "missingData": ["表示されるべきなのに欠けているデータ（なければ空配列）"],
  "overallAssessment": "全体評価（1-2文）",
  "suggestedAction": "次にすべき操作の提案",
  "confidenceScore": 0.0-1.0
}`);

  return parts.join("\n");
}

/**
 * Vision分析がスキップされた場合の結果。
 * pageLoaded: true, 空配列を返す — ただし confidenceScore: 0 で「未検証」であることを明示。
 * hasIssues() は false を返すので、Vision なしでもテスト自体は壊れない。
 * 代わりに scenario-runner の basicHealthCheck + successCriteria が検証の主力になる。
 */
function createSkippedAnalysis(reason: string): VisionAnalysis {
  return {
    pageLoaded: true,
    errorsVisible: [],
    warningsVisible: [],
    stuckSpinners: false,
    visibleElements: [],
    uxIssues: [],
    readabilityIssues: [],
    missingData: [],
    overallAssessment: `⚠️ Vision未検証: ${reason}（DOM検証のみ実行）`,
    suggestedAction: "",
    confidenceScore: 0,
  };
}
