import { AssetType } from '@prisma/client';
import { z } from 'zod';
import { Size } from '@prisma/client';

export const addProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be a positive number"),
    discount: z.number().positive("Discount price must be a positive number").optional(),
    categoryId: z.string().cuid("Invalid category ID"),
    status: z.enum(["DRAFT", "PUBLISHED"], {
      errorMap: () => ({ message: "Invalid product status" }),
    }),
    material: z.string().min(1, "Material is required"),
    assets: z
      .array(
        z.object({
          url: z.string().url("Invalid asset URL"),
          type: z.nativeEnum(AssetType, {
            errorMap: () => ({ message: "Invalid asset type" }),
          }),
        })
      )
  });

  export const addSizesSchema = z.object({
    productId: z.string().cuid("Invalid product ID"),
    sizes: z.array(
      z.object({
        size: z.nativeEnum(Size, {
          errorMap: () => ({ message: "Invalid size value" }),  // Custom error message
        }),
        stock: z.number().int().min(0, "Stock must be a non-negative integer"),  // Validate that stock is non-negative
      })
    ),
  });
  
  export const updateStockSchema = z.object({
    variantId: z.string().cuid("Invalid variant ID"),
    stock: z.number().int().min(0, "Stock must be a non-negative integer"),
  });

  export const addVariantSchema = z.object({
    productId: z.string().cuid("Invalid product ID"),
    sizes: z.array(
      z.object({
        size: z.nativeEnum(Size, {
          errorMap: () => ({ message: "Invalid size value" }),
        }),
        stock: z.number().int().min(0, "Stock must be a non-negative integer"),
      })
    ),
  });
  
  export const updateVariantSchema = z.object({
    variantId: z.string().cuid("Invalid variant ID"),
    size: z.nativeEnum(Size, {
      errorMap: () => ({ message: "Invalid size value" }),  // Custom error message
    }),
    stock: z.number().int().min(0, "Stock must be a non-negative integer"),  // Validate that stock is non-negative
  })
  
