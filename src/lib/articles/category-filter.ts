export const UNCATEGORIZED_PARAM = "none";

export type CategoryFilter =
  | { type: "all" }
  | { type: "none" }
  | { type: "id"; id: number };

// ?category=<id> 또는 ?category=none(미분류). 잘못된 값은 전체로 취급한다.
export function parseCategoryFilter(
  value: string | string[] | undefined,
): CategoryFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === UNCATEGORIZED_PARAM) return { type: "none" };
  const id = Number(raw);
  return raw && Number.isInteger(id) && id >= 1 ? { type: "id", id } : { type: "all" };
}
