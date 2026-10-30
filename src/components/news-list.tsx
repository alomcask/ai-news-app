import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { NewsCard } from "./news-card";

export async function NewsList() {
  const rows = await db
    .select({ article: articles, categoryName: categories.name })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.fetchedAt));

  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-muted">아직 수집된 뉴스가 없습니다.</p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ article, categoryName }) => (
        <NewsCard
          key={article.id}
          article={article}
          categoryName={categoryName}
        />
      ))}
    </div>
  );
}

export function NewsListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}
