import * as yup from "yup";
import type { ProductDraft } from "@/store/draft-slice";

const optionalNumber = (fieldName: string) =>
  yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? undefined : value,
    )
    .typeError(`${fieldName} must be a number`);

export const productFormSchema: yup.ObjectSchema<ProductDraft> = yup
  .object({
    title: yup
      .string()
      .trim()
      .required("Product title is required")
      .min(3, "Product title must be at least 3 characters")
      .max(100, "Product title must be at most 100 characters"),
    brand: yup.string().trim().required("Brand is required"),
    category: yup.string().required("Category is required"),
    description: yup
      .string()
      .trim()
      .required("Description is required")
      .min(20, "Description must be at least 20 characters"),
    price: optionalNumber("Base price")
      .required("Base price is required")
      .moreThan(0, "Base price must be greater than 0"),
    stock: optionalNumber("Stock quantity")
      .required("Stock quantity is required")
      .integer("Stock quantity must be a whole number")
      .min(0, "Stock quantity cannot be negative"),
    discountPercentage: optionalNumber("Discount percentage")
      .defined()
      .min(0, "Discount cannot be negative")
      .max(99, "Discount must be less than 100"),
    variations: yup
      .array()
      .of(
        yup
          .object({
            color: yup.string().trim().required("Color is required"),
            size: yup.string().trim().required("Size is required"),
            skuCode: yup.string().trim().defined(),
            extraPrice: optionalNumber("Variation price")
              .required("Additional price is required")
              .min(0, "Additional price cannot be negative"),
          })
          .required(),
      )
      .defined(),
    weight: optionalNumber("Weight")
      .required("Weight is required")
      .moreThan(0, "Weight must be greater than 0"),
    width: optionalNumber("Width")
      .required("Width is required")
      .moreThan(0, "Width must be greater than 0"),
    height: optionalNumber("Height")
      .required("Height is required")
      .moreThan(0, "Height must be greater than 0"),
    depth: optionalNumber("Depth")
      .required("Depth is required")
      .moreThan(0, "Depth must be greater than 0"),
    requiresFragileHandling: yup.boolean().defined(),
    hazardousDisclaimer: yup
      .boolean()
      .when("requiresFragileHandling", {
        is: true,
        then: (schema) =>
          schema.oneOf(
            [true],
            "Confirm the hazardous-handling acknowledgment",
          ),
        otherwise: (schema) => schema.defined(),
      })
      .defined(),
    specialShippingNotes: yup
      .string()
      .when("requiresFragileHandling", {
        is: true,
        then: (schema) =>
          schema
            .trim()
            .required("Special shipping notes are required for fragile items"),
        otherwise: (schema) => schema.defined(),
      })
      .defined(),
    currentStep: yup.number().integer().min(0).max(3).defined(),
  })
  .required();

export const defaultProductDraft: ProductDraft = {
  title: "",
  brand: "",
  category: "",
  description: "",
  price: 0,
  stock: 0,
  discountPercentage: 0,
  variations: [],
  weight: 0,
  width: 0,
  height: 0,
  depth: 0,
  requiresFragileHandling: false,
  hazardousDisclaimer: false,
  specialShippingNotes: "",
  currentStep: 0,
};
