import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { productFixture } from "@/test/product-fixtures";
import { useUpdateProduct, productKeys } from "./use-products";
import { makeStore } from "@/store/store";
import type { ProductResponse } from "@/types/products";

describe("product mutations", () => {
  it("rolls optimistic product edits back when the API request fails", async () => {
    server.use(
      http.put("https://dummyjson.com/products/1", () =>
        HttpResponse.json({ message: "Update failed" }, { status: 500 }),
      ),
    );

    const store = makeStore();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const queryKey = productKeys.list({});
    const previousData: ProductResponse = {
      products: [productFixture],
      total: 1,
      skip: 0,
      limit: 10,
    };
    queryClient.setQueryData(queryKey, previousData);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </Provider>
      );
    }

    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: 1,
          changes: { title: "Optimistic title" },
        }),
      ).rejects.toThrow("Request failed with status 500");
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKey)).toEqual(previousData);
    });
  });
});
