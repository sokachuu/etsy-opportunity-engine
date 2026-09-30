import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {generateDesignConcepts} from "../../../lib/design-concepts.mjs";

type DesignConcept = {
  id: string;
  name: string;
  keyword?: string;
  visual: string;
  imagePrompt: string;
  negativePrompt: string;
  printSpecs: string;
};

type Analysis = {
  strongestKeywords?: string[];
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tagsFor(concept: DesignConcept, keyword: string): string[] {
  const base = [
    keyword, "halloween shirt", "spooky shirt", "fall shirt",
    "halloween gift", "spooky season", "vintage halloween",
    "graphic tee", "autumn shirt", "halloween tee", concept.name
  ];
  return [...new Set(base.map(x => x.trim().toLowerCase()).filter(Boolean))].slice(0, 13);
}

function titleFor(concept: DesignConcept, keyword: string): string {
  const clean = concept.name.replace(/\s+/g, " ").trim();
  return `${clean} Halloween T-Shirt, ${keyword} Graphic Tee, Vintage Spooky Fall Shirt, Halloween Gift`.slice(0, 140);
}

function cleanKeyword(value: string): string {
  return value.replace(/\bshirt\b/gi, "").trim() || "Halloween";
}

function descriptionFor(concept: DesignConcept, keyword: string): string {
  return [
    `Bring an original ${cleanKeyword(keyword)}-inspired graphic to spooky season with the ${concept.name} Halloween T-Shirt.`,
    "", concept.visual, "", "PRODUCT DETAILS",
    "• Unisex Gildan Heavy Cotton T-Shirt", "• DTG printed artwork",
    "• Multiple garment colors", "• Sizes S–3XL", "• Original independent artwork",
    "", "CARE", "• Machine wash cold", "• Wash inside out",
    "• Mild detergent", "• Tumble dry low or hang dry",
    "• Do not iron directly over the print", "",
    "Please check the size chart before ordering. Colors can vary slightly by screen."
  ].join("\n");
}

export async function GET() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "latest.json"), "utf8");
    const snapshot: { season?: {name: string; targetDate: string}; generatedAt?: string; opportunityAnalysis?: Analysis; topSignals?: unknown[] } = JSON.parse(raw);
    const analysis = snapshot.opportunityAnalysis || {};
    const generated = generateDesignConcepts(analysis, snapshot.topSignals || []);
    const concepts = (generated.concepts || []).slice(0, 6) as DesignConcept[];
    const keywords = analysis.strongestKeywords || ["halloween shirt"];

    const products = concepts.map((concept, index) => {
      const keyword = concept.keyword || keywords[index % keywords.length];
      return {
        batchId: `halloween-2026-${new Date().toISOString().slice(0, 10)}`,
        rank: index + 1,
        id: slugify(concept.id),
        name: concept.name,
        keyword,
        title: titleFor(concept, keyword),
        description: descriptionFor(concept, keyword),
        tags: tagsFor(concept, keyword),
        priceUsd: 27,
        garment: {
          blueprint: "Gildan 5000",
          sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
          colors: ["Black", "Natural", "Sand", "Forest Green"]
        },
        artwork: {
          status: "awaiting-generation",
          prompt: concept.imagePrompt,
          negativePrompt: concept.negativePrompt,
          printSpecs: concept.printSpecs
        },
        publication: {status: "draft", autoPublishAllowed: false}
      };
    });

    return NextResponse.json({
      ok: true,
      season: snapshot.season || {name: "Halloween 2026", targetDate: "2026-10-31"},
      sourceGeneratedAt: snapshot.generatedAt || null,
      count: products.length,
      products
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Production batch generation failed"
    }, {status: 500});
  }
}
