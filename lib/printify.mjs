const BASE = "https://api.printify.com/v1";

function token() {
  const value = process.env.PRINTIFY_API_TOKEN;
  if (!value) throw new Error("PRINTIFY_API_TOKEN is not configured");
  return value;
}

async function request(path, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Authorization": "Bearer " + token(),
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "EtsyOpportunityEngine/1.0",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const detail = data?.message || data?.error || data?.errors || text || ("HTTP " + res.status);
    throw new Error("Printify " + res.status + ": " + JSON.stringify(detail));
  }
  return data;
}

export async function listShops() {
  return request("/shops.json");
}

export async function getBlueprints() {
  return request("/catalog/blueprints.json");
}

export async function getProviders(blueprintId) {
  return request("/catalog/blueprints/" + blueprintId + "/print_providers.json");
}

export async function getVariants(blueprintId, providerId) {
  return request("/catalog/blueprints/" + blueprintId + "/print_providers/" + providerId + "/variants.json");
}

export async function uploadImageByUrl(fileName, url) {
  return request("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({ file_name: fileName, url })
  });
}

export async function createProduct(shopId, product) {
  return request("/shops/" + shopId + "/products.json", {
    method: "POST",
    body: JSON.stringify(product)
  });
}

export async function publishProduct(shopId, productId) {
  return request("/shops/" + shopId + "/products/" + productId + "/publish.json", {
    method: "POST",
    body: JSON.stringify({
      title: true,
      description: true,
      images: true,
      variants: true,
      tags: true,
      keyFeatures: true,
      shipping_template: true
    })
  });
}

export function buildProductPayload(input, uploadedImageId) {
  const variants = (input.variants || []).map((v) => ({
    id: Number(v.id),
    price: Math.round(Number(v.price) * 100),
    is_enabled: v.isEnabled !== false
  }));

  const variantIds = variants.map((v) => v.id);
  return {
    title: input.title,
    description: input.description,
    blueprint_id: Number(input.blueprintId),
    print_provider_id: Number(input.printProviderId),
    variants,
    print_areas: [{
      variant_ids: variantIds,
      placeholders: [{
        position: "front",
        images: [{
          id: uploadedImageId,
          x: Number(input.x ?? 0.5),
          y: Number(input.y ?? 0.5),
          scale: Number(input.scale ?? 0.72),
          angle: Number(input.angle ?? 0)
        }]
      }]
    }]
  };
}
