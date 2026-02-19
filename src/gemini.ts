import "dotenv/config";
import type { LLMInput, LLMOutput } from "./groq.js";

const GEMINI_MODEL = "gemini-2.0-flash";

export const callGemini = async (input: LLMInput): Promise<LLMOutput> => {
  const url = process.env.GEMINI_API_URL;
  if (!url) throw new Error("GEMINI_API_URL is not set");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: input.systemprompt + "\n\n" + input.userprompt }],
        },
      ],
      generationConfig: {
        temperature: input.temperature,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  // Gemini uses different field names: promptTokenCount, candidatesTokenCount, totalTokenCount
  // We normalize them to match Groq/OpenAI format: prompt_tokens, completion_tokens, total_tokens
  const data = await response.json();
  const meta = data.usageMetadata;
  return {
    content: data.candidates[0].content.parts[0].text,
    model: GEMINI_MODEL,
    usage: {
      prompt_tokens: meta?.promptTokenCount ?? 0,
      completion_tokens: meta?.candidatesTokenCount ?? 0,
      total_tokens: meta?.totalTokenCount ?? 0,
    },
  };
};
