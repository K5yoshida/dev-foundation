/**
 * Codex Builder — Phase 2: 実装エージェント
 *
 * OpenAI Codex CLI を MCP サーバーとして起動し、
 * タスクを実装させる。
 */

import { spawn, type ChildProcess } from 'node:child_process'
import type { AgentConfig } from '../config.js'
import { log } from '../lib/logger.js'

export interface BuildResult {
  success: boolean
  output: string
  threadId?: string
}

/**
 * Codex MCP サーバーとの JSON-RPC 通信を行うヘルパー。
 */
class CodexMcpClient {
  private process: ChildProcess
  private buffer = ''
  private requestId = 0
  private pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  >()

  constructor(private config: AgentConfig) {
    this.process = spawn('npx', ['-y', '@openai/codex', 'mcp-server'], {
      env: {
        ...process.env,
        OPENAI_API_KEY: config.codex.apiKey,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString()
      this.processBuffer()
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      log('debug', 'codex', `stderr: ${data.toString().trim()}`)
    })
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const response = JSON.parse(trimmed) as {
          id?: number
          result?: unknown
          error?: { message: string }
        }
        if (response.id !== undefined) {
          const pending = this.pendingRequests.get(response.id)
          if (pending) {
            this.pendingRequests.delete(response.id)
            if (response.error) {
              pending.reject(new Error(response.error.message))
            } else {
              pending.resolve(response.result)
            }
          }
        }
      } catch {
        // JSON パース失敗は無視（MCP サーバーの起動メッセージ等）
      }
    }
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const id = ++this.requestId

    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name, arguments: args },
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error('Codex MCP タイムアウト（5分）'))
      }, 300_000)

      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout)
          resolve(value)
        },
        reject: (reason) => {
          clearTimeout(timeout)
          reject(reason)
        },
      })

      this.process.stdin?.write(JSON.stringify(request) + '\n')
    })
  }

  async initialize(): Promise<void> {
    const id = ++this.requestId
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'agent-orchestrator', version: '1.0.0' },
      },
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: () => resolve(),
        reject,
      })
      this.process.stdin?.write(JSON.stringify(request) + '\n')
    })
  }

  close(): void {
    this.process.kill()
  }
}

/**
 * Codex に実装タスクを実行させる。
 *
 * @param task - 実装するタスクの説明
 * @param config - エージェント設定
 * @param options - 追加オプション
 */
export async function runBuilder(
  task: string,
  config: AgentConfig,
  options?: { dryRun?: boolean; threadId?: string },
): Promise<BuildResult> {
  log('info', 'builder', `Codex 実装開始: ${task}`)

  if (options?.dryRun) {
    log('info', 'builder', 'ドライラン: 実際のAPI呼び出しはスキップ')
    return {
      success: true,
      output: `[ドライラン] タスク: ${task}`,
    }
  }

  if (!config.codex.apiKey) {
    log('error', 'builder', 'OPENAI_API_KEY が未設定です')
    return {
      success: false,
      output: 'OPENAI_API_KEY が未設定です',
    }
  }

  const client = new CodexMcpClient(config)

  try {
    await client.initialize()

    const toolName = options?.threadId ? 'codex-reply' : 'codex'
    const args: Record<string, unknown> = options?.threadId
      ? { prompt: task, threadId: options.threadId }
      : {
          prompt: task,
          sandbox: config.codex.sandbox,
          'approval-policy': 'on-request',
          model: config.codex.model,
          cwd: config.paths.projectRoot,
        }

    const result = (await client.callTool(toolName, args)) as {
      content?: Array<{ text?: string }>
      threadId?: string
    }

    const output =
      result?.content
        ?.map((c) => c.text ?? '')
        .filter(Boolean)
        .join('\n') ?? ''

    log('info', 'builder', 'Codex 実装完了')

    return {
      success: true,
      output,
      threadId: result?.threadId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'builder', `Codex 実装エラー: ${message}`)
    return { success: false, output: message }
  } finally {
    client.close()
  }
}
