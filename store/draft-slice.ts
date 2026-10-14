import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ProductVariationDraft = {
  color: string;
  size: string;
  skuCode: string;
  extraPrice: number;
};

export type ProductDraft = {
  title: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  discountPercentage: number;
  variations: ProductVariationDraft[];
  weight: number;
  width: number;
  height: number;
  depth: number;
  requiresFragileHandling: boolean;
  hazardousDisclaimer: boolean;
  specialShippingNotes: string;
  currentStep: number;
};

type DraftState = {
  draft: ProductDraft | null;
  hasDraft: boolean;
};

const initialState: DraftState = {
  draft: null,
  hasDraft: false,
};

const draftSlice = createSlice({
  name: "draft",
  initialState,
  reducers: {
    saveDraft(state, action: PayloadAction<ProductDraft>) {
      state.draft = action.payload;
      state.hasDraft = true;
    },
    clearDraft(state) {
      state.draft = null;
      state.hasDraft = false;
    },
  },
});

export const { saveDraft, clearDraft } = draftSlice.actions;

export default draftSlice.reducer;