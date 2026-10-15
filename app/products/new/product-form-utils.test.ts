import { describe, expect, it } from "vitest";
import type { ProductDraft } from "@/store/draft-slice";
import { defaultProductDraft } from "./product-form-schema";
import {
  DRAFT_STORAGE_KEY,
  isProductDraft,
  restoreNumericDraftValues,
} from "./product-form-utils";

const validDraft: ProductDraft = {
  ...defaultProductDraft,
  title: "A saved product",
  variations: [
    { color: "Blue", size: "M", skuCode: "SKU-001", extraPrice: 2 },
  ],
};

describe("product form draft helpers", () => {
  it("uses a stable local storage key", () => {
    expect(DRAFT_STORAGE_KEY).toBe("product-form-draft");
  });

  it("recognizes a valid saved draft", () => {
    expect(isProductDraft(validDraft)).toBe(true);
    expect(isProductDraft(null)).toBe(false);
    expect(isProductDraft("draft")).toBe(false);
  });

  it("rejects invalid fields, variations, and step indexes", () => {
    expect(isProductDraft({ ...validDraft, title: 12 })).toBe(false);
    expect(
      isProductDraft({
        ...validDraft,
        variations: [{ color: "Blue", size: "M", skuCode: 1, extraPrice: 2 }],
      }),
    ).toBe(false);
    expect(isProductDraft({ ...validDraft, currentStep: 4 })).toBe(false);
    expect(isProductDraft({ ...validDraft, currentStep: 1.5 })).toBe(false);
  });

  it("converts cleared numeric values restored from JSON into invalid numbers", () => {
    const parsed: unknown = {
      ...validDraft,
      price: null,
      stock: null,
      discountPercentage: null,
      weight: null,
      width: null,
      height: null,
      depth: null,
      variations: [
        { color: "Blue", size: "M", skuCode: "SKU-001", extraPrice: null },
      ],
    };

    expect(isProductDraft(parsed)).toBe(true);
    if (!isProductDraft(parsed)) {
      throw new Error("Expected parsed draft to pass shape validation");
    }

    const restored = restoreNumericDraftValues(parsed);
    expect(Number.isNaN(restored.price)).toBe(true);
    expect(Number.isNaN(restored.stock)).toBe(true);
    expect(Number.isNaN(restored.discountPercentage)).toBe(true);
    expect(Number.isNaN(restored.weight)).toBe(true);
    expect(Number.isNaN(restored.width)).toBe(true);
    expect(Number.isNaN(restored.height)).toBe(true);
    expect(Number.isNaN(restored.depth)).toBe(true);
    expect(Number.isNaN(restored.variations[0].extraPrice)).toBe(true);
  });

  it("preserves entered numeric values during restoration", () => {
    expect(restoreNumericDraftValues(validDraft)).toEqual(validDraft);
  });
});
