/**
 * オーケストレーター設定
 *
 * 環境変数:
 *   ANTHROPIC_API_KEY  — Claude Agent SDK の認証キー
 *   OPENAI_API_KEY     — OpenAI Codex の認証キー
 *
 * このファイルはプロジェクトごとにカスタマイズする想定。
 * dev-foundation テンプレートではデフォルト値を提供。
 */

export interface AgentConfig {
  claude: {
    model: string
    reviewModel: string
    apiKey: string
  }
  codex: {
    model: string
    sandbox: 'read-only' | 'workspace-write' | 'danger-full-access'
    apiKey: string
  }
  budget: {
    maxMonthlyUsd: number
    maxMonthlyTasks: number
  }
  retry: {
    maxReviewLoops: number
  }
  autoLoop: {
    maxIterations: number
  }
  paths: {
    projectRoot: string
    promptsDir: string
    specsDir: string
    implementationStatus: string
    convictionLog: string
    learnLog: string
    budgetFile: string
    logFile: string
  }
}

function resolveProjectRoot(): string {
  // .agent/ の親ディレクトリがプロジェクトルート
  return new URL('../', import.meta.url).pathname.replace(/\/$/, '')
}

export function loadConfig(overrides?: Partial<AgentConfig>): AgentConfig {
  const projectRoot = resolveProjectRoot()

  const defaults: AgentConfig = {
    claude: {
      model: 'claude-sonnet-4-6',
      reviewModel: 'claude-sonnet-4-6',
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    },
    codex: {
      model: 'codex-mini-latest',
      sandbox: 'workspace-write',
      apiKey: process.env.OPENAI_API_KEY ?? '',
    },
    budget: {
      maxMonthlyUsd: 150,
      maxMonthlyTasks: 50,
    },
    retry: {
      maxReviewLoops: 3,
    },
    autoLoop: {
      maxIterations: 10,
    },
    paths: {
      projectRoot,
      promptsDir: `${projectRoot}/.agent/prompts`,
      specsDir: `${projectRoot}/specs`,
      implementationStatus: `${projectRoot}/.agent/shared/IMPLEMENTATION_STATUS.md`,
      convictionLog: `${projectRoot}/.agent/shared/CONVICTION_LOG.md`,
      learnLog: `${projectRoot}/.agent/shared/LEARN_LOG.md`,
      budgetFile: `${projectRoot}/.agent/budget.json`,
      logFile: `${projectRoot}/.agent/orchestrator.log`,
    },
  }

  if (!overrides) return defaults

  return {
    claude: { ...defaults.claude, ...overrides.claude },
    codex: { ...defaults.codex, ...overrides.codex },
    budget: { ...defaults.budget, ...overrides.budget },
    retry: { ...defaults.retry, ...overrides.retry },
    autoLoop: { ...defaults.autoLoop, ...overrides.autoLoop },
    paths: { ...defaults.paths, ...overrides.paths },
  }
}
