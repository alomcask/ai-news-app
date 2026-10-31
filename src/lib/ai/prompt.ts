import type { FeedArticle } from "@/lib/rss/fetch-feeds";

export const UNCATEGORIZED = "미분류";

export type CategoryOption = { id: number; name: string; description: string };

export const SYSTEM_PROMPT = `당신은 AI 뉴스를 한국어로 옮기고 분류하는 편집자입니다.
영어 기사의 제목과 요약 일부를 받아 다음을 JSON으로 반환합니다.
- titleKo: 자연스러운 한국어 제목. 고유명사와 제품명은 원문 표기를 유지합니다.
- summaryKo: 한국어 요약 2~3문장. 입력에 없는 내용은 추가하지 않습니다. 입력이 짧으면 요약도 짧게 씁니다.
- category: 제시된 카테고리 이름 중 가장 알맞은 하나. 어디에도 맞지 않으면 "${UNCATEGORIZED}".`;

export const CLASSIFY_SYSTEM_PROMPT = `당신은 AI 뉴스를 분류하는 편집자입니다.
기사의 제목과 요약을 받아 제시된 카테고리 이름 중 가장 알맞은 하나를 JSON의 category로 반환합니다.
어디에도 맞지 않으면 "${UNCATEGORIZED}"를 반환합니다.`;

export function buildClassifyMessage(
  article: { source: string; titleOriginal: string; titleKo: string; summaryKo: string },
  categories: CategoryOption[],
): string {
  const categoryList = categories
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");
  return `카테고리:\n${categoryList}\n\n출처: ${article.source}\n제목: ${article.titleOriginal} (${article.titleKo})\n요약: ${article.summaryKo}`;
}

export function buildClassifySchema(categories: CategoryOption[]) {
  return {
    type: "object",
    properties: {
      category: { type: "string", enum: [...categories.map((c) => c.name), UNCATEGORIZED] },
    },
    required: ["category"],
    additionalProperties: false,
  };
}

export function buildUserMessage(
  article: FeedArticle,
  categories: CategoryOption[],
): string {
  const categoryList = categories
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");
  return `카테고리:\n${categoryList}\n\n출처: ${article.source}\n제목: ${article.titleOriginal}\n요약: ${article.summaryOriginal}`;
}

export function buildOutputSchema(categories: CategoryOption[]) {
  return {
    type: "object",
    properties: {
      titleKo: { type: "string" },
      summaryKo: { type: "string" },
      category: { type: "string", enum: [...categories.map((c) => c.name), UNCATEGORIZED] },
    },
    required: ["titleKo", "summaryKo", "category"],
    additionalProperties: false,
  };
}
