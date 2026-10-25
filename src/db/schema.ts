import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull().unique(),
    source: text("source").notNull(),
    titleOriginal: text("title_original").notNull(),
    titleKo: text("title_ko").notNull(),
    summaryKo: text("summary_ko").notNull(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notionPageUrl: text("notion_page_url"),
  },
  (table) => [
    index("articles_category_id_idx").on(table.categoryId),
    index("articles_published_at_idx").on(table.publishedAt),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
