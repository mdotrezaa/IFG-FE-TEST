"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCategory, setPage, setSearch, setView } from "@/store/ui-slice";
import { useCategories, useProducts } from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import Pagination from "@/components/pagination";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.ui.filters);
  const view = useAppSelector((state) => state.ui.view);
  const debouncedSearch = useDebounce(filters.search);

  const { data, isPending, isFetching, isError, error } = useProducts({
    limit: filters.limit,
    skip: (filters.page - 1) * filters.limit,
    search: debouncedSearch,
    category: filters.category || undefined,
  });
  const { data: categoriesQuery } = useCategories();

  const totalPages = data ? Math.ceil(data.total / filters.limit) : 0;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row pb-4">
        <input
          value={filters.search}
          onChange={(event) => dispatch(setSearch(event.target.value))}
          placeholder="Search products..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
        />

        <div className="flex gap-2">
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={filters.category || "all"}
              onChange={(event) =>
                dispatch(
                  setCategory(
                    event.target.value === "all" ? "" : event.target.value,
                  ),
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
            >
              <option value="all">All Categories</option>
              {categoriesQuery?.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => dispatch(setView("table"))}
            className={`rounded-lg border px-4 py-2 ${
              view === "table" ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            Table
          </button>

          <button
            type="button"
            onClick={() => dispatch(setView("grid"))}
            className={`rounded-lg border px-4 py-2 ${
              view === "grid" ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            Grid
          </button>
        </div>
      </div>
      {isFetching ? (
        <div
          className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-white"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading products...
          </div>
        </div>
      ) : isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-600"
        >
          {error.message}
        </p>
      ) : data && data.products.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          No products found.
        </p>
      ) : data && view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.map((product) => (
            <article
              key={product.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <img
                src={product.thumbnail}
                alt={product.title}
                className="h-40 w-full object-contain"
              />
              <h2 className="mt-3 font-semibold text-gray-900">
                {product.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{product.category}</p>
              <p className="mt-3 font-semibold">${product.price.toFixed(2)}</p>
            </article>
          ))}
        </div>
      ) : data && view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-12 w-12 rounded-md object-contain"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{product.category}</td>
                  <td className="px-4 py-3">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {data && totalPages > 1 && (
        <Pagination
          isFetching={isFetching}
          page={filters.page}
          total={data.total}
          limit={data.limit}
          onPageChange={(page) => dispatch(setPage(page))}
        />
      )}
    </div>
  );
}
