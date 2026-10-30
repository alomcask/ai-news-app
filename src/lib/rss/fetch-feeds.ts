import Parser from "rss-parser";
import { RSS_SOURCES, type RssSource } from "./sources";

export type FeedArticle = {
  url: string;
  source: string;
  titleOriginal: string;
  summaryOriginal: string;
  publishedAt: Date;
};

export type FetchFeedsResult = {
  articles: FeedArticle[];
  failedSources: string[];
};

const WINDOW_MS = 24 * 60 * 60 * 1000;
const SUMMARY_MAX_LENGTH = 300;

const parser = new Parser({ timeout: 10_000 });

// 추적 파라미터와 해시를 제거해 같은 기사가 다른 URL로 중복 저장되지 않게 한다.
function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function toSummary(text: string | undefined): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > SUMMARY_MAX_LENGTH
    ? `${clean.slice(0, SUMMARY_MAX_LENGTH).trimEnd()}…`
    : clean;
}

async function fetchSource(
  source: RssSource,
  since: Date,
): Promise<FeedArticle[]> {
  const feed = await parser.parseURL(source.feedUrl);
  const articles: FeedArticle[] = [];

  for (const item of feed.items) {
    const url = item.link ? normalizeUrl(item.link) : null;
    const title = item.title?.trim();
    const publishedAt = item.isoDate ? new Date(item.isoDate) : null;
    if (!url || !title || !publishedAt || Number.isNaN(publishedAt.getTime())) {
      continue;
    }
    if (publishedAt < since) continue;

    articles.push({
      url,
      source: source.name,
      titleOriginal: title,
      summaryOriginal: toSummary(item.contentSnippet ?? item.content),
      publishedAt,
    });
  }

  return articles;
}

// 지난 24시간 기사만 반환한다. 한 피드가 실패해도 나머지는 계속 처리한다.
export async function fetchFeeds(now = new Date()): Promise<FetchFeedsResult> {
  const since = new Date(now.getTime() - WINDOW_MS);
  const results = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchSource(source, since)),
  );

  const articles: FeedArticle[] = [];
  const failedSources: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      failedSources.push(RSS_SOURCES[i].name);
      console.error(`RSS fetch failed: ${RSS_SOURCES[i].name}`, result.reason);
    }
  });

  return { articles, failedSources };
}
