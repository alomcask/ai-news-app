import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

// Notion rich text 한 조각의 최대 길이.
const MAX_TEXT = 2000;

export type NotionArticle = {
  titleKo: string;
  summaryKo: string;
  url: string;
  categoryName: string | null;
  publishedAt: Date | null;
};

function truncate(text: string): string {
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

// Notion MCP 서버(@notionhq/notion-mcp-server)를 stdio로 띄워 DB에 페이지를 만들고 페이지 URL을 반환한다.
export async function saveToNotion(article: NotionArticle): Promise<string> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("NOTION_TOKEN / NOTION_DATABASE_ID가 설정되지 않았습니다.");
  }

  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(process.cwd(), "node_modules/@notionhq/notion-mcp-server/bin/cli.mjs"),
    ],
    env: { ...getDefaultEnvironment(), NOTION_TOKEN: token },
  });

  try {
    await client.connect(transport);

    const properties: Record<string, unknown> = {
      제목: { title: [{ text: { content: truncate(article.titleKo) } }] },
      요약: { rich_text: [{ text: { content: truncate(article.summaryKo) } }] },
      원문링크: { url: article.url },
    };
    if (article.categoryName) {
      properties["카테고리"] = { select: { name: article.categoryName } };
    }
    if (article.publishedAt) {
      properties["발행일"] = { date: { start: article.publishedAt.toISOString() } };
    }

    const result = await client.callTool({
      name: "API-post-page",
      arguments: { parent: { database_id: databaseId }, properties },
    });

    const text = (result.content as { type: string; text?: string }[] | undefined)
      ?.map((c) => c.text ?? "")
      .join("");
    if (result.isError) throw new Error(`Notion MCP 오류: ${text}`);

    const url = (JSON.parse(text ?? "{}") as { url?: string }).url;
    if (!url) throw new Error("Notion 응답에 페이지 URL이 없습니다.");
    return url;
  } finally {
    await client.close().catch(() => {});
  }
}
