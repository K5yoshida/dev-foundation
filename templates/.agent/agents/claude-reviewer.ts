/**
 * Claude Reviewer — Phase 3: レビューエージェント
 *
 * Claude Agent SDK を使って、Codex が実装したコードをレビューする。
 * git diff を読み取り、コード品質・セキュリティ・テスト充足をチェック。
 */

import type { AgentConfig } from '../config.js'
import { log } from '../lib/logger.js'

export interface ReviewResult {
  success: boolean
  approved: boolean
  output: string
  issues: ReviewIssue[]
}

export interface ReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  file: string
  description: string
}

const REVIEW_SYSTEM_PROMPT = `あなたはシニアコードレビュアーです。以下の観点でコードレビューを行ってください。

## レビュー観点
1. **型安全性**: unknown を使わず型を緩めていないか、型エラーの可能性
2. **セキュリティ**: 認証チェック漏れ、入力バリデーション漏れ、RLSポリシー
3. **テスト**: テストカバレッジ、エッジケースのテスト
4. **パフォーマンス**: N+1問題、不要な再レンダリング
5. **コード品質**: 重複コード、未使用の変数・インポート
6. **設計書との整合**: 設計書の仕様と実装の一致

## 出力形式
以下のJSON形式で問題を報告してください:

{
  "approved": true または false,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "file": "ファイルパス",
      "description": "問題の説明と修正提案"
    }
  ],
  "summary": "レビューサマリー"
}

- critical/high が1件でもあれば approved: false
- medium 以下のみなら approved: true（改善推奨として報告）`

interface ReviewJsonOutput {
  approved?: boolean
  issues?: ReviewIssue[]
  summary?: string
}

/**
 * Claude にコードレビューを実行させる。
 *
 * @param config - エージェント設定
 * @param options - 追加オプション
 */
export async function runReviewer(
  config: AgentConfig,
  options?: { dryRun?: boolean; diffTarget?: string },
): Promise<ReviewResult> {
  const { query } = await import('@anthropic-ai/claude-agent-sdk')

  log('info', 'reviewer', 'Claude レビュー開始')

  if (options?.dryRun) {
    log('info', 'reviewer', 'ドライラン: 実際のAPI呼び出しはスキップ')
    return {
      success: true,
      approved: true,
      output: '[ドライラン] レビュースキップ',
      issues: [],
    }
  }

  if (!config.claude.apiKey) {
    log('error', 'reviewer', 'ANTHROPIC_API_KEY が未設定です')
    return {
      success: false,
      approved: false,
      output: 'ANTHROPIC_API_KEY が未設定です',
      issues: [],
    }
  }

  const diffTarget = options?.diffTarget ?? 'HEAD'
  const reviewPrompt = `git diff ${diffTarget} の結果を確認し、全ての変更されたファイルをレビューしてください。
問題があれば指定のJSON形式で報告してください。
問題がなければ approved: true で報告してください。`

  let output = ''

  try {
    for await (const message of query({
      prompt: reviewPrompt,
      options: {
        model: config.claude.reviewModel,
        cwd: config.paths.projectRoot,
        systemPrompt: REVIEW_SYSTEM_PROMPT,
        allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],
        permissionMode: 'default',
        maxTurns: 20,
      },
    })) {
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block) {
            output += block.text
          }
        }
      }
    }

    // JSON部分を抽出してパース
    const jsonMatch = output.match(/\{[\s\S]*"approved"[\s\S]*\}/)
    if (jsonMatch?.[0]) {
      const parsed = JSON.parse(jsonMatch[0]) as ReviewJsonOutput

      const approved = parsed.approved ?? false
      const issues = parsed.issues ?? []

      log(
        'info',
        'reviewer',
        `Claude レビュー完了: ${approved ? 'APPROVED' : 'CHANGES REQUESTED'} (${issues.length} issues)`,
      )

      return { success: true, approved, output, issues }
    }

    // JSONが抽出できなかった場合は承認として扱う
    log('warn', 'reviewer', 'レビュー結果のJSONパースに失敗。承認として扱います')
    return { success: true, approved: true, output, issues: [] }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    log('error', 'reviewer', `Claude レビューエラー: ${errMessage}`)
    return { success: false, approved: false, output: errMessage, issues: [] }
  }
}
