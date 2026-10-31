import Link from "next/link";
import { asc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { CategoryManager } from "./category-manager";
import { parseCategoryFilter, UNCATEGORIZED_PARAM } from "@/lib/articles/category-filter";

type CategoryBarProps = {
  basePath: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const baseClass =
  "inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const idleClass = `${baseClass} border-border bg-surface text-muted hover:border-brand hover:text-brand`;
const currentClass = `${baseClass} border-brand bg-brand text-white`;

export async function CategoryBar({ basePath, searchParams }: CategoryBarProps) {
  const filter = parseCategoryFilter((await searchParams).category);

  const [categoryRows, uncategorized] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, description: categories.description })
      .from(categories)
      .orderBy(asc(categories.id)),
    db.select({ id: articles.id }).from(articles).where(isNull(articles.categoryId)).limit(1),
  ]);

  const chips = [
    { key: "all", label: "전체", href: basePath, current: filter.type === "all" },
    ...categoryRows.map((c) => ({
      key: String(c.id),
      label: c.name,
      href: `${basePath}?category=${c.id}`,
      current: filter.type === "id" && filter.id === c.id,
    })),
    ...(uncategorized.length > 0
      ? [
          {
            key: UNCATEGORIZED_PARAM,
            label: "미분류",
            href: `${basePath}?category=${UNCATEGORIZED_PARAM}`,
            current: filter.type === "none",
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="카테고리"
      className="mb-6 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
    >
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-current={chip.current ? "true" : undefined}
          className={chip.current ? currentClass : idleClass}
        >
          {chip.label}
        </Link>
      ))}
      <CategoryManager categories={categoryRows} />
    </nav>
  );
}

export function CategoryBarSkeleton() {
  return <div className="mb-6 h-9 w-72 max-w-full animate-pulse rounded-full bg-surface" />;
}
