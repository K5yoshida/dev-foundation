/**
 * AI Vision 探索的E2Eテスト — 共通型定義
 *
 * プロジェクト非依存。そのままコピーして使える。
 */

// ─── ペルソナ ───

/** プロジェクトに合わせて変更する（例: "junior_sales" | "admin" | "viewer"） */
export type PersonaRole = string;

export interface Persona {
  role: PersonaRole;
  label: string;
  email: string;
  appRole: string;
  /** このペルソナの行動特性（AI分析のコンテキストに使う） */
  description: string;
  /** 待機許容秒数（これを超えたら「遅い」と判定） */
  patience: number;
  techLiteracy: "low" | "medium" | "high";
}

// ─── シナリオ ───

export type FlowAction =
  | "navigate"
  | "click"
  | "type"
  | "wait"
  | "screenshot_check"
  | "assert_visible"
  | "assert_not_visible"
  | "select"
  | "viewport";

export interface FlowStep {
  action: FlowAction;
  /** セレクタ or URL or viewport サイズ "WxH" */
  target?: string;
  /** 入力値（type用）or 待機ms（wait用） */
  value?: string;
  /** 人間語での説明 */
  description: string;
  /** AIビジョンに聞く質問（省略可） */
  aiCheck?: string;
}

export interface CognitiveCheckpoint {
  /** 何を確認するか */
  description: string;
  /** AIに問いかける質問 */
  question: string;
}

export interface Scenario {
  id: string;
  persona: PersonaRole;
  title: string;
  /** 人間語でのゴール */
  goal: string;
  startPage: string;
  expectedFlow: FlowStep[];
  cognitiveCheckpoints: CognitiveCheckpoint[];
  /**
   * 成功条件。以下のプレフィックスで検証方法が変わる:
   * - "selector:..." → CSSセレクタで要素の可視性をチェック
   * - "url:..." → 現在URLにその文字列が含まれるかチェック
   * - "text:..." → ページ内にそのテキストが存在するかチェック
   * - プレフィックスなし → 人間向け説明文（basicHealthCheckに委任）
   */
  successCriteria: string[];
  uxQualityChecks: string[];
  /** シナリオ全体のタイムアウト（ms） */
  timeout: number;
}

// ─── AI Vision分析 ───

export interface VisionAnalysis {
  pageLoaded: boolean;
  errorsVisible: string[];
  warningsVisible: string[];
  stuckSpinners: boolean;
  visibleElements: string[];
  uxIssues: string[];
  readabilityIssues: string[];
  missingData: string[];
  overallAssessment: string;
  suggestedAction: string;
  /** 0-1 の信頼度スコア。0 = Vision未実行（APIキーなし等） */
  confidenceScore: number;
}

// ─── 問題レポート ───

export type IssueCategory = "bug" | "improvement" | "feature";
export type IssuePriority = "high" | "medium" | "low";

export interface DetectedIssue {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  screenshotBuffer?: Buffer;
  pageUrl: string;
  scenarioId: string;
  persona: PersonaRole;
}

// ─── シナリオ実行結果 ───

export type StepResult = {
  step: FlowStep;
  passed: boolean;
  error?: string;
  visionAnalysis?: VisionAnalysis;
  /** このステップで検出された問題 */
  issues?: DetectedIssue[];
  durationMs: number;
};

export interface ScenarioResult {
  scenario: Scenario;
  passed: boolean;
  steps: StepResult[];
  issues: DetectedIssue[];
  totalDurationMs: number;
}
