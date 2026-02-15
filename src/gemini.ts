import env from "dotenv/config";

interface Input {
  systemprompt: string;
  userprompt: string;
  temprature: number;
}
type URL = string | undefined;
export const callGemini = async (input: Input): Promise<void> => {
  const url: URL = process.env.GEMINI_API_URL ?? undefined;
  const output = await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: input.systemprompt + "\n\n" + input.userprompt }],
        },
      ],
      generationConfig: {
        temperature: input.temprature,
      },
    }),
  });
  console.log(output);
};
