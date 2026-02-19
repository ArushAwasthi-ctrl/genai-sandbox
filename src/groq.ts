import "dotenv/config";

interface Input {
  systemprompt: string;
  userprompt: string;
  temperature: number;
}

export const callGroq = async (input: Input): Promise<string> => {
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
      model: "llama-3.3-70b-versatile",
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

  const data = await response.json();
  return data.choices[0].message.content;
};
