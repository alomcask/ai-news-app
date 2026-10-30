export type RssSource = {
  name: string;
  feedUrl: string;
};

export const RSS_SOURCES: RssSource[] = [
  {
    name: "TechCrunch AI",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge AI",
    feedUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
];
