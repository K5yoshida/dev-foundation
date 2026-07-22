/**
 * AI駆動ページ探索
 *
 * ページ上のクリック可能要素を収集し、ペルソナの行動パターンに基づいて
 * 次にクリックすべき要素をAIが判断する。
 *
 * シナリオ定義が不十分な段階で「自由探索モード」として使える。
 */

import type { Page } from "@playwright/test";
import OpenAI from "openai";
import type { Persona } from "./types";

export interface DiscoveredElement {
  selector: string;
  tagName: string;
  text: string;
  href?: string;
  role?: string;
  isVisible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

/**
 * ページ上のクリック可能な要素を収集する
 */
export async function discoverClickableElements(
  page: Page,
): Promise<DiscoveredElement[]> {
  return page.evaluate(() => {
    const selectors = [
      "a[href]",
      "button",
      '[role="button"]',
      '[role="tab"]',
      '[role="link"]',
      "input[type=submit]",
      "input[type=button]",
      "[onclick]",
      "[data-testid]",
    ];

    const elements: {
      selector: string;
      tagName: string;
      text: string;
      href?: string;
      role?: string;
      isVisible: boolean;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }[] = [];

    const seen = new Set<Element>();

    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (seen.has(el)) continue;
        seen.add(el);

        const rect = el.getBoundingClientRect();
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          window.getComputedStyle(el).display !== "none" &&
          window.getComputedStyle(el).visibility !== "hidden";

        if (!isVisible) continue;

        const text = (el.textContent ?? "").trim().slice(0, 100);
        if (!text && !el.getAttribute("aria-label")) continue;

        elements.push({
          selector: buildSelector(el),
          tagName: el.tagName.toLowerCase(),
          text: text || el.getAttribute("aria-label") || "",
          href: el.getAttribute("href") ?? undefined,
          role: el.getAttribute("role") ?? undefined,
          isVisible,
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      }
    }

    return elements.slice(0, 50); // 上限50要素

    function buildSelector(el: Element): string {
      const id = el.getAttribute("id");
      if (id) return `#${id}`;

      const testId = el.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;

      const tag = el.tagName.toLowerCase();
      const text = (el.textContent ?? "").trim().slice(0, 30);
      if (text) return `${tag}:has-text("${text}")`;

      return tag;
    }
  });
}

/**
 * ペルソナの行動パターンに基づいて、次にクリックすべき要素をAIが選択する
 */
export async function chooseNextAction(
  elements: DiscoveredElement[],
  persona: Persona,
  goal: string,
  visitedUrls: string[],
): Promise<{ element: DiscoveredElement; reason: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });

  const elementList = elements
    .map(
      (el, i) =>
        `[${i}] ${el.tagName} "${el.text}" ${el.href ? `→ ${el.href}` : ""}`,
    )
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `あなたは「${persona.label}」として行動しています。
特徴: ${persona.description}
目標: ${goal}
訪問済みURL: ${visitedUrls.join(", ")}

画面上の要素リストから、次にクリックすべき要素を1つ選んでください。
既に訪問したURLへのリンクは避けてください。
JSON形式で { "index": 数値, "reason": "理由" } を返してください。
どれもクリックすべきでない場合は { "index": -1, "reason": "理由" } を返してください。`,
      },
      { role: "user", content: elementList },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  try {
    const result = JSON.parse(content) as { index: number; reason: string };
    if (result.index < 0 || result.index >= elements.length) return null;
    return { element: elements[result.index], reason: result.reason };
  } catch {
    return null;
  }
}
