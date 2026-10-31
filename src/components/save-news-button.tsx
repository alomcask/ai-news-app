"use client";

import { useState, useTransition } from "react";
import { saveToNotionAction } from "@/app/dashboard/actions";

type SaveNewsButtonProps = {
  articleId: number;
  notionPageUrl: string | null;
};

export function SaveNewsButton({ articleId, notionPageUrl }: SaveNewsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [savedUrl, setSavedUrl] = useState(notionPageUrl);
  const [error, setError] = useState<string>();

  if (savedUrl) {
    return (
      <a
        href={savedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-9 self-start rounded-full bg-brand-soft px-4 py-1.5 text-sm font-medium text-brand-strong transition hover:opacity-80"
      >
        저장됨
      </a>
    );
  }

  function handleClick() {
    setError(undefined);
    startTransition(async () => {
      const result = await saveToNotionAction(articleId);
      if (result.ok) setSavedUrl(result.notionPageUrl);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="min-h-9 rounded-full border border-brand px-4 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {isPending ? "저장 중…" : "뉴스 저장"}
      </button>
      {error && (
        <p role="status" className="text-xs text-foreground">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
