import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProduct,
  getProducts,
  updateProduct,
} from "@/api/products";
import type {
  CreateProductInput,
  Product,
  ProductQueryParams,
  ProductResponse,
} from "@/types/products";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductQueryParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  categories: ["categories"] as const,
};

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: CreateProductInput) => createProduct(product),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: number;
      changes: Partial<Product>;
    }) => updateProduct(id, changes),

    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({
        queryKey: productKeys.all,
      });

      const previousQueries = queryClient.getQueriesData<ProductResponse>({
        queryKey: productKeys.lists(),
      });

      const previousProduct = queryClient.getQueryData<Product>(
        productKeys.detail(id),
      );

      queryClient.setQueriesData<ProductResponse>(
        { queryKey: productKeys.lists() },
        (current: ProductResponse | undefined): ProductResponse | undefined => {
          if (!current) return current;

          return {
            ...current,
            products: current.products.map((product: Product) =>
              product.id === id ? { ...product, ...changes } : product,
            ),
          };
        },
      );

      if (previousProduct) {
        queryClient.setQueryData<Product>(productKeys.detail(id), {
          ...previousProduct,
          ...changes,
        });
      }

      return { previousQueries, previousProduct, id };
    },

    onError: (_error, _variables, context) => {
      context?.previousQueries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      if (context?.previousProduct) {
        queryClient.setQueryData(
          productKeys.detail(context.id),
          context.previousProduct,
        );
      }
    },

    onSuccess: (updatedProduct, { id }) => {
      queryClient.setQueriesData<ProductResponse>(
        { queryKey: productKeys.lists() },
        (current) => {
          if (!current) return current;

          return {
            ...current,
            products: current.products.map((product) =>
              product.id === id ? { ...product, ...updatedProduct } : product,
            ),
          };
        },
      );
      queryClient.setQueryData<Product>(productKeys.detail(id), updatedProduct);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: productKeys.all,
      });

      const previousQueries = queryClient.getQueriesData<ProductResponse>({
        queryKey: productKeys.lists(),
      });

      previousQueries.forEach(([key, data]) => {
        if (!data) return;

        queryClient.setQueryData<ProductResponse>(key, {
          ...data,
          products: data.products.filter((product) => product.id !== id),
          total:
            data.total -
            (data.products.some((product) => product.id === id) ? 1 : 0),
        });
      });

      return { previousQueries };
    },

    onError: (_error, _id, context) => {
      context?.previousQueries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSuccess: (_deletedProduct, id) => {
      queryClient.removeQueries({
        queryKey: productKeys.detail(id),
        exact: true,
      });
    },
  });
}