import type {
  Category,
  CreateProductInput,
  Product,
  ProductQueryParams,
  ProductResponse,
} from "@/types/products";

const API_URL = "https://dummyjson.com";

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProducts(
  params: ProductQueryParams = {},
): Promise<ProductResponse> {
  const {
    limit = 10,
    skip = 0,
    search,
    category,
    sortBy,
    order,
  } = params;

  const query = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
  });

  if (sortBy) {
    query.set("sortBy", sortBy);
  }

  if (order) {
    query.set("order", order);
  }

  if (search?.trim() && category) {
    query.set("limit", "0");
    query.set("skip", "0");
    query.set("q", search.trim());
    const response = await request<ProductResponse>(
      `${API_URL}/products/search?${query.toString()}`,
    );
    const products = response.products.filter(
      (product) => product.category === category,
    );

    return {
      products: products.slice(skip, skip + limit),
      total: products.length,
      skip,
      limit,
    };
  }

  let endpoint = "/products";

  if (search?.trim()) {
    endpoint = "/products/search";
    query.set("q", search.trim());
  }

  const baseUrl = category
    ? `${API_URL}/products/category/${encodeURIComponent(category)}`
    : `${API_URL}${endpoint}`;

  return request<ProductResponse>(`${baseUrl}?${query.toString()}`);
}

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>(`${API_URL}/products/categories`);
}

export async function getProduct(id: number): Promise<Product> {
  return request<Product>(`${API_URL}/products/${id}`);
}

export async function createProduct(
  product: CreateProductInput,
): Promise<Product> {
  return request<Product>(`${API_URL}/products/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });
}

export async function updateProduct(
  id: number,
  changes: Partial<Product>,
): Promise<Product> {
  return request<Product>(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });
}

export async function deleteProduct(id: number): Promise<Product> {
  return request<Product>(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });
}