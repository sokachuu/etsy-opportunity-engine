import {NextRequest, NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {
  createProduct,
  getBlueprints,
  getProviders,
  getVariants,
  listShops,
  uploadImageByBase64
} from "../../../../lib/printify.mjs";
import {generateDesignConcepts} from "../../../../lib/design-concepts.mjs";

type Concept = {
  id: string;
  name: string;
  keyword?: string;
  visual: string;
};

type Snapshot = {
  opportunityAnalysis?: {strongestKeywords?: string[]};
  topSignals?: unknown[];
};

const TARGET_COLORS = ["Black", "Natural", "Sand", "Forest Green"];
const TARGET_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];

function cleanKeyword(value: string): string {
  return value.replace(/\bshirt\b/gi, "").trim() || "Halloween";
}

function titleFor(concept: Concept, keyword: string): string {
  return `${concept.name} Halloween T-Shirt, ${keyword} Graphic Tee, Vintage Spooky Fall Shirt, Halloween Gift`.slice(0, 140);
}

function descriptionFor(concept: Concept, keyword: string): string {
  return [
    `Bring an original ${cleanKeyword(keyword)}-inspired graphic to spooky season with the ${concept.name} Halloween T-Shirt.`,
    "", concept.visual, "", "PRODUCT DETAILS",
    "• Unisex Gildan Heavy Cotton T-Shirt",
    "• DTG printed artwork", "• Multiple garment colors", "• Sizes S–3XL",
    "• Original independent artwork", "", "CARE",
    "• Machine wash cold", "• Wash inside out", "• Mild detergent",
    "• Tumble dry low or hang dry", "• Do not iron directly over the print", "",
    "Please check the size chart before ordering. Colors can vary slightly by screen."
  ].join("\n");
}

function tagsFor(concept: Concept, keyword: string): string[] {
  return [...new Set([
    keyword, "halloween shirt", "spooky shirt", "fall shirt", "halloween gift",
    "spooky season", "vintage halloween", "graphic tee", "autumn shirt",
    "halloween tee", concept.name
  ].map(x => x.trim().toLowerCase()).filter(Boolean))].slice(0, 13);
}

function optionValue(variant: Record<string, unknown>, key: string): string {
  const options = variant.options;
  if (options && typeof options === "object") {
    const value = (options as Record<string, unknown>)[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

function matchesTarget(variant: Record<string, unknown>): boolean {
  const color = optionValue(variant, "color");
  const size = optionValue(variant, "size");
  const title = String(variant.title || "");
  const parts = title.split("/").map(x => x.trim());
  const fallbackColor = parts[0] || "";
  const fallbackSize = parts[parts.length - 1] || "";
  const colorMatch = color || fallbackColor;
  const sizeMatch = size || fallbackSize;

  return TARGET_COLORS.some(c => c.toLowerCase() === colorMatch.toLowerCase()) &&
    TARGET_SIZES.some(s => s.toLowerCase() === sizeMatch.toLowerCase()) &&
    variant.id != null;
}

export async function POST(req: NextRequest) {
  if (!process.env.PRINTIFY_API_TOKEN) {
    return NextResponse.json({ok: false, error: "PRINTIFY_API_TOKEN is not configured."}, {status: 503});
  }

  const body = await req.json().catch(() => null);
  const index = Number(body?.productIndex);
  const artworkBase64 = typeof body?.artworkBase64 === "string" ? body.artworkBase64 : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName : "etsy-design.png";

  if (!Number.isInteger(index) || index < 0 || index > 5) {
    return NextResponse.json({ok: false, error: "productIndex must be between 0 and 5."}, {status: 400});
  }
  if (!artworkBase64) {
    return NextResponse.json({ok: false, error: "Upload a PNG or JPG artwork first."}, {status: 400});
  }

  const rawBase64 = artworkBase64.replace(/^data:image\/(png|jpe?g);base64,/i, "");
  if (rawBase64.length > 11000000) {
    return NextResponse.json({ok: false, error: "Artwork is too large. Use a print-ready PNG/JPG under about 8 MB."}, {status: 413});
  }

  try {
    const raw = await readFile(path.join(process.cwd(), "data", "latest.json"), "utf8");
    const snapshot: Snapshot = JSON.parse(raw);
    const analysis = snapshot.opportunityAnalysis || {};
    const generated = generateDesignConcepts(analysis, snapshot.topSignals || []);
    const concepts = (generated.concepts || []).slice(0, 6) as Concept[];
    const concept = concepts[index];
    if (!concept) throw new Error("Production concept not found.");

    const keywords = analysis.strongestKeywords || ["halloween shirt"];
    const keyword = concept.keyword || keywords[index % keywords.length];

    const shops = await listShops();
    const shopId = Number(
      process.env.PRINTIFY_SHOP_ID ||
      shops.find(x => /etsy/i.test(String(x.sales_channel || "")))?.id ||
      0
    );
    if (!shopId) throw new Error("No Printify Etsy shop found. Connect the Etsy shop in Printify or set PRINTIFY_SHOP_ID.");

    const blueprints = await getBlueprints();
    const blueprint = blueprints.find(x =>
      /gildan/i.test(String(x.brand || "")) && /5000/.test(String(x.model || ""))
    );
    if (!blueprint) throw new Error("Gildan 5000 was not found in the Printify catalog.");

    const providers = await getProviders(blueprint.id);
    const provider = providers.find(x => /printify choice/i.test(String(x.title || ""))) || providers[0];
    if (!provider) throw new Error("No print provider was found for Gildan 5000.");

    const catalogVariants = await getVariants(blueprint.id, provider.id);
    const selected = catalogVariants
      .filter(v => matchesTarget(v as unknown as Record<string, unknown>))
      .map(v => ({id: v.id, price: 27}));

    if (!selected.length) {
      throw new Error("No matching Black/Natural/Sand/Forest Green S–3XL variants were found.");
    }

    const uploaded = await uploadImageByBase64(fileName, rawBase64);
    const variantIds = selected.map(v => v.id);

    const product = await createProduct(shopId, {
      title: titleFor(concept, keyword),
      description: descriptionFor(concept, keyword),
      tags: tagsFor(concept, keyword),
      blueprint_id: blueprint.id,
      print_provider_id: provider.id,
      variants: selected.map(v => ({
        id: v.id,
        price: Math.round(v.price * 100),
        is_enabled: true
      })),
      print_areas: [{
        variant_ids: variantIds,
        placeholders: [{
          position: "front",
          images: [{
            id: uploaded.id,
            x: 0.5,
            y: 0.5,
            scale: 0.72,
            angle: 0
          }]
        }]
      }]
    });

    return NextResponse.json({
      ok: true,
      draftOnly: true,
      published: false,
      productId: product.id,
      shopId,
      blueprintId: blueprint.id,
      printProviderId: provider.id,
      selectedVariants: selected.length,
      artworkId: uploaded.id,
      message: "Printify draft created. Publishing remains locked."
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Printify draft creation failed"
    }, {status: 502});
  }
}
