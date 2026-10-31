import { anthropic } from "./anthropic";
import {
  CLASSIFY_SYSTEM_PROMPT,
  UNCATEGORIZED,
  buildClassifyMessage,
  buildClassifySchema,
  type CategoryOption,
} from "./prompt";

const MODEL = "claude-haiku-5-5";

// 저장된 기사를 현재 카테고리 목록 기준으로 다시 분류한다. 실패하면 throw한다.
export async function classifyArticle(
  article: { source: string; titleOriginal: string; titleKo: string; summaryKo: string },
  categories: CategoryOption[],
): Promise<number | null> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: CLASSIFY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildClassifyMessage(article, categories) }],
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: buildClassifySchema(categories) },
    },
  });

  if (response.stop_reason !== "end_turn") {
    throw new Error(`Claude 응답이 완료되지 않았습니다 (${response.stop_reason})`);
  }
  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Claude 응답에 텍스트가 없습니다");

  const { category } = JSON.parse(text) as { category?: unknown };
  if (typeof category !== "string") throw new Error("Claude 응답 형식이 올바르지 않습니다");

  if (category === UNCATEGORIZED) return null;
  return categories.find((c) => c.name === category)?.id ?? null;
}
