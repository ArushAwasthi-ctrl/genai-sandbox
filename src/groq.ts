import "dotenv/config";

// Shared interfaces — gemini.ts imports these too
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

const GROQ_MODEL = "llama-3.3-70b-versatile";

export const callGroq = async (input: LLMInput): Promise<LLMOutput> => {
  const url = process.env.GROQ_API_URL;
  const apiKey = process.env.GROQ_API_KEY;
  if (!url || !apiKey) throw new Error("GROQ_API_URL or GROQ_API_KEY is not set");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: input.systemprompt },
        { role: "user", content: input.userprompt },
      ],
      temperature: input.temperature,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  // Groq (OpenAI format) returns usage: { prompt_tokens, completion_tokens, total_tokens }
  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: GROQ_MODEL,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
  };
};
