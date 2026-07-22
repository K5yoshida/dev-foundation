/**
 * 新規ユーザーの探索的シナリオ（テンプレート）
 *
 * ━━━ カスタマイズ必須 ━━━
 * プロジェクトの画面・フローに合わせてシナリオを書き換えてください。
 * このファイルはサンプルです。
 */

import { test, expect } from "@playwright/test";
import { runScenario } from "../lib/scenario-runner";
import { PERSONAS } from "../lib/auth";
import type { Scenario } from "../lib/types";

const persona = PERSONAS.new_user;

// S01: 初回ログイン体験
const S01: Scenario = {
  id: "S01",
  persona: "new_user",
  title: "初回ログイン体験",
  goal: "ログインしてダッシュボードを理解する",
  startPage: "/login",
  timeout: 30_000,
  expectedFlow: [
    {
      action: "navigate",
      target: "/login",
      description: "ログインページに移動",
    },
    {
      action: "screenshot_check",
      description: "ログインページの表示確認",
      aiCheck:
        "ログインフォームが表示されているか？各入力欄のラベルは明確か？初見で何を入力すべきか分かるか？",
    },
    // TODO: プロジェクトのログインフォームに合わせてセレクタ・値を変更
    {
      action: "type",
      target: "#email",
      value: "e2e-new@example.com",
      description: "メールアドレス入力",
    },
    {
      action: "type",
      target: "#password",
      value: "test-password",
      description: "パスワード入力",
    },
    {
      action: "click",
      target: 'button[type="submit"]',
      description: "ログインボタンクリック",
    },
    { action: "wait", value: "3000", description: "ダッシュボード読み込み待ち" },
    {
      action: "screenshot_check",
      description: "ダッシュボードの表示確認",
      aiCheck:
        "ダッシュボードが表示されているか？初見のユーザーが次に何をすべきか明示されているか？",
    },
  ],
  cognitiveCheckpoints: [
    {
      description: "ダッシュボードの初期理解",
      question:
        "ダッシュボードに着いた後、最初に何をすべきか明示されているか？主要な操作ボタンは目立つか？",
    },
  ],
  successCriteria: ["ダッシュボードが表示される"],
  uxQualityChecks: ["ログインフォームのラベルが明確", "エラーメッセージが親切"],
};

// S02: ログイン失敗（エラーハンドリング確認）
const S02: Scenario = {
  id: "S02",
  persona: "new_user",
  title: "ログイン失敗",
  goal: "間違った認証情報でログインしようとする",
  startPage: "/login",
  timeout: 20_000,
  expectedFlow: [
    {
      action: "navigate",
      target: "/login",
      description: "ログインページに移動",
    },
    {
      action: "type",
      target: "#email",
      value: "e2e-new@example.com",
      description: "メールアドレス入力",
    },
    {
      action: "type",
      target: "#password",
      value: "wrong-password",
      description: "間違ったパスワード入力",
    },
    {
      action: "click",
      target: 'button[type="submit"]',
      description: "ログインボタンクリック",
    },
    { action: "wait", value: "2000", description: "エラー表示待ち" },
    {
      action: "screenshot_check",
      description: "エラー表示確認",
      aiCheck:
        "エラーメッセージが表示されているか？「何が間違っているか」が明確に伝わるか？次にどうすればいいか分かるか？",
    },
  ],
  cognitiveCheckpoints: [
    {
      description: "エラーメッセージの親切さ",
      question:
        "エラーメッセージが「何が間違っているか」明確に伝えるか？次にどうすればいいか分かるか？",
    },
  ],
  successCriteria: ["エラーメッセージが表示される"],
  uxQualityChecks: ["エラーメッセージの色・位置・文言"],
};

// TODO: S03〜S08: プロジェクトの主要機能に合わせてシナリオを追加
// 例: 一覧表示、検索、作成、編集、削除 etc.

const scenarios = [S01, S02];

test.describe("新規ユーザー (new_user)", () => {
  for (const scenario of scenarios) {
    test(`${scenario.id}: ${scenario.title}`, async ({ page }) => {
      test.setTimeout(scenario.timeout);
      const result = await runScenario(page, scenario, persona);

      if (result.issues.length > 0) {
        console.log(
          `[${scenario.id}] ${result.issues.length}件の問題を検出・報告しました`,
        );
      }

      expect(
        result.passed,
        `シナリオ「${scenario.title}」が失敗しました`,
      ).toBe(true);
    });
  }
});
