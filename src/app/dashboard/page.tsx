import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { FetchNewsButton } from "@/components/fetch-news-button";
import { NewsList, NewsListSkeleton } from "@/components/news-list";

export const metadata: Metadata = {
  title: "대시보드 | AI 뉴스 수집기",
};

async function RequireSignIn({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  return children;
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-brand">AI 뉴스 수집기</h1>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Suspense fallback={<NewsListSkeleton />}>
          <RequireSignIn>
            <FetchNewsButton />
            <NewsList basePath="/dashboard" searchParams={searchParams} />
          </RequireSignIn>
        </Suspense>
      </main>
    </>
  );
}
