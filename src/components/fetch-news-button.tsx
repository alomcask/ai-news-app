"use client";

import { useState, useTransition } from "react";
import { fetchNewsAction } from "@/app/dashboard/actions";

export function FetchNewsButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean }>();

  function handleClick() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await fetchNewsAction();
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      const notes = [
        result.failedSources.length > 0 && `${result.failedSources.join(", ")} 실패`,
        result.failedCount > 0 && `처리 실패 ${result.failedCount}건`,
        result.skippedCount > 0 && `다음 실행으로 이월 ${result.skippedCount}건`,
      ].filter(Boolean);
      const partial = notes.length > 0 ? ` (${notes.join(", ")})` : "";
      setMessage({ text: `신규 ${result.newCount}건 추가${partial}`, isError: false });
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="min-h-9 rounded-full bg-brand px-5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {isPending ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
      <p
        role="status"
        className={`absolute right-0 top-full mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface px-3 py-1.5 text-xs shadow-sm ${
          message ? "" : "hidden"
        } ${message?.isError ? "text-foreground" : "text-muted"}`}
      >
        {message?.isError && "⚠️ "}
        {message?.text}
      </p>
    </div>
  );
}
