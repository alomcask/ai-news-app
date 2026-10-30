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
      const partial =
        result.failedSources.length > 0
          ? ` (${result.failedSources.join(", ")} 실패)`
          : "";
      setMessage({ text: `신규 ${result.newCount}건 추가${partial}`, isError: false });
    });
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
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
        className={`text-sm ${message?.isError ? "text-foreground" : "text-muted"}`}
      >
        {message?.isError && "⚠️ "}
        {message?.text}
      </p>
    </div>
  );
}
