import {NextRequest,NextResponse} from "next/server";
import {
  listShops,
  uploadImageByUrl,
  createProduct,
  publishProduct,
  buildProductPayload
} from "../../../lib/printify.mjs";

function autoPublishEnabled() {
  return process.env.AUTO_PUBLISH_PRODUCTS === "true";
}

function cleanTags(tags) {
  return [...new Set((tags || []).map(String).map(x => x.trim()).filter(Boolean))].slice(0, 13);
}

function configured() {
  return Boolean(process.env.PRINTIFY_API_TOKEN);
}

export async function GET() {
  if (!configured()) {
    return NextResponse.json({
      connected: false,
      autoPublish: false,
      message: "PRINTIFY_API_TOKEN is not configured."
    });
  }

  try {
    const shops = await listShops();
    const shopId = process.env.PRINTIFY_SHOP_ID
      ? Number(process.env.PRINTIFY_SHOP_ID)
      : shops.find((x) => /etsy/i.test(String(x.sales_channel || "")))?.id;

    return NextResponse.json({
      connected: true,
      autoPublish: autoPublishEnabled(),
      shopId: shopId || null,
      shops: shops.map((x) => ({
        id: x.id,
        title: x.title,
        salesChannel: x.sales_channel
      }))
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      autoPublish: false,
      message: error instanceof Error ? error.message : "Printify connection failed"
    }, {status: 502});
  }
}

export async function POST(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json({error: "PRINTIFY_API_TOKEN is not configured"}, {status: 503});
  }

  const body = await req.json().catch(() => null);
  const products = Array.isArray(body?.products) ? body.products : body ? [body] : [];
  if (!products.length) {
    return NextResponse.json({error: "No products supplied"}, {status: 400});
  }

  const shops = await listShops();
  const shopId = Number(body?.shopId || process.env.PRINTIFY_SHOP_ID ||
    shops.find((x) => /etsy/i.test(String(x.sales_channel || "")))?.id || 0);

  if (!shopId) {
    return NextResponse.json({error: "No Printify shop found. Connect the Etsy shop in Printify or set PRINTIFY_SHOP_ID."}, {status: 400});
  }

  const results = [];
  for (const input of products.slice(0, 10)) {
    if (!input.title || !input.description || !input.artworkUrl || !input.blueprintId || !input.printProviderId || !Array.isArray(input.variants)) {
      results.push({ok:false, title:input.title || "Untitled", error:"Missing title, description, artworkUrl, blueprintId, printProviderId or variants"});
      continue;
    }

    try {
      const uploaded = await uploadImageByUrl(input.fileName || "etsy-design.png", input.artworkUrl);
      const payload = buildProductPayload(input, uploaded.id);
      payload.tags = cleanTags(input.tags);
      const created = await createProduct(shopId, payload);

      let published = false;
      if (autoPublishEnabled() || input.publish === true) {
        if (!autoPublishEnabled()) {
          throw new Error("Publishing is locked. Set AUTO_PUBLISH_PRODUCTS=true before enabling automatic publication.");
        }
        await publishProduct(shopId, created.id);
        published = true;
      }

      results.push({
        ok:true,
        title:input.title,
        productId:created.id,
        published,
        shopId
      });
    } catch (error) {
      results.push({
        ok:false,
        title:input.title || "Untitled",
        error:error instanceof Error ? error.message : "Unknown Printify error"
      });
    }
  }

  return NextResponse.json({
    ok: results.every(x => x.ok),
    autoPublish: autoPublishEnabled(),
    shopId,
    results
  });
}
