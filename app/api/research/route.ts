import { NextRequest, NextResponse } from "next/server";
import { aggregateKeywordTokens, enrichListing, summarizeKeyword, seasonMeta } from "../../../lib/scoring.mjs";
import { analyzeOpportunity } from "../../../lib/opportunity-analysis.mjs";

type Listing = {
  listing_id?: number;
  title?: string;
  description?: string;
  url?: string;
  price?: { amount?: number; divisor?: number };
  num_favorers?: number;
  creation_timestamp?: number;
  tags?: string[];
  materials?: string[];
};

async function etsySearch(keyword: string, limit: number) {
  const key = process.env.ETSY_API_KEY;
  if (!key) return { keyword, ok: false, count: 0, results: [] };

  const u = new URL("https://openapi.etsy.com/v3/application/listings/active");
  u.searchParams.set("keywords", keyword);
  u.searchParams.set("limit", String(limit));
  u.searchParams.set("sort_on", "score");
  u.searchParams.set("sort_order", "desc");
  u.searchParams.set("buyer_country", "US");
  u.searchParams.set("is_safe", "true");

  const res = await fetch(u, {
    headers: { "x-api-key": key },
    cache: "no-store"
  });
  if (!res.ok) return { keyword, ok: false, count: 0, results: [] };

  const data = await res.json() as { count?: number; results?: Listing[] };
  const listings = data.results ?? [];
  return {
    keyword,
    ok: true,
    count: data.count ?? 0,
    results: listings.map(x => enrichListing(x, keyword, data.count ?? 0))
  };
}

async function pinterestTrending() {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) return { enabled: false, items: [] };

  const u = "https://api.pinterest.com/v5/trends/keywords/US/top/growing?limit=50";
  const res = await fetch(u, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return { enabled: false, items: [], error: `Pinterest API ${res.status}` };

  const data = await res.json() as { items?: unknown[] };
  return { enabled: true, items: data.items ?? [] };
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("keywords") || "halloween shirt";
  const limit = Math.max(5, Math.min(30, Number(req.nextUrl.searchParams.get("limit") || 18)));
  const keywords = [...new Set(
    raw.split(",").map(x => x.trim().toLowerCase()).filter(Boolean)
  )].slice(0, 10);

  const settled = await Promise.allSettled(keywords.map(k => etsySearch(k, limit)));
  const etsyResults = settled.map((x, i) =>
    x.status === "fulfilled"
      ? x.value
      : { keyword: keywords[i], ok: false, count: 0, results: [] }
  );

  const pinterest = await pinterestTrending();
  const flat = etsyResults.flatMap(x => x.results).sort((a, b) => b.signalScore - a.signalScore);
  const summaries = etsyResults
    .map(x => summarizeKeyword(x.keyword, x.count, x.results))
    .sort((a, b) => b.averageSignal - a.averageSignal);
  const liveCount = etsyResults.filter(x => x.ok).length;

  return NextResponse.json({
    mode: liveCount > 0 ? "live" : "setup",
    generatedAt: new Date().toISOString(),
    season: seasonMeta(),
    keywords,
    keywordSummaries: summaries,
    topSignals: flat.slice(0, 40),
    keywordTokenSignals: aggregateKeywordTokens(flat),
    opportunityAnalysis: analyzeOpportunity(flat, summaries),
    sources: { etsy: liveCount > 0, pinterest: pinterest.enabled },
    pinterest: pinterest.items,
    notes: [
      "Opportunity scores are research-priority proxies, not private sales numbers.",
      "Competitor sales, conversion, revenue, and profit are never inferred as facts.",
      "Etsy marketplace research uses the official API rather than page scraping."
    ]
  });
}
