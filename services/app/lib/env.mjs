import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    UPSTASH_REDIS_URL: z.string().url(),
    UPSTASH_REDIS_TOKEN: z.string(),
    HELIUS_API_KEY: z.string(),
    DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_HELIUS_API_KEY: z.string(),
  },
  runtimeEnv: {
    UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
    UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
  },
});

export const validateEnv = () => env; 