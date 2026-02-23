import "dotenv/config";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

export const GROQ_MODEL = groq("llama-3.3-70b-versatile");

export interface LLMInput {
  systemprompt: string;
  userprompt: string;
  temperature: number;
}

export interface LLMOutput {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const callGroq = async (input: LLMInput): Promise<LLMOutput> => {
  const result = await generateText({
    model: GROQ_MODEL,
    system: input.systemprompt,
    prompt: input.userprompt,
    temperature: input.temperature,
  });
  return {
    content: result.text,
    model: "llama-3.3-70b-versatile",
    usage: {
      prompt_tokens: result.usage.inputTokens!,
      completion_tokens: result.usage.outputTokens!,
      total_tokens: result.usage.totalTokens!,
    },
  };
};
