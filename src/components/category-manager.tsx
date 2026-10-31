"use client";

import { useRef, useState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  reclassifyArticlesAction,
  updateCategoryAction,
  type CategoryActionResult,
} from "@/app/dashboard/category-actions";

type CategoryItem = { id: number; name: string; description: string };
type Message = { text: string; isError: boolean };

const chipBase =
  "inline-flex min-h-9 shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const addButtonClass = `${chipBase} border border-dashed border-brand text-brand hover:bg-brand-soft`;
const manageButtonClass = `${chipBase} border border-border bg-surface text-muted hover:border-brand hover:text-brand`;
const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-brand";
const smallButtonClass =
  "min-h-9 rounded-full border border-border bg-surface px-3 text-sm font-medium text-muted hover:border-brand hover:text-brand disabled:opacity-60";
const primaryButtonClass =
  "min-h-9 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60";

function Status({ message }: { message?: Message }) {
  return (
    <p role="status" className={`min-h-5 text-sm ${message?.isError ? "text-foreground" : "text-muted"}`}>
      {message?.isError && "⚠️ "}
      {message?.text}
    </p>
  );
}

function CategoryForm({
  initial,
  submitLabel,
  onSubmit,
  onDone,
  autoFocus,
}: {
  initial?: CategoryItem;
  submitLabel: string;
  onSubmit: (name: string, description: string) => Promise<CategoryActionResult>;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const description = String(data.get("description") ?? "");
    setMessage(undefined);
    startTransition(async () => {
      const result = await onSubmit(name, description);
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      if (!initial) formRef.current?.reset();
      onDone?.();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium">
        이름
        <input
          name="name"
          defaultValue={initial?.name}
          maxLength={30}
          required
          autoFocus={autoFocus}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="block text-sm font-medium">
        설명
        <textarea
          name="description"
          defaultValue={initial?.description}
          maxLength={200}
          rows={2}
          className={`${inputClass} mt-1`}
        />
        <span className="mt-1 block text-xs font-normal text-muted">Claude가 이 설명을 보고 분류해요.</span>
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={primaryButtonClass}>
          {isPending ? "저장 중…" : submitLabel}
        </button>
        <Status message={message} />
      </div>
    </form>
  );
}

function CategoryRow({ category }: { category: CategoryItem }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>();

  function handleDelete() {
    if (!window.confirm(`"${category.name}" 카테고리를 삭제할까요? 해당 뉴스는 미분류가 됩니다.`)) return;
    setMessage(undefined);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.ok) setMessage({ text: result.error, isError: true });
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-border p-3">
        <CategoryForm
          initial={category}
          submitLabel="저장"
          onSubmit={(name, description) => updateCategoryAction(category.id, name, description)}
          onDone={() => setEditing(false)}
          autoFocus
        />
        <button type="button" onClick={() => setEditing(false)} className={`${smallButtonClass} mt-2`}>
          취소
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
      <div className="min-w-0">
        <p className="font-medium">{category.name}</p>
        {category.description && <p className="text-sm text-muted">{category.description}</p>}
        <Status message={message} />
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => setEditing(true)} disabled={isPending} className={smallButtonClass}>
          수정
        </button>
        <button type="button" onClick={handleDelete} disabled={isPending} className={smallButtonClass}>
          삭제
        </button>
      </div>
    </li>
  );
}

function ReclassifySection() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>();

  function run(scope: "uncategorized" | "all") {
    setMessage(undefined);
    startTransition(async () => {
      const result = await reclassifyArticlesAction(scope);
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      const notes = [
        result.failedCount > 0 && `실패 ${result.failedCount}건`,
        result.remainingCount > 0 && `남은 ${result.remainingCount}건은 다시 실행해 주세요`,
      ].filter(Boolean);
      setMessage({
        text: `${result.updatedCount}건 분류가 바뀌었어요${notes.length > 0 ? ` (${notes.join(", ")})` : ""}`,
        isError: false,
      });
    });
  }

  return (
    <section className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-bold">기존 뉴스 재분류</h3>
      <p className="mt-1 text-xs text-muted">
        현재 카테고리 기준으로 Claude가 다시 분류해요. 1회 최대 50건, 최신 뉴스부터 처리해요.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => run("uncategorized")} disabled={isPending} className={smallButtonClass}>
          {isPending ? "분류 중…" : "미분류만"}
        </button>
        <button type="button" onClick={() => run("all")} disabled={isPending} className={smallButtonClass}>
          {isPending ? "분류 중…" : "전체"}
        </button>
      </div>
      <Status message={message} />
    </section>
  );
}

export function CategoryManager({ categories }: { categories: CategoryItem[] }) {
  const addDialog = useRef<HTMLDialogElement>(null);
  const manageDialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => addDialog.current?.showModal()} className={addButtonClass}>
        + 카테고리 추가
      </button>
      <button type="button" onClick={() => manageDialog.current?.showModal()} className={manageButtonClass}>
        관리
      </button>

      <dialog
        ref={addDialog}
        aria-label="카테고리 추가"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/40"
      >
        <h2 className="mb-3 text-lg font-bold">카테고리 추가</h2>
        <CategoryForm
          submitLabel="추가"
          onSubmit={createCategoryAction}
          onDone={() => addDialog.current?.close()}
          autoFocus
        />
        <button type="button" onClick={() => addDialog.current?.close()} className={`${smallButtonClass} mt-3`}>
          닫기
        </button>
      </dialog>

      <dialog
        ref={manageDialog}
        aria-label="카테고리 관리"
        className="m-auto max-h-[85vh] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/40"
      >
        <h2 className="mb-3 text-lg font-bold">카테고리 관리</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">카테고리가 없어요. 먼저 추가해 주세요.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        )}
        <ReclassifySection />
        <button type="button" onClick={() => manageDialog.current?.close()} className={`${smallButtonClass} mt-4`}>
          닫기
        </button>
      </dialog>
    </>
  );
}
