import { db } from "@/db";
import { articles } from "@/db/schema";
import type { ProcessedArticle } from "@/lib/ai/process-article";

// url unique 제약으로 중복을 걸러내며, 새로 저장된 건수를 반환한다.
export async function saveArticles(items: ProcessedArticle[]): Promise<number> {
  // 같은 요청 안의 중복 URL은 미리 제거한다.
  const unique = [...new Map(items.map((item) => [item.url, item])).values()];
  if (unique.length === 0) return 0;

  const inserted = await db
    .insert(articles)
    .values(
      unique.map((item) => ({
        url: item.url,
        source: item.source,
        titleOriginal: item.titleOriginal,
        titleKo: item.titleKo,
        summaryKo: item.summaryKo,
        categoryId: item.categoryId,
        publishedAt: item.publishedAt,
      })),
    )
    .onConflictDoNothing({ target: articles.url })
    .returning({ id: articles.id });

  return inserted.length;
}
