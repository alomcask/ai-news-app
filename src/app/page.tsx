import { Suspense } from "react";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { NewsList, NewsListSkeleton } from "@/components/news-list";

export default function Home() {
  return (
    <Suspense>
      <Show when="signed-out">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="text-3xl font-semibold">AI 뉴스 수집</h1>
          <p className="text-muted">로그인 후 이용할 수 있습니다.</p>
          <Link
            href="/sign-in"
            className="flex h-12 items-center rounded-full bg-brand px-6 font-medium text-white hover:bg-brand-strong"
          >
            로그인
          </Link>
        </main>
      </Show>
      <Show when="signed-in">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-brand">AI 뉴스 수집</h1>
            <UserButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Suspense fallback={<NewsListSkeleton />}>
            <NewsList />
          </Suspense>
        </main>
      </Show>
    </Suspense>
  );
}
