import { chromium } from "playwright";

export type JobPost = {
  title: string;
  company: string;
  location: string;
  url: string;
  postedText: string;
  postedMinutes: number;
};

export type JobFilters = {
  keywords?: string;                 // Job title keywords
  geoId?: string;                    // LinkedIn geo ID
  locationAllowlist?: string[];      // Location allowlist
  maxResults?: number;              // Maximum results
};

function buildLinkedInSearchUrl(hours: number, filters: JobFilters) {
  const seconds = Math.max(1, Math.floor(hours * 3600));
  const keywords = encodeURIComponent(filters.keywords ?? "Software Engineer");
  const params = new URLSearchParams();

  params.set("keywords", keywords);
  params.set("geoId", filters.geoId ?? "103644278");
  params.set("f_TPR", `r${seconds}`);         // most recent N seconds
  params.set("sortBy", "DD");                 

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

function parsePostedMinutes(postedTextRaw: string): number {
  const t = postedTextRaw.trim().toLowerCase();

  if (!t) return Number.POSITIVE_INFINITY;
  if (t.includes("just now")) return 0;

  const mMin = t.match(/(\d+)\s*min/);
  if (mMin) return parseInt(mMin[1], 10);

  const mHour = t.match(/(\d+)\s*hour/);
  if (mHour) return parseInt(mHour[1], 10) * 60;

  const mDay = t.match(/(\d+)\s*day/);
  if (mDay) return parseInt(mDay[1], 10) * 24 * 60;

  return Number.POSITIVE_INFINITY;
}

function locationPass(location: string, allowlist?: string[]) {
  if (!allowlist || allowlist.length === 0) return true;
  const L = location.toLowerCase();
  return allowlist.some(x => L.includes(x.toLowerCase()));
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

    // result list (LinkedIn DOM may change; you need to adjust selector according to the actual page)
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

      const postedText =
        (await card.locator("time").first().textContent())?.trim() ??
        (await card.locator("span").filter({ hasText: /ago|minute|hour|day|just now/i }).first().textContent())?.trim() ??
        "";

      const postedMinutes = parsePostedMinutes(postedText);

      if (!title || !company || !jobUrl) continue;

      // filter by location
      if (!locationPass(location, filters.locationAllowlist)) continue;

      results.push({
        title,
        company,
        location,
        url: jobUrl,
        postedText,
        postedMinutes,
      });
    }

    return results;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

