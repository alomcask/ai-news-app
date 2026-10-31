import type { FeedArticle } from "@/lib/rss/fetch-feeds";
import { anthropic } from "./anthropic";
import {
  SYSTEM_PROMPT,
  UNCATEGORIZED,
  buildOutputSchema,
  buildUserMessage,
  type CategoryOption,
} from "./prompt";

const MODEL = "claude-haiku-5-5";
const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 600;

export type ProcessedArticle = FeedArticle & {
  titleKo: string;
  summaryKo: string;
  categoryId: number | null;
};

// 기사 1건당 Claude를 1번 호출해 한국어 제목·요약·카테고리를 받는다. 실패하면 throw한다.
export async function processArticle(
  article: FeedArticle,
  categories: CategoryOption[],
): Promise<ProcessedArticle> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(article, categories) }],
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: buildOutputSchema(categories) },
    },
  });

  if (response.stop_reason !== "end_turn") {
    throw new Error(`Claude 응답이 완료되지 않았습니다 (${response.stop_reason})`);
  }
  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Claude 응답에 텍스트가 없습니다");

  const parsed: unknown = JSON.parse(text);
  const { titleKo, summaryKo, category } = parsed as Record<string, unknown>;
  if (
    typeof titleKo !== "string" ||
    typeof summaryKo !== "string" ||
    typeof category !== "string" ||
    !titleKo.trim() ||
    !summaryKo.trim() ||
    titleKo.length > MAX_TITLE_LENGTH ||
    summaryKo.length > MAX_SUMMARY_LENGTH
  ) {
    throw new Error("Claude 응답 형식이 올바르지 않습니다");
  }

  // 목록에 없거나 "미분류"이면 null로 저장한다.
  const matched =
    category === UNCATEGORIZED
      ? undefined
      : categories.find((c) => c.name === category);

  return {
    ...article,
    titleKo: titleKo.trim(),
    summaryKo: summaryKo.trim(),
    categoryId: matched?.id ?? null,
  };
}
