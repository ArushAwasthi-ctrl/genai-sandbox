import express from "express";
import { callGroq } from "./groq.js";
import { callGemini } from "./gemini.js";
import { translateTemplate } from "./prompts/templates.js";
import { z } from "zod";


const app = express();
const PORT = 2402;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const InputSchema = z.object({
  userinput: z.string().min(10),
  provider: z.enum(["groq", "gemini"]).default("groq")
})
const OutputSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  topics: z.array(z.string()),
  summary: z.string(),
})
const OutputSummary = z.object({
  summary: z.string().min(10)
})


app.get("/", (req, res) => {
  res.send("Working");
});

app.post("/summary", async (req, res) => {
  const input = InputSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ "error": input.error.issues })
    return;
  }
  const userprompt = input.data.userinput;
  const provider = input.data.provider ?? "groq";


  const systemprompt = `You are a concise summary assistant. Provide output in JSON format only
Example:
{summary:string}
Rules:
- Output ONLY the summary, nothing else
- Exactly 1-2 sentences, never more
- Be direct and factual no introductions like "Here is a summary"
- Capture the key points, skip minor details
- Use simple, clear language`;
  const temperature = 0.7;

  try {
    const callProvider = provider === "gemini" ? callGemini : callGroq;
    const output = await callProvider({ userprompt, systemprompt, temperature });
    const parseOutput = JSON.parse(output);
    const result = OutputSummary.safeParse(parseOutput)
    if (result.success) {
      res.status(201).json({ summary: result.data, provider })
      return;
    }

    const newOutput = await callProvider({ userprompt: `Your previous response had errors: ${JSON.stringify(result.error?.issues)}\n\nAnalyze this text again: ${input.data.userinput}`, systemprompt, temperature })
    const newResult = OutputSummary.safeParse(JSON.parse(newOutput));
    if (newResult.success) {
      res.status(201).json({ summary: newResult.data, provider })
      return;
    }

    res.status(500).json({ error: "LLM returned invalid format after retry" });


  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/analyze", async (req, res) => {
  const input = InputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }


  const systemprompt = `You are a JSON-only response API. Analyze the sentiment of the given text.

Return ONLY valid JSON, no markdown, no explanation, no text before or after.
Exact format:
{"sentiment": "positive" or "negative" or "neutral", "topics": ["topic1", "topic2"], "summary": "one sentence summary"}`;

  const callProvider = input.data.provider === "gemini" ? callGemini : callGroq;

  try {
    const output = await callProvider({
      userprompt: input.data.userinput,  // use input.data, NOT req.body
      systemprompt,
      temperature: 0.2,
    });


    const parsed = JSON.parse(output);
    const result = OutputSchema.safeParse(parsed);

    if (result.success) {
      res.json({ analysis: result.data, provider: input.data.provider });
      return;
    }


    const retryOutput = await callProvider({
      userprompt: `Your previous response had errors: ${JSON.stringify(result.error.issues)}\n\nAnalyze this text again: ${input.data.userinput}`,
      systemprompt,
      temperature: 0.1,
    });
    const retryParsed = JSON.parse(retryOutput);
    const retryResult = OutputSchema.safeParse(retryParsed);

    if (retryResult.success) {
      res.json({ analysis: retryResult.data, provider: input.data.provider });
      return;
    }

    res.status(500).json({ error: "LLM returned invalid format after retry", issues: retryResult.error.issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/translate", async (req, res) => {
  const input = InputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  const callProvider = input.data.provider === "gemini" ? callGemini : callGroq;

  try {
    const output = await callProvider({
      systemprompt: translateTemplate.systemprompt,
      userprompt: input.data.userinput,
      temperature: translateTemplate.temperature,
    });

    res.json({ translation: output, provider: input.data.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});


app.listen(PORT, () => {
  console.log("server running on port " + PORT);
});
