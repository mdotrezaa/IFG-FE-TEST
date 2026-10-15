"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useFieldArray,
  useForm,
  type FieldPath,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import { useCreateProduct, useCategories } from "@/hooks/use-products";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearDraft, saveDraft, type ProductDraft } from "@/store/draft-slice";
import { defaultProductDraft, productFormSchema } from "./product-form-schema";

const DRAFT_STORAGE_KEY = "product-form-draft";

const steps = [
  "Basic information",
  "Pricing & variations",
  "Shipping details",
  "Review",
] as const;

const stepFields: FieldPath<ProductDraft>[][] = [
  ["title", "brand", "category", "description"],
  ["price", "stock", "discountPercentage", "variations"],
  [
    "weight",
    "width",
    "height",
    "depth",
    "requiresFragileHandling",
    "hazardousDisclaimer",
    "specialShippingNotes",
  ],
  [],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumericDraftValue(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isProductDraft(value: unknown): value is ProductDraft {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.brand === "string" &&
    typeof value.category === "string" &&
    typeof value.description === "string" &&
    isNumericDraftValue(value.price) &&
    isNumericDraftValue(value.stock) &&
    isNumericDraftValue(value.discountPercentage) &&
    Array.isArray(value.variations) &&
    value.variations.every(
      (variation) =>
        isRecord(variation) &&
        typeof variation.color === "string" &&
        typeof variation.size === "string" &&
        typeof variation.skuCode === "string" &&
        isNumericDraftValue(variation.extraPrice),
    ) &&
    isNumericDraftValue(value.weight) &&
    isNumericDraftValue(value.width) &&
    isNumericDraftValue(value.height) &&
    isNumericDraftValue(value.depth) &&
    typeof value.requiresFragileHandling === "boolean" &&
    typeof value.hazardousDisclaimer === "boolean" &&
    typeof value.specialShippingNotes === "string" &&
    typeof value.currentStep === "number" &&
    Number.isInteger(value.currentStep) &&
    value.currentStep >= 0 &&
    value.currentStep <= 3
  );
}

function restoreNumericDraftValues(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    price: draft.price ?? Number.NaN,
    stock: draft.stock ?? Number.NaN,
    discountPercentage: draft.discountPercentage ?? Number.NaN,
    weight: draft.weight ?? Number.NaN,
    width: draft.width ?? Number.NaN,
    height: draft.height ?? Number.NaN,
    depth: draft.depth ?? Number.NaN,
    variations: draft.variations.map((variation) => ({
      ...variation,
      extraPrice: variation.extraPrice ?? Number.NaN,
    })),
  };
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

const fieldClassName =
  "mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const textAreaClassName =
  "mt-1.5 min-h-32 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function NewProductPage() {
  const dispatch = useAppDispatch();
  const reduxDraft = useAppSelector((state) => state.draft.draft);
  const {
    data: categories,
    isPending: categoriesPending,
    isError: categoriesError,
    error: categoryError,
    refetch: refetchCategories,
  } = useCategories();
  const createProduct = useCreateProduct();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const checkedDraft = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  const form = useForm<ProductDraft>({
    resolver: yupResolver(productFormSchema),
    defaultValues: defaultProductDraft,
    mode: "onTouched",
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variations",
  });
  const { errors, isSubmitting } = form.formState;
  const requiresFragileHandling = form.watch("requiresFragileHandling");

  const persistDraft = useCallback(
    (nextStep = stepRef.current) => {
      const draft = {
        ...form.getValues(),
        currentStep: nextStep,
      };
      dispatch(saveDraft(draft));

      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setDraftError(null);
      } catch {
        setDraftError(
          "Your draft is saved for this session but could not be stored on this device.",
        );
      }
    },
    [dispatch, form],
  );

  useEffect(() => {
    if (checkedDraft.current) return;
    checkedDraft.current = true;

    let savedDraft: ProductDraft | null = reduxDraft;

    try {
      const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (storedDraft) {
        const parsed: unknown = JSON.parse(storedDraft);
        if (!isProductDraft(parsed)) {
          throw new Error("The saved product draft has an invalid format.");
        }
        savedDraft = restoreNumericDraftValues(parsed);
      }
    } catch (error) {
      setDraftError(
        error instanceof Error
          ? error.message
          : "The saved product draft could not be read.",
      );
    }

    if (savedDraft) {
      if (window.confirm("Resume saved product draft?")) {
        const restoredDraft = restoreNumericDraftValues(savedDraft);
        form.reset(restoredDraft);
        setStep(restoredDraft.currentStep);
        dispatch(saveDraft(restoredDraft));
      } else {
        dispatch(clearDraft());
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          setDraftError(
            "The saved draft could not be removed from this device.",
          );
        }
      }
    }

    setDraftReady(true);
  }, [dispatch, form, reduxDraft]);

  useEffect(() => {
    if (!draftReady) return;

    const subscription = form.watch(() => persistDraft());
    return () => subscription.unsubscribe();
  }, [draftReady, form, persistDraft]);

  async function goToNextStep() {
    const valid = await form.trigger(stepFields[step]);
    if (!valid) return;

    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    persistDraft(nextStep);
  }

  function goToStep(targetStep: number) {
    setStep(targetStep);
    persistDraft(targetStep);
  }

  function finishProduct(draft: ProductDraft) {
    const product = {
      title: draft.title.trim(),
      brand: draft.brand.trim(),
      category: draft.category,
      description: draft.description.trim(),
      price: draft.price,
      stock: draft.stock,
      discountPercentage: draft.discountPercentage,
      weight: draft.weight,
      dimensions: {
        width: draft.width,
        height: draft.height,
        depth: draft.depth,
      },
      variations: draft.variations,
      requiresFragileHandling: draft.requiresFragileHandling,
      hazardousDisclaimer: draft.hazardousDisclaimer,
      specialShippingNotes: draft.specialShippingNotes.trim(),
    };

    createProduct.mutate(product, {
      onSuccess: () => {
        setComplete(true);
      },
    });
  }

  function handleReturnToInventory() {
    dispatch(clearDraft());

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      setDraftError("The saved draft could not be removed from this device.");
    }

    form.reset(defaultProductDraft);
    setStep(0);
    setComplete(false);

    router.push("/products");
  }

  if (complete) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Product created
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your product onboarding is complete.
        </p>
        {draftError && (
          <p role="alert" className="mt-4 text-sm text-amber-700">
            {draftError}
          </p>
        )}
        <button
          type="button"
          onClick={handleReturnToInventory}
          className="mt-6 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Return to inventory
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/products"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Back to inventory
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          Add a new product
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete each step to add a product to your inventory.
        </p>
      </div>

      <ol
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Product onboarding steps"
      >
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={`rounded-lg border px-3 py-2.5 text-sm ${
              step === index
                ? "border-blue-700 bg-blue-50 font-semibold text-blue-800"
                : step > index
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-500"
            }`}
          >
            <span className="mr-2 font-semibold">{index + 1}.</span>
            {label}
          </li>
        ))}
      </ol>

      {draftError && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
        >
          {draftError}
        </p>
      )}

      {categoriesError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          <span>Categories could not be loaded: {categoryError.message}</span>
          <button
            type="button"
            onClick={() => void refetchCategories()}
            className="ml-2 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {createProduct.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          Product could not be created: {createProduct.error.message}
        </p>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step === 3) {
            void form.handleSubmit(finishProduct, async () => {
              for (let invalidStep = 0; invalidStep < 3; invalidStep += 1) {
                if (!(await form.trigger(stepFields[invalidStep]))) {
                  setStep(invalidStep);
                  return;
                }
              }
            })();
          }
        }}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
      >
        {step === 0 && (
          <div className="space-y-5">
            <StepHeading
              title="Basic product information"
              description="Start with the product identity and description."
            />
            <div>
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Product title
              </label>
              <input
                id="title"
                {...form.register("title")}
                maxLength={100}
                placeholder="e.g. Wireless headphones"
                className={fieldClassName}
              />
              <ErrorMessage message={errors.title?.message} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="brand"
                  className="text-sm font-medium text-gray-700"
                >
                  Brand
                </label>
                <input
                  id="brand"
                  {...form.register("brand")}
                  placeholder="Brand name"
                  className={fieldClassName}
                />
                <ErrorMessage message={errors.brand?.message} />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="category"
                  {...form.register("category")}
                  disabled={categoriesPending || categoriesError}
                  className={fieldClassName}
                >
                  <option value="">
                    {categoriesPending
                      ? "Loading categories…"
                      : "Select a category"}
                  </option>
                  {categories?.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ErrorMessage message={errors.category?.message} />
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe the product (at least 20 characters)"
                className={textAreaClassName}
              />
              <ErrorMessage message={errors.description?.message} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <StepHeading
              title="Pricing, stock & variations"
              description="Set the price and quantity, then add any available variations."
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <NumberField
                id="price"
                label="Base price"
                prefix="$"
                error={errors.price?.message}
                registration={form.register("price", { valueAsNumber: true })}
                min="0.01"
                step="0.01"
              />
              <NumberField
                id="stock"
                label="Stock quantity"
                error={errors.stock?.message}
                registration={form.register("stock", { valueAsNumber: true })}
                min="0"
                step="1"
              />
              <NumberField
                id="discountPercentage"
                label="Discount"
                suffix="%"
                error={errors.discountPercentage?.message}
                registration={form.register("discountPercentage", {
                  setValueAs: (value: string) =>
                    value === "" ? 0 : Number(value),
                })}
                min="0"
                max="99"
                step="0.1"
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Product variations
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add sizes or colors with optional SKU codes and additional
                    prices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      color: "",
                      size: "",
                      skuCode: "",
                      extraPrice: 0,
                    })
                  }
                  className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Add variation
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                  >
                    <div>
                      <label
                        htmlFor={`variations.${index}.color`}
                        className="text-xs font-medium text-gray-600"
                      >
                        Color
                      </label>
                      <input
                        id={`variations.${index}.color`}
                        {...form.register(`variations.${index}.color`)}
                        className={fieldClassName}
                      />
                      <ErrorMessage
                        message={errors.variations?.[index]?.color?.message}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`variations.${index}.size`}
                        className="text-xs font-medium text-gray-600"
                      >
                        Size
                      </label>
                      <input
                        id={`variations.${index}.size`}
                        {...form.register(`variations.${index}.size`)}
                        className={fieldClassName}
                      />
                      <ErrorMessage
                        message={errors.variations?.[index]?.size?.message}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`variations.${index}.skuCode`}
                        className="text-xs font-medium text-gray-600"
                      >
                        SKU code
                      </label>
                      <input
                        id={`variations.${index}.skuCode`}
                        {...form.register(`variations.${index}.skuCode`)}
                        className={fieldClassName}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`variations.${index}.extraPrice`}
                        className="text-xs font-medium text-gray-600"
                      >
                        Additional price
                      </label>
                      <input
                        id={`variations.${index}.extraPrice`}
                        type="number"
                        min="0"
                        step="0.01"
                        {...form.register(`variations.${index}.extraPrice`, {
                          valueAsNumber: true,
                        })}
                        className={fieldClassName}
                      />
                      <ErrorMessage
                        message={
                          errors.variations?.[index]?.extraPrice?.message
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove variation ${index + 1}`}
                      className="self-end rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <StepHeading
              title="Shipping & supplier details"
              description="Provide package measurements and any special handling instructions."
            />
            <NumberField
              id="weight"
              label="Weight (kg)"
              error={errors.weight?.message}
              registration={form.register("weight", { valueAsNumber: true })}
              min="0.01"
              step="0.01"
            />
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                Dimensions (cm)
              </legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-3">
                <NumberField
                  id="width"
                  label="Width"
                  error={errors.width?.message}
                  registration={form.register("width", { valueAsNumber: true })}
                  min="0.01"
                  step="0.01"
                />
                <NumberField
                  id="height"
                  label="Height"
                  error={errors.height?.message}
                  registration={form.register("height", {
                    valueAsNumber: true,
                  })}
                  min="0.01"
                  step="0.01"
                />
                <NumberField
                  id="depth"
                  label="Depth"
                  error={errors.depth?.message}
                  registration={form.register("depth", { valueAsNumber: true })}
                  min="0.01"
                  step="0.01"
                />
              </div>
            </fieldset>
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                {...form.register("requiresFragileHandling")}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Requires special fragile handling
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Enable this for products that require extra care during
                  packing or transit.
                </span>
              </span>
            </label>
            {requiresFragileHandling && (
              <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div>
                  <label
                    htmlFor="specialShippingNotes"
                    className="text-sm font-medium text-gray-700"
                  >
                    Special shipping notes
                  </label>
                  <textarea
                    id="specialShippingNotes"
                    {...form.register("specialShippingNotes")}
                    placeholder="Explain the required handling and shipping instructions"
                    className={textAreaClassName}
                  />
                  <ErrorMessage
                    message={errors.specialShippingNotes?.message}
                  />
                </div>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    {...form.register("hazardousDisclaimer")}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span>
                    I acknowledge that special and hazardous-handling
                    requirements are accurately documented for this product.
                    <ErrorMessage
                      message={errors.hazardousDisclaimer?.message}
                    />
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <StepHeading
              title="Review your product"
              description="Check the details below. Use Edit to return to a step without losing your work."
            />
            <ReviewSection title="Basic information" onEdit={() => goToStep(0)}>
              <ReviewRow label="Title" value={form.getValues("title")} />
              <ReviewRow label="Brand" value={form.getValues("brand")} />
              <ReviewRow
                label="Category"
                value={
                  categories?.find(
                    (category) => category.slug === form.getValues("category"),
                  )?.name ?? form.getValues("category")
                }
              />
              <ReviewRow
                label="Description"
                value={form.getValues("description")}
              />
            </ReviewSection>
            <ReviewSection
              title="Pricing & variations"
              onEdit={() => goToStep(1)}
            >
              <ReviewRow
                label="Base price"
                value={`$${form.getValues("price").toFixed(2)}`}
              />
              <ReviewRow
                label="Stock quantity"
                value={String(form.getValues("stock"))}
              />
              <ReviewRow
                label="Discount"
                value={`${form.getValues("discountPercentage")}%`}
              />
              {form.getValues("variations").length === 0 ? (
                <ReviewRow label="Variations" value="None" />
              ) : (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Variations
                  </p>
                  {form.getValues("variations").map((variation, index) => (
                    <p
                      key={`${variation.skuCode}-${index}`}
                      className="text-sm text-gray-800"
                    >
                      {variation.color} / {variation.size} — +$
                      {variation.extraPrice.toFixed(2)}
                      {variation.skuCode ? ` · SKU ${variation.skuCode}` : ""}
                    </p>
                  ))}
                </div>
              )}
            </ReviewSection>
            <ReviewSection
              title="Shipping & handling"
              onEdit={() => goToStep(2)}
            >
              <ReviewRow
                label="Weight"
                value={`${form.getValues("weight")} kg`}
              />
              <ReviewRow
                label="Dimensions"
                value={`${form.getValues("width")} × ${form.getValues("height")} × ${form.getValues("depth")} cm`}
              />
              <ReviewRow
                label="Fragile handling"
                value={
                  form.getValues("requiresFragileHandling") ? "Required" : "No"
                }
              />
              {form.getValues("requiresFragileHandling") && (
                <>
                  <ReviewRow
                    label="Special shipping notes"
                    value={form.getValues("specialShippingNotes")}
                  />
                  <ReviewRow
                    label="Hazardous-handling acknowledgment"
                    value={
                      form.getValues("hazardousDisclaimer")
                        ? "Confirmed"
                        : "Not confirmed"
                    }
                  />
                </>
              )}
            </ReviewSection>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row">
          <button
            type="button"
            disabled={step === 0 || createProduct.isPending || isSubmitting}
            onClick={() => goToStep(step - 1)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => void goToNextStep()}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={createProduct.isPending || isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createProduct.isPending ? "Creating product…" : "Create product"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function StepHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function NumberField({
  id,
  label,
  error,
  registration,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  min?: string;
  max?: string;
  step?: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          {...registration}
          className={`${fieldClassName} ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      <ErrorMessage message={error} />
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          Edit
        </button>
      </div>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-sm text-gray-900">
        {value || "—"}
      </dd>
    </div>
  );
}
