import { z } from 'zod';

export const updateTestimonialSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    content: z.string().min(1, "Content is required").optional(),
    rating: z.number().min(1).max(5).optional(),
    image: z.string().min(1, "Image is required").optional(),
    role: z.string().min(1, "Role is required").optional(),
  });
  
export const createTestimonialSchema = z.object({
    username: z.string().min(1, "Username is required"),
    role: z.string().min(1, "Role is required"),
    description: z.string().min(1, "Description is required"),
    image: z.string().min(1, "Image is required"),
    ratings: z.number().min(1).max(5),
  });