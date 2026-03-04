import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export interface ParsedTask {
  line: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  parallel: boolean
  description: string
  agent?: string
}

/**
 * tasks.md から各タスクをパースする。
 *
 * マーカーの意味:
 *   [ ]  — 未着手
 *   [-]  — 進行中
 *   [x]  — 完了
 *   [!]  — ブロック
 *   [P]  — 並列実行可能
 */
export function parseTasks(filePath: string): ParsedTask[] {
  if (!existsSync(filePath)) return []

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const tasks: ParsedTask[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // チェックリスト行をマッチ: - [ ] or - [x] or - [-] or - [!]
    const match = trimmed.match(/^-\s+\[([x \-!])\]\s+(.+)$/)
    if (!match) continue

    const statusChar = match[1]
    const rawDescription = match[2] ?? ''

    let status: ParsedTask['status']
    switch (statusChar) {
      case ' ':
        status = 'pending'
        break
      case '-':
        status = 'in_progress'
        break
      case 'x':
        status = 'completed'
        break
      case '!':
        status = 'blocked'
        break
      default:
        status = 'pending'
    }

    // [P] マーカーの検出
    const parallel = rawDescription.includes('[P]')
    // (Claude Code) / (Codex) マーカーの検出
    const agentMatch = rawDescription.match(/\((Claude Code|Codex)\)/)
    const agent = agentMatch ? agentMatch[1] : undefined

    // 説明文からマーカーを除去
    const description = rawDescription
      .replace(/\[P\]\s*/g, '')
      .replace(/\((Claude Code|Codex)\)\s*/g, '')
      .replace(/\s*—\s*BLOCKED:.*$/, '')
      .trim()

    tasks.push({ line: trimmed, status, parallel, description, agent })
  }

  return tasks
}

/**
 * 未完了の並列実行可能タスクだけを返す。
 */
export function getPendingParallelTasks(filePath: string): ParsedTask[] {
  return parseTasks(filePath).filter((t) => t.status === 'pending' && t.parallel)
}

/**
 * 未完了のタスク全部を返す。
 */
export function getPendingTasks(filePath: string): ParsedTask[] {
  return parseTasks(filePath).filter((t) => t.status === 'pending')
}

/**
 * specs/ 配下の全機能の tasks.md を走査し、未完了タスクがある機能を返す。
 */
export function findFeaturesWithPendingTasks(
  specsDir: string,
): Array<{ feature: string; tasks: ParsedTask[] }> {
  if (!existsSync(specsDir)) return []

  const features: Array<{ feature: string; tasks: ParsedTask[] }> = []

  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const tasksPath = join(specsDir, entry.name, 'tasks.md')
    const pending = getPendingTasks(tasksPath)

    if (pending.length > 0) {
      features.push({ feature: entry.name, tasks: pending })
    }
  }

  return features
}
