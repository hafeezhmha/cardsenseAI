import z from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1),
  OPENROUTER_API_KEY: z.string().trim().min(1),
  PINECONE_API_KEY: z.string().trim().min(1),
  PINECONE_ENVIRONMENT: z.string().trim().min(1),
  PINECONE_INDEX_NAME: z.string().trim().min(1),
  PINECONE_NAMESPACE: z.string().trim().optional(),
  PDF_PATH: z.string().trim().min(1),
  DATA_SOURCE_URL: z.string().trim().optional(),
  INDEX_INIT_TIMEOUT: z.coerce.number().min(1),
});

export const env = envSchema.parse(process.env);
