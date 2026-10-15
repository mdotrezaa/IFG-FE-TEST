"use client";

import { useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCategory,
  setLimit,
  setPage,
  setSearch,
  setSort,
  setView,
} from "@/store/ui-slice";
import {
  useCategories,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import Pagination from "@/components/pagination";
import type { Product } from "@/types/products";
import ProductListSkeleton from "@/components/product-skeleton";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.ui.filters);
  const view = useAppSelector((state) => state.ui.view);
  const debouncedSearch = useDebounce(filters.search);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editValues, setEditValues] = useState({
    title: "",
    price: "",
    stock: "",
  });

  const {
    data,
    isPending,
    isFetching,
    isError,
    error,
    refetch: refetchProducts,
  } = useProducts({
    limit: filters.limit,
    skip: (filters.page - 1) * filters.limit,
    search: debouncedSearch,
    category: filters.category || undefined,
    sortBy: filters.sort === "default" ? undefined : "price",
    order:
      filters.sort === "price_asc"
        ? "asc"
        : filters.sort === "price_desc"
          ? "desc"
          : undefined,
  });
  const {
    data: categoriesQuery,
    isError: categoriesError,
    error: categoryError,
    refetch: refetchCategories,
  } = useCategories();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const totalPages = data ? Math.ceil(data.total / filters.limit) : 0;
  const mutationError = updateProduct.error ?? deleteProduct.error;

  function openEditor(product: Product) {
    setEditingProduct(product);
    setEditValues({
      title: product.title,
      price: String(product.price),
      stock: String(product.stock),
    });
    updateProduct.reset();
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingProduct) return;

    const title = editValues.title.trim();
    const price = Number(editValues.price);
    const stock = Number(editValues.stock);

    if (
      !title ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return;
    }

    updateProduct.mutate(
      {
        id: editingProduct.id,
        changes: { title, price, stock },
      },
      {
        onSuccess: () => setEditingProduct(null),
      },
    );
  }

  function removeProduct(product: Product) {
    if (window.confirm(`Delete "${product.title}" from the inventory?`)) {
      deleteProduct.mutate(product.id, {
        onSuccess: () => {
          if (data?.products.length === 1 && filters.page > 1) {
            dispatch(setPage(filters.page - 1));
          }
        },
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-blue-700">Inventory</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Product directory
        </h1>
        <p className="text-sm text-gray-500">
          Search, filter, and manage your product inventory.
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <label className="relative">
            <span className="sr-only">Search products</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => dispatch(setSearch(event.target.value))}
              placeholder="Search products..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

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
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All categories</option>
              {categoriesQuery?.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Sort products</span>
            <select
              value={filters.sort}
              onChange={(event) => {
                const sort = event.target.value;
                if (
                  sort === "default" ||
                  sort === "price_asc" ||
                  sort === "price_desc"
                ) {
                  dispatch(setSort(sort));
                }
              }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="default">Sort: featured</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>

          <div
            className="flex items-center gap-1 rounded-lg border border-gray-200 p-1"
            role="group"
            aria-label="Product layout"
          >
            {(["table", "grid"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                aria-pressed={view === layout}
                onClick={() => dispatch(setView(layout))}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                  view === layout
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>

        {categoriesError && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            <span>Categories could not be loaded: {categoryError.message}</span>
            <button
              type="button"
              onClick={() => void refetchCategories()}
              className="font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {mutationError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {mutationError.message}
        </p>
      )}

      {isPending || isFetching ? (
        <ProductListSkeleton view={view} rows={filters.limit} />
      ) : isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          <p className="font-semibold">Products could not be loaded.</p>
          <p className="mt-1">{error.message}</p>
          <button
            type="button"
            onClick={() => void refetchProducts()}
            className="mt-3 rounded-lg bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      ) : data && data.products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="font-semibold text-gray-900">No products found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try changing your search or category filters.
          </p>
        </div>
      ) : data && view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-44 items-center justify-center bg-gray-50 p-4">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {product.category}
                </p>
                <h2 className="mt-1 line-clamp-1 font-semibold text-gray-900">
                  {product.title}
                </h2>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">
                    ${product.price.toFixed(2)}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.stock > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>
                <ProductActions
                  onEdit={() => openEditor(product)}
                  onDelete={() => removeProduct(product)}
                  deleting={deleteProduct.isPending}
                />
              </div>
            </article>
          ))}
        </div>
      ) : data && view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.products.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-12 w-12 rounded-lg bg-gray-50 object-contain"
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
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.stock > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ProductActions
                      onEdit={() => openEditor(product)}
                      onDelete={() => removeProduct(product)}
                      deleting={deleteProduct.isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {data && (
        <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {data.total} {data.total === 1 ? "product" : "products"} found
          </p>
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={filters.limit}
              onChange={(event) =>
                dispatch(setLimit(Number(event.target.value)))
              }
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-700"
            >
              {[10, 20, 50].map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {data && totalPages > 1 && (
        <Pagination
          isFetching={isFetching}
          page={filters.page}
          total={data.total}
          limit={data.limit}
          onPageChange={(page) => dispatch(setPage(page))}
        />
      )}

      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updateProduct.isPending
            ) {
              setEditingProduct(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5">
              <h2
                id="edit-product-title"
                className="text-lg font-semibold text-gray-900"
              >
                Edit product
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Changes update the directory immediately and sync with the API.
              </p>
            </div>
            <form onSubmit={saveProduct} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium text-gray-700">
                Product name
                <input
                  required
                  value={editValues.title}
                  onChange={(event) =>
                    setEditValues({ ...editValues, title: event.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1.5 text-sm font-medium text-gray-700">
                  Price
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={editValues.price}
                    onChange={(event) =>
                      setEditValues({
                        ...editValues,
                        price: event.target.value,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-gray-700">
                  Stock
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={editValues.stock}
                    onChange={(event) =>
                      setEditValues({
                        ...editValues,
                        stock: event.target.value,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={updateProduct.isPending}
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProduct.isPending}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateProduct.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

type ProductActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

function ProductActions({ onEdit, onDelete, deleting }: ProductActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-3">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
