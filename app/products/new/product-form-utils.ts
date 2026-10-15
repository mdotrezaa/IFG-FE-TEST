import type { ProductDraft } from "@/store/draft-slice";

export const DRAFT_STORAGE_KEY = "product-form-draft";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumericDraftValue(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

export function isProductDraft(value: unknown): value is ProductDraft {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.brand === "string" &&
    typeof value.category === "string" &&
    typeof value.description === "string" &&
    isNumericDraftValue(value.price) &&
    isNumericDraftValue(value.stock) &&
    isNumericDraftValue(value.discountPercentage) &&
    Array.isArray(value.variations) &&
    value.variations.every(
      (variation) =>
        isRecord(variation) &&
        typeof variation.color === "string" &&
        typeof variation.size === "string" &&
        typeof variation.skuCode === "string" &&
        isNumericDraftValue(variation.extraPrice),
    ) &&
    isNumericDraftValue(value.weight) &&
    isNumericDraftValue(value.width) &&
    isNumericDraftValue(value.height) &&
    isNumericDraftValue(value.depth) &&
    typeof value.requiresFragileHandling === "boolean" &&
    typeof value.hazardousDisclaimer === "boolean" &&
    typeof value.specialShippingNotes === "string" &&
    typeof value.currentStep === "number" &&
    Number.isInteger(value.currentStep) &&
    value.currentStep >= 0 &&
    value.currentStep <= 3
  );
}

export function restoreNumericDraftValues(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    price: draft.price ?? Number.NaN,
    stock: draft.stock ?? Number.NaN,
    discountPercentage: draft.discountPercentage ?? Number.NaN,
    weight: draft.weight ?? Number.NaN,
    width: draft.width ?? Number.NaN,
    height: draft.height ?? Number.NaN,
    depth: draft.depth ?? Number.NaN,
    variations: draft.variations.map((variation) => ({
      ...variation,
      extraPrice: variation.extraPrice ?? Number.NaN,
    })),
  };
}
