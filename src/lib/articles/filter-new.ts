import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import type { FeedArticle } from "@/lib/rss/fetch-feeds";

// 이미 저장된 URL과 같은 요청 안의 중복 URL을 제외한다. Claude 중복 호출을 막기 위한 단계다.
export async function filterNewArticles(
  items: FeedArticle[],
): Promise<FeedArticle[]> {
  const unique = [...new Map(items.map((item) => [item.url, item])).values()];
  if (unique.length === 0) return [];

  const existing = await db
    .select({ url: articles.url })
    .from(articles)
    .where(inArray(articles.url, unique.map((item) => item.url)));
  const known = new Set(existing.map((row) => row.url));

  return unique.filter((item) => !known.has(item.url));
}
