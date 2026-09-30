export type PrintifyShop = {
  id: number;
  title?: string;
  sales_channel?: string;
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
export function getBlueprints(): Promise<unknown>;
export function getProviders(blueprintId: number | string): Promise<unknown>;
export function getVariants(blueprintId: number | string, providerId: number | string): Promise<unknown>;
export function uploadImageByUrl(fileName: string, url: string): Promise<{id: string; [key: string]: unknown}>;
export function createProduct(shopId: number | string, product: PrintifyProductPayload): Promise<{id: string; [key: string]: unknown}>;
export function publishProduct(shopId: number | string, productId: number | string): Promise<unknown>;
export function buildProductPayload(input: PrintifyProductInput, uploadedImageId: string): PrintifyProductPayload;
