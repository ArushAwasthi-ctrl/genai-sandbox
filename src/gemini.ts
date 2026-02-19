import "dotenv/config";

interface Input {
  systemprompt: string;
  userprompt: string;
  temperature: number;
}

export const callGemini = async (input: Input): Promise<string> => {
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

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
