import { Suspense } from "react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <Suspense>
      <Show
        when="signed-in"
        fallback={
          <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
            <h1 className="text-3xl font-semibold">AI 뉴스 수집</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              로그인 후 이용할 수 있습니다.
            </p>
            <SignInButton mode="modal">
              <button className="h-12 rounded-full bg-foreground px-6 font-medium text-background">
                로그인
              </button>
            </SignInButton>
          </main>
        }
      >
        <header className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold">AI 뉴스 수집</h1>
          <UserButton />
        </header>
        <main className="flex flex-1 items-center justify-center p-8">
          <h2 className="text-3xl font-semibold">환영합니다</h2>
        </main>
      </Show>
    </Suspense>
  );
}
