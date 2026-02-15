import "dotenv/config";

interface Input {
  systemprompt: string;
  userprompt: string;
  temperature: number;
}


export const callGroq = async (input: Input): Promise<string > => {
  const url = process.env.GROQ_API_URL!;
  const apiKey = process.env.GROQ_API_KEY!;

  try {
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

  const data = await response.json();
  return data.choices[0].message.content;
  } catch (error:any ) {

        throw new error;


  }

};
