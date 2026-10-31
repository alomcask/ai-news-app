import Link from "next/link";

type PaginationProps = {
  basePath: string;
  page: number;
  totalPages: number;
  // 페이지 링크에 유지할 추가 쿼리(예: category)
  params?: Record<string, string>;
};

const baseClass =
  "flex min-h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const idleClass = `${baseClass} border-border bg-surface text-muted hover:border-brand hover:text-brand`;
const currentClass = `${baseClass} border-brand bg-brand text-white`;
const disabledClass = `${baseClass} border-border bg-surface text-muted opacity-50`;

function pageHref(basePath: string, page: number, params?: Record<string, string>) {
  const query = new URLSearchParams(params);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// 현재 페이지 주변 5개만 보여 주고, 처음/끝 페이지는 항상 포함한다.
function visiblePages(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

export function Pagination({ basePath, page, totalPages, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="페이지"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={pageHref(basePath, page - 1, params)} className={idleClass}>
          이전
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          이전
        </span>
      )}
      {visiblePages(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(basePath, p, params)}
            aria-current={p === page ? "page" : undefined}
            className={p === page ? currentClass : idleClass}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={pageHref(basePath, page + 1, params)} className={idleClass}>
          다음
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          다음
        </span>
      )}
    </nav>
  );
}
