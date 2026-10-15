import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewProductPage from "./page";
import { makeStore } from "@/store/store";
import { server } from "@/test/server";
import type { ReactNode } from "react";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function renderForm() {
  const store = makeStore();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NewProductPage />
      </QueryClientProvider>
    </Provider>,
  );
}

describe("product form integration", () => {
  beforeEach(() => {
    routerPush.mockReset();
    server.use(
      http.get("https://dummyjson.com/products/categories", () =>
        HttpResponse.json([
          {
            slug: "electronics",
            name: "Electronics",
            url: "https://dummyjson.com/products/category/electronics",
          },
        ]),
      ),
    );
  });

  it("submits all form steps to DummyJSON", async () => {
    const user = userEvent.setup();
    let submittedBody: unknown;
    server.use(
      http.post("https://dummyjson.com/products/add", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({
          id: 101,
          title: "Studio Headphones",
          brand: "Acme",
          category: "electronics",
          description: "Comfortable wireless studio headphones.",
          price: 79.99,
          stock: 8,
        });
      }),
    );

    renderForm();

    await user.type(
      await screen.findByLabelText("Product title"),
      "Studio Headphones",
    );
    await user.type(screen.getByLabelText("Brand"), "Acme");
    await user.selectOptions(screen.getByLabelText("Category"), "electronics");
    await user.type(
      screen.getByLabelText("Description"),
      "Comfortable wireless studio headphones.",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.clear(await screen.findByLabelText("Base price"));
    await user.type(screen.getByLabelText("Base price"), "79.99");
    await user.clear(screen.getByLabelText("Stock quantity"));
    await user.type(screen.getByLabelText("Stock quantity"), "8");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.clear(await screen.findByLabelText("Weight (kg)"));
    await user.type(screen.getByLabelText("Weight (kg)"), "0.8");
    await user.clear(screen.getByLabelText("Width"));
    await user.type(screen.getByLabelText("Width"), "18");
    await user.clear(screen.getByLabelText("Height"));
    await user.type(screen.getByLabelText("Height"), "12");
    await user.clear(screen.getByLabelText("Depth"));
    await user.type(screen.getByLabelText("Depth"), "6");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByRole("heading", { name: "Review your product" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(
      await screen.findByRole("heading", { name: "Product created" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(submittedBody).toMatchObject({
        title: "Studio Headphones",
        brand: "Acme",
        category: "electronics",
        description: "Comfortable wireless studio headphones.",
        price: 79.99,
        stock: 8,
        dimensions: { width: 18, height: 12, depth: 6 },
        variations: [],
      });
    });
  });
});
