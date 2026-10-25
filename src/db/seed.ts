import { db } from "./index";
import { categories } from "./schema";

const defaultCategories = [
  { name: "모델/연구", description: "새로운 AI 모델 출시, 벤치마크, 연구 논문 및 기술 발전" },
  { name: "제품/서비스", description: "AI 기반 제품, 앱, 서비스, 기능 업데이트 및 출시" },
  { name: "기업/투자", description: "AI 기업 동향, 투자, 인수합병, 실적 및 인사" },
  { name: "정책/규제", description: "AI 관련 법률, 규제, 정부 정책, 소송 및 윤리 이슈" },
  { name: "기타", description: "위 분류에 해당하지 않는 AI 관련 소식" },
];

async function main() {
  const inserted = await db
    .insert(categories)
    .values(defaultCategories)
    .onConflictDoNothing({ target: categories.name })
    .returning({ name: categories.name });

  console.log(`Seeded ${inserted.length} categories (existing ones skipped)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
