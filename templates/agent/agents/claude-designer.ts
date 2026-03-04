/**
 * Claude Designer — Phase 1: 設計エージェント
 *
 * Claude Agent SDK を使って、プロジェクトの設計書を読み、
 * spec.md / plan.md / tasks.md を生成する。
 */

import type { AgentConfig } from '../config.js'
import { log } from '../lib/logger.js'
import { loadPromptContent } from '../lib/prompt-router.js'

export interface DesignResult {
  success: boolean
  output: string
  filesCreated: string[]
}

/**
 * Claude に設計タスクを実行させる。
 *
 * @param task - 自然言語のタスク説明
 * @param promptName - 使用するプロンプト名（例: "spec-create"）
 * @param config - エージェント設定
 * @param options - 追加オプション
 */
export async function runDesigner(
  task: string,
  promptName: string,
  config: AgentConfig,
  options?: { feature?: string; dryRun?: boolean },
): Promise<DesignResult> {
  const { query } = await import('@anthropic-ai/claude-agent-sdk')

  // プロンプトファイルを読み込み
  const promptContent = loadPromptContent(config.paths.promptsDir, promptName)

  const systemPrompt = promptContent
    ? `以下のプロンプトの手順に従って作業してください:\n\n${promptContent}`
    : undefined

  const fullPrompt = options?.feature ? `機能「${options.feature}」について: ${task}` : task

  log('info', 'designer', `Claude 設計開始: ${promptName} — ${fullPrompt}`)

  if (options?.dryRun) {
    log('info', 'designer', 'ドライラン: 実際のAPI呼び出しはスキップ')
    return {
      success: true,
      output: `[ドライラン] プロンプト: ${promptName}, タスク: ${fullPrompt}`,
      filesCreated: [],
    }
  }

  if (!config.claude.apiKey) {
    log('error', 'designer', 'ANTHROPIC_API_KEY が未設定です')
    return {
      success: false,
      output: 'ANTHROPIC_API_KEY が未設定です',
      filesCreated: [],
    }
  }

  let output = ''
  const filesCreated: string[] = []

  try {
    for await (const message of query({
      prompt: fullPrompt,
      options: {
        model: config.claude.model,
        cwd: config.paths.projectRoot,
        systemPrompt,
        allowedTools: ['Read', 'Glob', 'Grep', 'Write', 'Edit'],
        permissionMode: 'acceptEdits',
        maxTurns: 30,
      },
    })) {
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block) {
            output += block.text
          }
          if ('name' in block && block.name === 'Write') {
            const input = block.input as Record<string, unknown>
            if (typeof input?.file_path === 'string') {
              filesCreated.push(input.file_path)
            }
          }
        }
      }
    }

    log('info', 'designer', `Claude 設計完了: ${filesCreated.length} ファイル作成`)

    return { success: true, output, filesCreated }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'designer', `Claude 設計エラー: ${message}`)
    return { success: false, output: message, filesCreated: [] }
  }
}
