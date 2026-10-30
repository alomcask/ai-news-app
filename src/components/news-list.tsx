import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { NewsCard } from "./news-card";
import { Pagination } from "./pagination";

const PAGE_SIZE = 9;

type NewsListProps = {
  basePath: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export async function NewsList({ basePath, searchParams }: NewsListProps) {
  const requestedPage = parsePage((await searchParams).page);

  const [{ total }] = await db.select({ total: count() }).from(articles);

  if (total === 0) {
    return (
      <p className="py-16 text-center text-muted">아직 수집된 뉴스가 없습니다.</p>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages);

  const rows = await db
    .select({ article: articles, categoryName: categories.name })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .orderBy(
      sql`${articles.publishedAt} desc nulls last`,
      desc(articles.fetchedAt),
      desc(articles.id),
    )
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ article, categoryName }) => (
          <NewsCard
            key={article.id}
            article={article}
            categoryName={categoryName}
          />
        ))}
      </div>
      <Pagination basePath={basePath} page={page} totalPages={totalPages} />
    </>
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
