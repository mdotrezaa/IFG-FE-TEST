import { describe, expect, it } from "vitest";
import type { ProductDraft } from "@/store/draft-slice";
import { defaultProductDraft, productFormSchema } from "./product-form-schema";

const validDraft: ProductDraft = {
  ...defaultProductDraft,
  title: "Wireless Headphones",
  brand: "Acme",
  category: "electronics",
  description: "Wireless headphones with active noise cancellation.",
  price: 49.99,
  stock: 12,
  weight: 0.5,
  width: 20,
  height: 10,
  depth: 8,
};

describe("productFormSchema", () => {
  it("accepts an optional SKU that uses supported characters and length", async () => {
    await expect(
      productFormSchema.isValid({
        ...validDraft,
        variations: [
          {
            color: "Black",
            size: "M",
            skuCode: "ACME-123_black",
            extraPrice: 5,
          },
        ],
      }),
    ).resolves.toBe(true);

    await expect(
      productFormSchema.isValid({
        ...validDraft,
        variations: [
          { color: "Black", size: "M", skuCode: "", extraPrice: 0 },
        ],
      }),
    ).resolves.toBe(true);
  });

  it.each(["AB", "SKU with spaces", "SKU/123", "a".repeat(31)])(
    "rejects invalid SKU %s",
    async (skuCode) => {
      await expect(
        productFormSchema.isValid({
          ...validDraft,
          variations: [
            { color: "Black", size: "M", skuCode, extraPrice: 0 },
          ],
        }),
      ).resolves.toBe(false);
    },
  );

  it.each([0, -0.01])("rejects base price %s", async (price) => {
    await expect(
      productFormSchema.isValid({ ...validDraft, price }),
    ).resolves.toBe(false);
  });

  it("rejects empty numeric input after applying the empty-value transform", async () => {
    await expect(
      productFormSchema.isValid({ ...validDraft, price: "" }),
    ).resolves.toBe(false);
  });

  it("accepts positive prices and the maximum discount", async () => {
    await expect(
      productFormSchema.isValid({
        ...validDraft,
        price: 0.01,
        discountPercentage: 99,
      }),
    ).resolves.toBe(true);
  });

  it("rejects discounts outside the supported range", async () => {
    await expect(
      productFormSchema.isValid({ ...validDraft, discountPercentage: 100 }),
    ).resolves.toBe(false);
    await expect(
      productFormSchema.isValid({ ...validDraft, discountPercentage: -1 }),
    ).resolves.toBe(false);
  });

  it("requires shipping notes and acknowledgment for fragile products", async () => {
    const fragileDraft = {
      ...validDraft,
      requiresFragileHandling: true,
    };

    await expect(productFormSchema.isValid(fragileDraft)).resolves.toBe(false);
    await expect(
      productFormSchema.isValid({
        ...fragileDraft,
        specialShippingNotes: "Use protective packaging.",
      }),
    ).resolves.toBe(false);
    await expect(
      productFormSchema.isValid({
        ...fragileDraft,
        specialShippingNotes: "Use protective packaging.",
        hazardousDisclaimer: true,
      }),
    ).resolves.toBe(true);
  });

  it("does not require fragile-specific details for ordinary products", async () => {
    await expect(productFormSchema.isValid(validDraft)).resolves.toBe(true);
  });
});
