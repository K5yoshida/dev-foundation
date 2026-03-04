import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { log } from './logger.js'

interface MonthlyUsage {
  tasks_completed: number
  estimated_cost_usd: number
}

interface BudgetData {
  [yearMonth: string]: MonthlyUsage
}

interface BudgetLimits {
  maxMonthlyUsd: number
  maxMonthlyTasks: number
}

function getCurrentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function loadBudgetData(filePath: string): BudgetData {
  if (!existsSync(filePath)) return {}
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as BudgetData
}

function saveBudgetData(filePath: string, data: BudgetData): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
}

function getMonthlyUsage(data: BudgetData, yearMonth: string): MonthlyUsage {
  return data[yearMonth] ?? { tasks_completed: 0, estimated_cost_usd: 0 }
}

/**
 * 月額予算を超過していないかチェック。
 * 超過している場合は理由を返す。超過していなければ null。
 */
export function checkBudget(filePath: string, limits: BudgetLimits): string | null {
  const data = loadBudgetData(filePath)
  const yearMonth = getCurrentYearMonth()
  const usage = getMonthlyUsage(data, yearMonth)

  if (usage.estimated_cost_usd >= limits.maxMonthlyUsd) {
    return `月額予算上限に達しました（${usage.estimated_cost_usd.toFixed(2)} / ${limits.maxMonthlyUsd} USD）`
  }

  if (usage.tasks_completed >= limits.maxMonthlyTasks) {
    return `月間タスク数上限に達しました（${usage.tasks_completed} / ${limits.maxMonthlyTasks} タスク）`
  }

  return null
}

/**
 * タスク完了を記録し、推定コストを加算する。
 */
export function recordTaskCompletion(filePath: string, estimatedCostUsd: number): void {
  const data = loadBudgetData(filePath)
  const yearMonth = getCurrentYearMonth()
  const usage = getMonthlyUsage(data, yearMonth)

  usage.tasks_completed += 1
  usage.estimated_cost_usd += estimatedCostUsd
  data[yearMonth] = usage

  saveBudgetData(filePath, data)

  log(
    'info',
    'budget',
    `タスク完了記録: ${yearMonth} — ${usage.tasks_completed}タスク, $${usage.estimated_cost_usd.toFixed(2)}`,
  )
}

/**
 * 現在の月の利用状況を取得。
 */
export function getCurrentUsage(filePath: string): MonthlyUsage {
  const data = loadBudgetData(filePath)
  return getMonthlyUsage(data, getCurrentYearMonth())
}
