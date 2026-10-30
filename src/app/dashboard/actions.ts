"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { fetchFeeds } from "@/lib/rss/fetch-feeds";
import { saveArticles } from "@/lib/articles/save-articles";

export type FetchNewsResult =
  | {
      ok: true;
      fetchedCount: number;
      newCount: number;
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

    const newCount = await saveArticles(articles);
    revalidatePath("/dashboard");

    return { ok: true, fetchedCount: articles.length, newCount, failedSources };
  } catch (error) {
    console.error("fetchNewsAction failed", error);
    return { ok: false, error: "뉴스를 저장하는 중 오류가 발생했습니다." };
  }
}
