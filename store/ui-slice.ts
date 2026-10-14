import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ProductSort = "default" | "price_asc" | "price_desc";
export type ProductView = "table" | "grid";

export type ProductFilters = {
  search: string;
  category: string;
  sort: ProductSort;
  page: number;
  limit: number;
};

type UiState = {
  filters: ProductFilters;
  view: ProductView;
  filterDrawerOpen: boolean;
};

const initialState: UiState = {
  filters: {
    search: "",
    category: "",
    sort: "default",
    page: 1,
    limit: 10,
  },
  view: "table",
  filterDrawerOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
      state.filters.page = 1;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.filters.category = action.payload;
      state.filters.page = 1;
    },
    setSort(state, action: PayloadAction<ProductSort>) {
      state.filters.sort = action.payload;
      state.filters.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = Math.max(1, action.payload);
    },
    setLimit(state, action: PayloadAction<number>) {
      state.filters.limit = Math.max(1, action.payload);
      state.filters.page = 1;
    },
    setFilters(state, action: PayloadAction<ProductFilters>) {
      state.filters = action.payload;
    },
    setView(state, action: PayloadAction<ProductView>) {
      state.view = action.payload;
    },
    setFilterDrawerOpen(state, action: PayloadAction<boolean>) {
      state.filterDrawerOpen = action.payload;
    },
    resetFilters(state) {
      state.filters = { ...initialState.filters };
    },
  },
});

export const {
  setSearch,
  setCategory,
  setSort,
  setPage,
  setLimit,
  setFilters,
  setView,
  setFilterDrawerOpen,
  resetFilters,
} = uiSlice.actions;

export default uiSlice.reducer;