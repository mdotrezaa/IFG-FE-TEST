import { describe, expect, it } from "vitest";
import { clearDraft, saveDraft } from "./draft-slice";
import type { ProductDraft } from "./draft-slice";
import { defaultProductDraft } from "@/app/products/new/product-form-schema";
import draftReducer from "./draft-slice";

describe("draft reducer", () => {
  it("saves a product draft", () => {
    const draft: ProductDraft = {
      ...defaultProductDraft,
      title: "Wireless speaker",
      currentStep: 2,
    };

    expect(draftReducer(undefined, saveDraft(draft))).toEqual({
      draft,
      hasDraft: true,
    });
  });

  it("clears a previously saved draft", () => {
    const draft: ProductDraft = { ...defaultProductDraft };
    const state = draftReducer(undefined, saveDraft(draft));

    expect(draftReducer(state, clearDraft())).toEqual({
      draft: null,
      hasDraft: false,
    });
  });
});
