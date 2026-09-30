export type PrintifyShop = {
  id: number;
  title?: string;
  sales_channel?: string;
};

export type PrintifyBlueprint = {
  id: number;
  brand?: string;
  model?: string;
  title?: string;
  [key: string]: unknown;
};

export type PrintifyProvider = {
  id: number;
  title?: string;
  [key: string]: unknown;
};

export type PrintifyCatalogVariant = {
  id: number;
  title?: string;
  price?: number;
  options?: Record<string, unknown>;
  [key: string]: unknown;
};

export type PrintifyVariantInput = {
  id: number | string;
  price: number | string;
  isEnabled?: boolean;
};

export type PrintifyProductInput = {
  title: string;
  description: string;
  blueprintId: number | string;
  printProviderId: number | string;
  variants?: PrintifyVariantInput[];
  x?: number;
  y?: number;
  scale?: number;
  angle?: number;
};

export type PrintifyProductPayload = {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{id: number; price: number; is_enabled: boolean}>;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
  }>;
  tags?: string[];
};

export function listShops(): Promise<PrintifyShop[]>;
export function getBlueprints(): Promise<PrintifyBlueprint[]>;
export function getProviders(blueprintId: number | string): Promise<PrintifyProvider[]>;
export function getVariants(blueprintId: number | string, providerId: number | string): Promise<PrintifyCatalogVariant[]>;
export function uploadImageByUrl(fileName: string, url: string): Promise<{id: string; [key: string]: unknown}>;
export function uploadImageByBase64(fileName: string, contents: string): Promise<{id: string; [key: string]: unknown}>;
export function createProduct(shopId: number | string, product: PrintifyProductPayload): Promise<{id: string; [key: string]: unknown}>;
export function publishProduct(shopId: number | string, productId: number | string): Promise<unknown>;
export function buildProductPayload(input: PrintifyProductInput, uploadedImageId: string): PrintifyProductPayload;
