"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { articles as articlesTable, categories } from "@/db/schema";
import { fetchFeeds } from "@/lib/rss/fetch-feeds";
import { filterNewArticles } from "@/lib/articles/filter-new";
import { saveArticles } from "@/lib/articles/save-articles";
import { mapWithConcurrency } from "@/lib/ai/concurrency";
import { processArticle } from "@/lib/ai/process-article";
import { saveToNotion } from "@/lib/notion/save-to-notion";

// 가져오기 1회당 Claude로 처리할 최대 기사 수와 동시 호출 수.
const MAX_PER_RUN = 20;
const CONCURRENCY = 4;

export type FetchNewsResult =
  | {
      ok: true;
      fetchedCount: number;
      newCount: number;
      failedCount: number;
      skippedCount: number;
      failedSources: string[];
    }
  | { ok: false; error: string };

export async function fetchNewsAction(): Promise<FetchNewsResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  try {
    const { articles, failedSources } = await fetchFeeds();
    if (failedSources.length > 0 && articles.length === 0) {
      return { ok: false, error: "RSS 피드를 가져오지 못했습니다." };
    }

    const fresh = await filterNewArticles(articles);
    const batch = fresh
      .toSorted(
        (a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
      )
      .slice(0, MAX_PER_RUN);
    const skippedCount = fresh.length - batch.length;

    const categoryOptions = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
      })
      .from(categories);

    const results = await mapWithConcurrency(batch, CONCURRENCY, (article) =>
      processArticle(article, categoryOptions),
    );
    const processed = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error("processArticle failed", batch[i].url, r.reason);
      }
    });

    const newCount = await saveArticles(processed);
    revalidatePath("/dashboard");

    return {
      ok: true,
      fetchedCount: articles.length,
      newCount,
      failedCount: batch.length - processed.length,
      skippedCount,
      failedSources,
    };
  } catch (error) {
    console.error("fetchNewsAction failed", error);
    return { ok: false, error: "뉴스를 저장하는 중 오류가 발생했습니다." };
  }
}

export type SaveToNotionResult =
  | { ok: true; notionPageUrl: string }
  | { ok: false; error: string };

export async function saveToNotionAction(articleId: number): Promise<SaveToNotionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  try {
    const [row] = await db
      .select({ article: articlesTable, categoryName: categories.name })
      .from(articlesTable)
      .leftJoin(categories, eq(articlesTable.categoryId, categories.id))
      .where(eq(articlesTable.id, articleId));
    if (!row) return { ok: false, error: "뉴스를 찾을 수 없습니다." };

    // 이미 저장된 뉴스는 중복 저장하지 않는다.
    if (row.article.notionPageUrl) {
      return { ok: true, notionPageUrl: row.article.notionPageUrl };
    }

    const notionPageUrl = await saveToNotion({
      titleKo: row.article.titleKo,
      summaryKo: row.article.summaryKo,
      url: row.article.url,
      categoryName: row.categoryName,
      publishedAt: row.article.publishedAt,
    });
    await db
      .update(articlesTable)
      .set({ notionPageUrl })
      .where(eq(articlesTable.id, articleId));
    revalidatePath("/dashboard");

    return { ok: true, notionPageUrl };
  } catch (error) {
    console.error("saveToNotionAction failed", error);
    return { ok: false, error: "Notion에 저장하지 못했습니다." };
  }
}
