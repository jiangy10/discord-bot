import { chromium } from "playwright";

export type JobPost = {
  title: string;
  company: string;
  location: string;
  url: string;
};

export type JobFilters = {
  keywords?: string;    // Job title keywords
  geoId?: string;       // LinkedIn geo ID
  maxResults?: number;  // Maximum results
};

function buildLinkedInSearchUrl(hours: number, filters: JobFilters) {
  const seconds = Math.max(1, Math.floor(hours * 3600));
  const keywords = encodeURIComponent(filters.keywords ?? "Software Engineer");
  const params = new URLSearchParams();

  params.set("keywords", keywords);
  params.set("f_TPR", `r${seconds}`);  // Time filter: most recent N seconds
  params.set("sortBy", "DD");          // Sort by date
  if (filters.geoId) params.set("geoId", filters.geoId);

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

export async function fetchJobPost(hours: number, filters: JobFilters = {}): Promise<JobPost[]> {
  const url = buildLinkedInSearchUrl(hours, filters);
  const maxResults = filters.maxResults ?? 10;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const cards = await page.locator("ul.jobs-search__results-list > li").all();
    const results: JobPost[] = [];

    for (const card of cards) {
      if (results.length >= maxResults) break;

      const title = (await card.locator("h3").first().textContent())?.trim() ?? "";
      const company = (await card.locator("h4").first().textContent())?.trim() ?? "";
      const location = (await card.locator(".job-search-card__location").first().textContent())?.trim() ?? "";

      const linkEl = card.locator("a.base-card__full-link").first();
      const href = (await linkEl.getAttribute("href")) ?? "";
      const jobUrl = href ? href.split("?")[0] : "";

      if (!title || !company || !jobUrl) continue;

      results.push({
        title,
        company,
        location,
        url: jobUrl,
      });
    }

    return results;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

