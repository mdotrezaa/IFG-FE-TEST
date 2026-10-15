import { describe, expect, it } from "vitest";
import {
  resetFilters,
  setCategory,
  setFilterDrawerOpen,
  setFilters,
  setLimit,
  setPage,
  setSearch,
  setSort,
  setView,
} from "./ui-slice";
import uiReducer from "./ui-slice";

describe("ui reducer", () => {
  it("updates search and resets the page", () => {
    const state = uiReducer(undefined, setPage(3));
    const updated = uiReducer(state, setSearch("headphones"));

    expect(updated.filters.search).toBe("headphones");
    expect(updated.filters.page).toBe(1);
  });

  it("updates category and sort while resetting the page", () => {
    const state = uiReducer(undefined, setPage(4));
    const withCategory = uiReducer(state, setCategory("beauty"));
    const withSort = uiReducer(withCategory, setSort("price_desc"));

    expect(withSort.filters.category).toBe("beauty");
    expect(withSort.filters.sort).toBe("price_desc");
    expect(withSort.filters.page).toBe(1);
  });

  it("clamps the page and page size to a minimum of one", () => {
    const state = uiReducer(undefined, setPage(0));
    const updated = uiReducer(state, setLimit(0));

    expect(updated.filters.page).toBe(1);
    expect(updated.filters.limit).toBe(1);
  });

  it("updates the selected layout", () => {
    expect(uiReducer(undefined, setView("grid")).view).toBe("grid");
  });

  it("sets all filters and toggles the filter drawer", () => {
    const initial = uiReducer(
      undefined,
      setFilters({
        search: "camera",
        category: "electronics",
        sort: "price_asc",
        page: 2,
        limit: 20,
      }),
    );
    const updated = uiReducer(initial, setFilterDrawerOpen(true));

    expect(updated.filters).toEqual({
      search: "camera",
      category: "electronics",
      sort: "price_asc",
      page: 2,
      limit: 20,
    });
    expect(updated.filterDrawerOpen).toBe(true);
  });

  it("resets filters to their initial values", () => {
    const changed = uiReducer(
      undefined,
      setSearch("phone"),
    );

    expect(uiReducer(changed, resetFilters()).filters).toEqual({
      search: "",
      category: "",
      sort: "default",
      page: 1,
      limit: 10,
    });
  });
});
