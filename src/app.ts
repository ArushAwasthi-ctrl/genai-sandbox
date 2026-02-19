import express from "express";
import { callGroq } from "./groq.js";
import { callGemini } from "./gemini.js";
import { translateTemplate, explainCodeTemplate, reviewTextTemplate } from "./prompts/templates.js";
import { tokenLogger } from "./middleware/tokenLogger.js";
import { z } from "zod";


const app = express();
const PORT = 2402;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(tokenLogger);


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
const ReviewOutputSchema = z.object({
  score: z.number().min(1).max(10),
  issues: z.array(z.string()),
  rewrite: z.string(),
})
const TestPromptInputSchema = z.object({
  userinput: z.string().min(10),
  systemprompt: z.string().min(10, "System prompt must be at least 10 characters"),
  temperature: z.number().min(0).max(2).default(0.7),
  runs: z.number().int().min(1).max(5).default(3),
  provider: z.enum(["groq", "gemini"]).default("groq"),
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
    res.locals.tokenUsage.push({ model: output.model, ...output.usage });

    const parseOutput = JSON.parse(output.content);
    const result = OutputSummary.safeParse(parseOutput)
    if (result.success) {
      res.status(201).json({ summary: result.data, provider })
      return;
    }

    const newOutput = await callProvider({ userprompt: `Your previous response had errors: ${JSON.stringify(result.error?.issues)}\n\nAnalyze this text again: ${input.data.userinput}`, systemprompt, temperature })
    res.locals.tokenUsage.push({ model: newOutput.model, ...newOutput.usage });

    const newResult = OutputSummary.safeParse(JSON.parse(newOutput.content));
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
      userprompt: input.data.userinput,
      systemprompt,
      temperature: 0.2,
    });
    res.locals.tokenUsage.push({ model: output.model, ...output.usage });

    const parsed = JSON.parse(output.content);
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
    res.locals.tokenUsage.push({ model: retryOutput.model, ...retryOutput.usage });

    const retryParsed = JSON.parse(retryOutput.content);
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
    res.locals.tokenUsage.push({ model: output.model, ...output.usage });

    res.json({ translation: output.content, provider: input.data.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});


app.post("/explain-code", async (req, res) => {
  const input = InputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  const callProvider = input.data.provider === "gemini" ? callGemini : callGroq;

  try {
    const output = await callProvider({
      systemprompt: explainCodeTemplate.systemprompt,
      userprompt: input.data.userinput,
      temperature: explainCodeTemplate.temperature,
    });
    res.locals.tokenUsage.push({ model: output.model, ...output.usage });

    res.json({ explanation: output.content, provider: input.data.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/review-text", async (req, res) => {
  const input = InputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  const callProvider = input.data.provider === "gemini" ? callGemini : callGroq;

  try {
    const output = await callProvider({
      systemprompt: reviewTextTemplate.systemprompt,
      userprompt: input.data.userinput,
      temperature: reviewTextTemplate.temperature,
    });
    res.locals.tokenUsage.push({ model: output.model, ...output.usage });

    const parsed = JSON.parse(output.content);
    const result = ReviewOutputSchema.safeParse(parsed);

    if (result.success) {
      res.json({ review: result.data, provider: input.data.provider });
      return;
    }

    // Retry once with error feedback
    const retryOutput = await callProvider({
      userprompt: `Your previous response had errors: ${JSON.stringify(result.error.issues)}\n\nReview this text again: ${input.data.userinput}`,
      systemprompt: reviewTextTemplate.systemprompt,
      temperature: 0.1,
    });
    res.locals.tokenUsage.push({ model: retryOutput.model, ...retryOutput.usage });

    const retryResult = ReviewOutputSchema.safeParse(JSON.parse(retryOutput.content));

    if (retryResult.success) {
      res.json({ review: retryResult.data, provider: input.data.provider });
      return;
    }

    res.status(500).json({ error: "LLM returned invalid format after retry", issues: retryResult.error.issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/test-prompt", async (req, res) => {
  // Different input schema — accepts custom systemprompt, temperature, and runs
  const input = TestPromptInputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  const callProvider = input.data.provider === "gemini" ? callGemini : callGroq;

  try {
    // Run the same prompt N times in parallel using Promise.all
    // This shows how temperature affects output — same input, different results
    const promises = Array.from({ length: input.data.runs }, () =>
      callProvider({
        systemprompt: input.data.systemprompt,
        userprompt: input.data.userinput,
        temperature: input.data.temperature,
      })
    );

    const outputs = await Promise.all(promises);

    // Log token usage for every parallel run
    for (const output of outputs) {
      res.locals.tokenUsage.push({ model: output.model, ...output.usage });
    }

    res.json({
      results: outputs.map(o => o.content),
      runs: input.data.runs,
      temperature: input.data.temperature,
      provider: input.data.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log("server running on port " + PORT);
});
