import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { log } from './logger.js'
import { findFeaturesWithPendingTasks } from './task-parser.js'

/**
 * プロンプトルーター — README.md の「次は？」判定ロジックのコード版
 *
 * プロジェクトの状態（ファイル群）を読み取り、
 * 最適なプロンプトを自動選択する。
 */

export interface RoutingResult {
  prompt: string
  category: string
  reason: string
  feature?: string
}

/** 各プロンプトが必要とするエージェント構成 */
export type AgentMode = 'claude-only' | 'claude-codex' | 'claude-codex-review'

export const PROMPT_AGENT_MAP: Record<string, AgentMode> = {
  // 00-think: Claude のみ（思考タスク）
  'product-conviction': 'claude-only',
  'ship-and-learn': 'claude-only',
  // 01-spec: Claude のみ（設計タスク）
  'spec-create': 'claude-only',
  'spec-review': 'claude-only',
  'spec-gap-fill': 'claude-only',
  // 02-plan: Claude のみ（計画タスク）
  'plan-create': 'claude-only',
  'plan-db-migration': 'claude-only',
  // 03-build: Claude 設計 → Codex 実装 → Claude レビュー
  'build-feature': 'claude-codex-review',
  'build-test-skeleton': 'claude-codex-review',
  // 04-quality: Claude のみ（品質チェック）
  'quality-scan': 'claude-only',
  'quality-review': 'claude-only',
  'quality-release': 'claude-only',
  'quality-e2e': 'claude-codex-review',
  'quality-visual': 'claude-only',
  'quality-security': 'claude-only',
  // 05-plumbing: Claude 分析 → Codex 修正
  'plumbing-data-flow': 'claude-codex',
  'plumbing-ux-flow': 'claude-codex',
  // 06-polish: Claude 分析 → Codex 修正
  'polish-product': 'claude-codex',
  'polish-copy-a11y': 'claude-codex',
  // 07-docs: Claude のみ
  'docs-sync': 'claude-only',
  // 08-ops: Claude のみ
  'ops-deploy': 'claude-only',
  'ops-monitor': 'claude-only',
}

/** 6つの推奨チェーン */
export const CHAINS: Record<string, string[]> = {
  A: [
    'product-conviction',
    'spec-create',
    'spec-review',
    'plan-create',
    'plan-db-migration',
    'build-test-skeleton',
    'build-feature',
    'quality-review',
    'ship-and-learn',
  ],
  B: ['quality-scan', 'docs-sync', 'plumbing-ux-flow'],
  C: ['quality-security', 'quality-e2e', 'quality-visual', 'quality-release', 'ops-deploy'],
  D: ['spec-gap-fill', 'spec-review', 'spec-create'],
  E: ['polish-product', 'polish-copy-a11y', 'quality-visual', 'ops-monitor'],
  F: ['product-conviction', 'spec-create', 'ship-and-learn'],
}

/**
 * プロンプト名からプロンプトファイルのパスを解決する。
 */
export function resolvePromptPath(promptsDir: string, promptName: string): string | null {
  // 全カテゴリを走査
  const categories = [
    '00-think',
    '01-spec',
    '02-plan',
    '03-build',
    '04-quality',
    '05-plumbing',
    '06-polish',
    '07-docs',
    '08-ops',
  ]

  for (const cat of categories) {
    const path = join(promptsDir, cat, `${promptName}.md`)
    if (existsSync(path)) return path
  }

  return null
}

/**
 * プロンプトファイルの内容を読み取る。
 */
export function loadPromptContent(promptsDir: string, promptName: string): string | null {
  const path = resolvePromptPath(promptsDir, promptName)
  if (!path) return null
  return readFileSync(path, 'utf-8')
}

/**
 * CONVICTION_LOG.md が空、または直近2週間で未実行かチェック。
 */
function needsConvictionCheck(convictionLogPath: string): boolean {
  if (!existsSync(convictionLogPath)) return true

  const content = readFileSync(convictionLogPath, 'utf-8').trim()
  if (content.length === 0) return true

  // 直近2週間以内の日付があるかチェック
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const datePattern = /\d{4}-\d{2}-\d{2}/g
  const dates = content.match(datePattern)
  if (!dates || dates.length === 0) return true

  const latestDate = dates.map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())[0]

  return latestDate ? latestDate < twoWeeksAgo : true
}

/**
 * Shipした機能のうち、ship-and-learn が未実行のものがあるかチェック。
 */
function needsShipAndLearn(specsDir: string, learnLogPath: string): string | null {
  if (!existsSync(specsDir)) return null

  const learnLogContent = existsSync(learnLogPath) ? readFileSync(learnLogPath, 'utf-8') : ''

  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const tasksPath = join(specsDir, entry.name, 'tasks.md')
    if (!existsSync(tasksPath)) continue

    const tasksContent = readFileSync(tasksPath, 'utf-8')

    // タスクが全て完了しているか（= Ship済み）
    const allCompleted = tasksContent.includes('[x]') && !tasksContent.includes('[ ]')

    if (allCompleted && !learnLogContent.includes(entry.name)) {
      return entry.name
    }
  }

  return null
}

/**
 * specs/ 配下にspec.md がない機能名を返す。
 */
function findFeaturesWithoutSpec(specsDir: string): string | null {
  if (!existsSync(specsDir)) return null

  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (!existsSync(join(specsDir, entry.name, 'spec.md'))) {
      return entry.name
    }
  }

  return null
}

/**
 * specs/ 配下に plan.md がない機能名を返す（spec.md はある）。
 */
function findFeaturesWithoutPlan(specsDir: string): string | null {
  if (!existsSync(specsDir)) return null

  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const hasSpec = existsSync(join(specsDir, entry.name, 'spec.md'))
    const hasPlan = existsSync(join(specsDir, entry.name, 'plan.md'))
    if (hasSpec && !hasPlan) return entry.name
  }

  return null
}

/**
 * メインルーティング関数。
 * README.md の「次は？」判定ロジックをそのまま実装。
 */
export function routeNextPrompt(paths: {
  promptsDir: string
  specsDir: string
  implementationStatus: string
  convictionLog: string
  learnLog: string
}): RoutingResult {
  // Step 0: ラテラルチェック（最優先）
  if (needsConvictionCheck(paths.convictionLog)) {
    log('info', 'router', 'ラテラルチェック: CONVICTION_LOG が空または2週間未実行')
    return {
      prompt: 'product-conviction',
      category: '00-think',
      reason: 'CONVICTION_LOG.md が空、または直近2週間で未実行',
    }
  }

  const shippedFeature = needsShipAndLearn(paths.specsDir, paths.learnLog)
  if (shippedFeature) {
    log('info', 'router', `ラテラルチェック: ${shippedFeature} の ship-and-learn が未実行`)
    return {
      prompt: 'ship-and-learn',
      category: '00-think',
      reason: `${shippedFeature} をShip済みだが、学習が未回収`,
      feature: shippedFeature,
    }
  }

  // Step 1-3: 通常フロー
  const missingSpec = findFeaturesWithoutSpec(paths.specsDir)
  if (missingSpec) {
    return {
      prompt: 'spec-create',
      category: '01-spec',
      reason: `${missingSpec} にspec.md がない`,
      feature: missingSpec,
    }
  }

  const missingPlan = findFeaturesWithoutPlan(paths.specsDir)
  if (missingPlan) {
    return {
      prompt: 'plan-create',
      category: '02-plan',
      reason: `${missingPlan} にplan.md がない`,
      feature: missingPlan,
    }
  }

  const featuresWithTasks = findFeaturesWithPendingTasks(paths.specsDir)
  if (featuresWithTasks.length > 0) {
    const first = featuresWithTasks[0]!
    return {
      prompt: 'build-feature',
      category: '03-build',
      reason: `${first.feature} に未実装タスクが ${first.tasks.length} 件ある`,
      feature: first.feature,
    }
  }

  // 全部完了 → 品質スキャン
  return {
    prompt: 'quality-scan',
    category: '04-quality',
    reason: '全タスク完了。品質スキャンを実行',
  }
}

/**
 * プロンプト名に対応するエージェント構成を取得。
 */
export function getAgentMode(promptName: string): AgentMode {
  return PROMPT_AGENT_MAP[promptName] ?? 'claude-only'
}
