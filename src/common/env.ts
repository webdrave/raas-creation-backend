/* eslint-disable n/no-process-env */
import { z } from 'zod';
import { NodeEnvs } from './constants.js';

import dotenv from 'dotenv';

dotenv.config();
// Define the expected environment variables and their types.
const envSchema = z.object({
  NODE_ENV: z.enum(Object.values(NodeEnvs) as [string, ...string[]]), 
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().url(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.coerce.number(),
  CLOUDINARY_API_SECRET: z.string(),
  FRONTENDURL: z.string().url(),
  AUTH_SECRET: z.string(),
  WHATSAPP_API_TOKEN: z.string(),
  WHATSAPP_MOBILE: z.string(),
  WHATSAPP_MOBILE_ID: z.string(),
  WHATSAPP_BUISSNESS_ID: z.string(),
  RESEND_API_KEY: z.string(),
  RESEND_EMAIL: z.string(),
});


// Validate the environment variables.
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`- Field: ${issue.path.join(".")}, Error: ${issue.message}`);
  });
  process.exit(1); // Stop execution if env vars are invalid
} else {
  console.log("✅ Environment variables validated successfully", parsedEnv.data);
}


// Export the validated environment configuration.
export default parsedEnv.data;
