import { z } from "zod";

// --- Input Schemas ---

// General input (used by /summary, /analyze, /translate, /explain-code, /review-text)
export const InputSchema = z.object({
  userinput: z.string().min(10, "Input must be at least 10 characters"),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

// For /test-prompt — lets you pass a custom system prompt and control runs
export const TestPromptInputSchema = z.object({
  userinput: z.string().min(10),
  systemprompt: z.string().min(10, "System prompt must be at least 10 characters"),
  temperature: z.number().min(0).max(2).default(0.7),
  runs: z.number().int().min(1).max(5).default(3),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

// --- Output Schemas (validate what the LLM returns) ---

export const SummaryOutputSchema = z.object({
  summary: z.string().min(10),
});

export const AnalysisOutputSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  topics: z.array(z.string()),
  summary: z.string(),
});

// For /review-text — persona endpoint returns structured feedback
export const ReviewOutputSchema = z.object({
  score: z.number().min(1).max(10),
  issues: z.array(z.string()),
  rewrite: z.string(),
});
