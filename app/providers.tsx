"use client";

import { makeStore } from "@/store/store";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import ToastViewport from "@/components/toast-viewport";
import { showToast } from "@/store/toast-slice";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [store] = useState(() => makeStore());
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            store.dispatch(
              showToast({
                kind: "error",
                message: `API request failed: ${error.message}`,
              }),
            );
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            store.dispatch(
              showToast({
                kind: "error",
                message: `API request failed: ${error.message}`,
              }),
            );
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastViewport />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  );
}
