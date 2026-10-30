import type { Article } from "@/db/schema";

type NewsCardProps = {
  article: Article;
  categoryName: string | null;
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export function NewsCard({ article, categoryName }: NewsCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand-strong">
          {categoryName ?? "미분류"}
        </span>
        <span className="text-muted">{article.source}</span>
      </div>
      <h2 className="text-lg font-semibold leading-snug">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand"
        >
          {article.titleKo}
        </a>
      </h2>
      <p className="text-sm leading-relaxed text-muted">{article.summaryKo}</p>
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3 text-xs text-muted">
        <span className="line-clamp-1">{article.titleOriginal}</span>
        {article.publishedAt && (
          <time dateTime={article.publishedAt.toISOString()}>
            {dateFormat.format(article.publishedAt)}
          </time>
        )}
      </div>
    </article>
  );
}
