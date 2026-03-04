import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  phase: string
  message: string
}

let logFilePath = ''
let stdoutEnabled = true

export function initLogger(filePath: string, enableStdout = true): void {
  logFilePath = filePath
  stdoutEnabled = enableStdout
  mkdirSync(dirname(filePath), { recursive: true })
}

function formatEntry(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.phase}] ${entry.message}`
}

export function log(level: LogLevel, phase: string, message: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    phase,
    message,
  }

  const formatted = formatEntry(entry)

  // 標準出力（process.stdout/stderr を直接使用）
  if (stdoutEnabled) {
    if (level === 'error') {
      process.stderr.write(formatted + '\n')
    } else {
      process.stdout.write(formatted + '\n')
    }
  }

  // ファイル出力
  if (logFilePath) {
    appendFileSync(logFilePath, formatted + '\n')
  }
}
