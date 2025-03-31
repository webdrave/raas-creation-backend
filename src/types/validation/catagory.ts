
import { z } from "zod";

export const addCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Description is required").optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Description is required").optional(),
});