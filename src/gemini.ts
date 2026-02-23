import "dotenv/config";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LLMInput, LLMOutput } from "./groq.js";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const GEMINI_MODEL = google("gemini-2.0-flash");

export const callGemini = async (input: LLMInput): Promise<LLMOutput> => {
  const result = await generateText({
    model: GEMINI_MODEL,
    system: input.systemprompt,
    prompt: input.userprompt,
    temperature: input.temperature,
  });
  return {
    content: result.text,
    model: "gemini-2.0-flash",
    usage: {
      prompt_tokens: result.usage.inputTokens!,
      completion_tokens: result.usage.outputTokens!,
      total_tokens: result.usage.totalTokens!,
    },
  };
};
