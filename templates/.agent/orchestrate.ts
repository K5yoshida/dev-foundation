#!/usr/bin/env tsx
/**
 * Agent Orchestrator — Claude Code × OpenAI Codex 自動連携
 *
 * 使い方:
 *   npx tsx .agent/orchestrate.ts next                    # 自動判定
 *   npx tsx .agent/orchestrate.ts "バナー表示を実装して"     # タスク指定
 *   npx tsx .agent/orchestrate.ts --prompt spec-create     # プロンプト直接指定
 *   npx tsx .agent/orchestrate.ts --chain A --feature "X"  # チェーン実行
 *   npx tsx .agent/orchestrate.ts --dry-run next           # ドライラン
 */

import { loadConfig, type AgentConfig } from './config.js'
import { initLogger, log } from './lib/logger.js'
import { checkBudget, recordTaskCompletion } from './lib/budget-tracker.js'
import {
  routeNextPrompt,
  getAgentMode,
  loadPromptContent,
  CHAINS,
  type RoutingResult,
  type AgentMode,
} from './lib/prompt-router.js'
import { getPendingTasks } from './lib/task-parser.js'
import { runDesigner } from './agents/claude-designer.js'
import { runBuilder } from './agents/codex-builder.js'
import { runReviewer } from './agents/claude-reviewer.js'

// ---------------------------------------------------------------------------
// CLI 引数パーサー
// ---------------------------------------------------------------------------

interface CliArgs {
  task: string
  prompt?: string
  chain?: string
  feature?: string
  dryRun: boolean
  claudeModel?: string
  codexModel?: string
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2)
  const result: CliArgs = { task: '', dryRun: false }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--dry-run':
        result.dryRun = true
        break
      case '--prompt':
        result.prompt = args[++i]
        break
      case '--chain':
        result.chain = args[++i]
        break
      case '--feature':
        result.feature = args[++i]
        break
      case '--claude-model':
        result.claudeModel = args[++i]
        break
      case '--codex-model':
        result.codexModel = args[++i]
        break
      default:
        if (!arg?.startsWith('--')) {
          result.task = arg ?? ''
        }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// メイン実行ロジック
// ---------------------------------------------------------------------------

async function executePrompt(
  promptName: string,
  mode: AgentMode,
  config: AgentConfig,
  options: { task: string; feature?: string; dryRun: boolean },
): Promise<{ success: boolean; output: string }> {
  log('info', 'orchestrate', `=== ${promptName} (${mode}) ===`)

  const promptContent = loadPromptContent(config.paths.promptsDir, promptName)
  const taskDescription = promptContent
    ? `${options.task}\n\nプロンプト手順:\n${promptContent}`
    : options.task

  switch (mode) {
    case 'claude-only': {
      // Claude のみで完結するタスク
      const result = await runDesigner(taskDescription, promptName, config, {
        feature: options.feature,
        dryRun: options.dryRun,
      })
      return { success: result.success, output: result.output }
    }

    case 'claude-codex': {
      // Claude 分析 → Codex 修正
      const designResult = await runDesigner(taskDescription, promptName, config, {
        feature: options.feature,
        dryRun: options.dryRun,
      })

      if (!designResult.success) {
        return { success: false, output: designResult.output }
      }

      const buildResult = await runBuilder(
        `以下の分析結果に基づいて修正を実装してください:\n\n${designResult.output}`,
        config,
        { dryRun: options.dryRun },
      )

      return { success: buildResult.success, output: buildResult.output }
    }

    case 'claude-codex-review': {
      // Claude 設計 → Codex 実装 → Claude レビュー（ループあり）
      const designResult = await runDesigner(taskDescription, promptName, config, {
        feature: options.feature,
        dryRun: options.dryRun,
      })

      if (!designResult.success) {
        return { success: false, output: designResult.output }
      }

      let lastBuildOutput = ''

      for (let loop = 0; loop < config.retry.maxReviewLoops; loop++) {
        log(
          'info',
          'orchestrate',
          `--- 実装・レビュー ループ ${loop + 1}/${config.retry.maxReviewLoops} ---`,
        )

        // Codex 実装
        const buildPrompt =
          loop === 0
            ? `以下の設計に基づいて実装してください:\n\n${designResult.output}`
            : `以下のレビュー指摘を修正してください:\n\n${lastBuildOutput}`

        const buildResult = await runBuilder(buildPrompt, config, {
          dryRun: options.dryRun,
        })

        if (!buildResult.success) {
          return { success: false, output: buildResult.output }
        }

        // Claude レビュー
        const reviewResult = await runReviewer(config, {
          dryRun: options.dryRun,
        })

        if (!reviewResult.success) {
          return { success: false, output: reviewResult.output }
        }

        if (reviewResult.approved) {
          log('info', 'orchestrate', 'レビュー APPROVED')
          return {
            success: true,
            output: `設計完了 → 実装完了 → レビュー APPROVED (ループ${loop + 1}回)`,
          }
        }

        log(
          'warn',
          'orchestrate',
          `レビュー CHANGES REQUESTED (${reviewResult.issues.length} issues)`,
        )
        lastBuildOutput = reviewResult.output
      }

      return {
        success: false,
        output: `レビューループ上限(${config.retry.maxReviewLoops}回)に到達。手動確認が必要です。`,
      }
    }

    default:
      return { success: false, output: `未知のモード: ${mode as string}` }
  }
}

// ---------------------------------------------------------------------------
// エントリーポイント
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv)

  // 設定ロード
  const config = loadConfig({
    claude: {
      model: cliArgs.claudeModel ?? 'claude-sonnet-4-6',
      reviewModel: cliArgs.claudeModel ?? 'claude-sonnet-4-6',
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    },
    codex: {
      model: cliArgs.codexModel ?? 'codex-mini-latest',
      sandbox: 'workspace-write',
      apiKey: process.env.OPENAI_API_KEY ?? '',
    },
  })

  // ロガー初期化
  initLogger(config.paths.logFile)

  log('info', 'orchestrate', '=== Agent Orchestrator 起動 ===')
  log('info', 'orchestrate', `Claude: ${config.claude.model} / Codex: ${config.codex.model}`)

  if (cliArgs.dryRun) {
    log('info', 'orchestrate', '*** ドライランモード ***')
  }

  // 予算チェック
  const budgetIssue = checkBudget(config.paths.budgetFile, config.budget)
  if (budgetIssue) {
    log('error', 'orchestrate', budgetIssue)
    process.exit(1)
  }

  // チェーン実行
  if (cliArgs.chain) {
    const chainName = cliArgs.chain.toUpperCase()
    const chain = CHAINS[chainName]
    if (!chain) {
      log(
        'error',
        'orchestrate',
        `未知のチェーン: ${chainName}。利用可能: ${Object.keys(CHAINS).join(', ')}`,
      )
      process.exit(1)
    }

    log('info', 'orchestrate', `チェーン ${chainName} 実行: ${chain.join(' → ')}`)

    for (const promptName of chain) {
      const mode = getAgentMode(promptName)
      const result = await executePrompt(promptName, mode, config, {
        task: `チェーン${chainName}の一部として ${promptName} を実行`,
        feature: cliArgs.feature,
        dryRun: cliArgs.dryRun,
      })

      if (!result.success) {
        log('error', 'orchestrate', `チェーン中断: ${promptName} が失敗 — ${result.output}`)
        process.exit(1)
      }
    }

    if (!cliArgs.dryRun) {
      recordTaskCompletion(config.paths.budgetFile, 5.0)
    }

    log('info', 'orchestrate', `=== チェーン ${chainName} 完了 ===`)
    return
  }

  // プロンプト直接指定
  if (cliArgs.prompt) {
    const mode = getAgentMode(cliArgs.prompt)
    const result = await executePrompt(cliArgs.prompt, mode, config, {
      task: cliArgs.task || `${cliArgs.prompt} を実行`,
      feature: cliArgs.feature,
      dryRun: cliArgs.dryRun,
    })

    if (!cliArgs.dryRun) {
      recordTaskCompletion(config.paths.budgetFile, 3.0)
    }

    log(
      result.success ? 'info' : 'error',
      'orchestrate',
      `=== ${cliArgs.prompt} ${result.success ? '完了' : '失敗'} ===`,
    )
    return
  }

  // "next" — 自動判定
  if (cliArgs.task === 'next' || cliArgs.task === '') {
    const routing: RoutingResult = routeNextPrompt({
      promptsDir: config.paths.promptsDir,
      specsDir: config.paths.specsDir,
      implementationStatus: config.paths.implementationStatus,
      convictionLog: config.paths.convictionLog,
      learnLog: config.paths.learnLog,
    })

    log('info', 'orchestrate', `自動判定: ${routing.prompt} — ${routing.reason}`)

    const mode = getAgentMode(routing.prompt)
    const result = await executePrompt(routing.prompt, mode, config, {
      task: routing.reason,
      feature: routing.feature,
      dryRun: cliArgs.dryRun,
    })

    if (!cliArgs.dryRun) {
      recordTaskCompletion(config.paths.budgetFile, 3.0)
    }

    log(
      result.success ? 'info' : 'error',
      'orchestrate',
      `=== ${routing.prompt} ${result.success ? '完了' : '失敗'} ===`,
    )
    return
  }

  // 自然言語タスク指定
  const mode = getAgentMode('build-feature')
  const result = await executePrompt('build-feature', mode, config, {
    task: cliArgs.task,
    feature: cliArgs.feature,
    dryRun: cliArgs.dryRun,
  })

  if (!cliArgs.dryRun) {
    recordTaskCompletion(config.paths.budgetFile, 3.0)
  }

  log(
    result.success ? 'info' : 'error',
    'orchestrate',
    `=== タスク ${result.success ? '完了' : '失敗'} ===`,
  )
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(`致命的エラー: ${message}\n`)
  process.exit(1)
})
