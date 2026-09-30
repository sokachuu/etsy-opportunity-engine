import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {generateDesignConcepts} from "../../../lib/design-concepts.mjs";

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tagsFor(concept, keyword) {
  const base = [
    keyword,
    "halloween shirt",
    "spooky shirt",
    "fall shirt",
    "halloween gift",
    "spooky season",
    "vintage halloween",
    "graphic tee",
    "autumn shirt",
    "halloween tee",
    concept.name
  ];
  return [...new Set(base.map(x => String(x).toLowerCase().trim()).filter(Boolean))].slice(0, 13);
}

function titleFor(concept, keyword) {
  const clean = concept.name.replace(/\s+/g, " ").trim();
  return `${clean} Halloween T-Shirt, ${keyword} Graphic Tee, Vintage Spooky Fall Shirt, Halloween Gift`.slice(0, 140);
}

function descriptionFor(concept, keyword) {
  return [
    `Bring an original ${cleanKeyword(keyword)}-inspired graphic to spooky season with the ${concept.name} Halloween T-Shirt.`,
    "",
    concept.visual,
    "",
    "PRODUCT DETAILS",
    "• Unisex Gildan Heavy Cotton T-Shirt",
    "• DTG printed artwork",
    "• Multiple garment colors",
    "• Sizes S–3XL",
    "• Original independent artwork",
    "",
    "CARE",
    "• Machine wash cold",
    "• Wash inside out",
    "• Mild detergent",
    "• Tumble dry low or hang dry",
    "• Do not iron directly over the print",
    "",
    "Please check the size chart before ordering. Colors can vary slightly by screen."
  ].join("\n");
}

function cleanKeyword(value) {
  return String(value || "Halloween").replace(/\bshirt\b/gi, "").trim() || "Halloween";
}

export async function GET() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "latest.json"), "utf8");
    const snapshot = JSON.parse(raw);
    const analysis = snapshot.opportunityAnalysis || {};
    const generated = generateDesignConcepts(analysis, snapshot.topSignals || []);
    const concepts = (generated.concepts || []).slice(0, 6);

    const products = concepts.map((concept, index) => {
      const keyword = concept.keyword || analysis.strongestKeywords?.[index % Math.max(analysis.strongestKeywords?.length || 1, 1)] || "halloween shirt";
      return {
        batchId: `halloween-2026-${new Date().toISOString().slice(0,10)}`,
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
          sizes: ["S","M","L","XL","2XL","3XL"],
          colors: ["Black","Natural","Sand","Forest Green"]
        },
        artwork: {
          status: "awaiting-generation",
          prompt: concept.imagePrompt,
          negativePrompt: concept.negativePrompt,
          printSpecs: concept.printSpecs
        },
        publication: {
          status: "draft",
          autoPublishAllowed: false
        }
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
