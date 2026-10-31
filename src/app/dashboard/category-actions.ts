"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { mapWithConcurrency } from "@/lib/ai/concurrency";
import { classifyArticle } from "@/lib/ai/classify-article";

const MAX_NAME_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 200;
// 재분류 1회당 최대 처리 건수와 동시 호출 수.
const MAX_RECLASSIFY = 50;
const CONCURRENCY = 4;

export type CategoryActionResult = { ok: true } | { ok: false; error: string };

export type ReclassifyResult =
  | { ok: true; updatedCount: number; failedCount: number; remainingCount: number }
  | { ok: false; error: string };

function parseInput(name: string, description: string) {
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  if (!trimmedName) return { ok: false, error: "이름을 입력해 주세요." } as const;
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `이름은 ${MAX_NAME_LENGTH}자 이하로 입력해 주세요.` } as const;
  }
  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, error: `설명은 ${MAX_DESCRIPTION_LENGTH}자 이하로 입력해 주세요.` } as const;
  }
  return { ok: true, name: trimmedName, description: trimmedDescription } as const;
}

// unique 제약(이름 중복) 위반인지 확인한다. drizzle이 원인 에러를 cause에 담는다.
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.code
    ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

export async function createCategoryAction(
  name: string,
  description: string,
): Promise<CategoryActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const input = parseInput(name, description);
  if (!input.ok) return input;

  try {
    await db.insert(categories).values({ name: input.name, description: input.description });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "이미 있는 카테고리 이름입니다." };
    console.error("createCategoryAction failed", error);
    return { ok: false, error: "카테고리를 추가하지 못했습니다." };
  }
}

export async function updateCategoryAction(
  id: number,
  name: string,
  description: string,
): Promise<CategoryActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const input = parseInput(name, description);
  if (!input.ok) return input;

  try {
    const updated = await db
      .update(categories)
      .set({ name: input.name, description: input.description })
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    if (updated.length === 0) return { ok: false, error: "카테고리를 찾을 수 없습니다." };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "이미 있는 카테고리 이름입니다." };
    console.error("updateCategoryAction failed", error);
    return { ok: false, error: "카테고리를 수정하지 못했습니다." };
  }
}

// 삭제하면 FK(on delete set null)로 해당 기사의 categoryId가 null(미분류)이 된다.
export async function deleteCategoryAction(id: number): Promise<CategoryActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("deleteCategoryAction failed", error);
    return { ok: false, error: "카테고리를 삭제하지 못했습니다." };
  }
}

// scope "uncategorized": 미분류 기사만, "all": 전체. 최신순으로 MAX_RECLASSIFY건까지 처리한다.
export async function reclassifyArticlesAction(
  scope: "uncategorized" | "all",
): Promise<ReclassifyResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  try {
    const categoryOptions = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
      })
      .from(categories);
    if (categoryOptions.length === 0) {
      return { ok: false, error: "분류할 카테고리가 없습니다." };
    }

    const targets = await db
      .select({
        id: articles.id,
        categoryId: articles.categoryId,
        source: articles.source,
        titleOriginal: articles.titleOriginal,
        titleKo: articles.titleKo,
        summaryKo: articles.summaryKo,
      })
      .from(articles)
      .where(scope === "uncategorized" ? isNull(articles.categoryId) : undefined)
      .orderBy(desc(articles.publishedAt), desc(articles.id));

    const batch = targets.slice(0, MAX_RECLASSIFY);
    const results = await mapWithConcurrency(batch, CONCURRENCY, (article) =>
      classifyArticle(article, categoryOptions),
    );

    let updatedCount = 0;
    let failedCount = 0;
    for (const [i, result] of results.entries()) {
      if (result.status === "rejected") {
        failedCount++;
        console.error("classifyArticle failed", batch[i].id, result.reason);
        continue;
      }
      if (result.value === batch[i].categoryId) continue;
      await db.update(articles).set({ categoryId: result.value }).where(eq(articles.id, batch[i].id));
      updatedCount++;
    }

    revalidatePath("/dashboard");
    return { ok: true, updatedCount, failedCount, remainingCount: targets.length - batch.length };
  } catch (error) {
    console.error("reclassifyArticlesAction failed", error);
    return { ok: false, error: "재분류 중 오류가 발생했습니다." };
  }
}
