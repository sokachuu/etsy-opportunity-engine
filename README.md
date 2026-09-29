# Etsy Opportunity Engine

A research-first decision dashboard for the US Etsy print-on-demand market.

## What it does

- Scans seasonal Etsy demand using the official Etsy Open API.
- Uses public listing signals only: relevance, recency, visible favorites, competition proxy, and priceability.
- Builds keyword summaries and recurring market motifs.
- Generates original design concepts and production prompts from observed patterns.
- Provides an editable Etsy + Printify-style margin gate.
- Stores the latest successful research snapshot in `data/latest.json` and dated history under `data/history/`.
- Runs the scheduled research job daily through GitHub Actions.

## Current campaign

Halloween 2026 → Thanksgiving 2026 → Christmas 2026 → Valentine's Day 2027.

## Research safety

The engine never claims private competitor sales, conversion rates, revenue, or profit. Etsy pages are not scraped; the research workflow uses the official API.

## Required secret

GitHub Actions:
- `ETSY_API_KEY` = Etsy v3 `keystring:shared_secret`

Optional:
- `PINTEREST_ACCESS_TOKEN`

## Local development

```bash
npm install
npm run dev
```

Open the local Next.js URL shown by the terminal.

## Automated research

Workflow: `.github/workflows/seasonal-research.yml`

Schedule: daily at 06:00 UTC.

The workflow serializes Etsy requests and retries transient 429/408/5xx responses with backoff, then commits the successful snapshot.

## Dashboard

The dashboard reads the saved snapshot first, so the core research view remains usable even when a live server-side API key is not present.

Repository: https://github.com/sokachuu/etsy-opportunity-engine
