import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { streamText } from "ai";
import { callGroq, GROQ_MODEL } from "./groq.js";
import { callGemini, GEMINI_MODEL } from "./gemini.js";
import { translateTemplate, explainCodeTemplate, reviewTextTemplate } from "./prompts/templates.js";
import { tokenLogger } from "./middleware/tokenLogger.js";
// =============================================================================
// WEEK 4 IMPORTS - Conversation Memory
// =============================================================================
import {
  chat,
  chatStream,
  summarizeConversation,
  generateAndCacheSummary,
  classifyIntent,
  extractEntities,
} from "./services/ai.service.js";
// =============================================================================
// WEEK 5 IMPORTS - Embeddings & Semantic Search
// =============================================================================
import { embedText, semanticSearch } from "./embeddings/embeddingService.js";
import {
  getConversation,
  getMessages,
  clearConversation,
  deleteConversation,
  listConversations,
  getConversationStats,
  getConversationTokens,
  getCachedSummary,
  clearSummaryCache,
} from "./memory/conversationStore.js";
import {
  InputSchema,
  TestPromptInputSchema,
  SummaryOutputSchema,
  AnalysisOutputSchema,
  ReviewOutputSchema,
  ChatInputSchema,
  IntentInputSchema,
  EntitiesInputSchema,
} from "./schemas.js";

// Generate a simple unique ID for conversations
const generateConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// Safely parse JSON from LLM output — returns null instead of throwing
const safeJsonParse = (text: string): unknown | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = 2402;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(tokenLogger);


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
- Use simple, clear language
- You will not answer to any question just summarize 
`;
  const temperature = 0.7;

  if (req.query.stream === "true") {
    const model = provider === "gemini" ? GEMINI_MODEL : GROQ_MODEL;
    const result = streamText({ model, system: systemprompt, prompt: userprompt, temperature });
    result.pipeTextStreamToResponse(res);
    return;
  }

  try {
    const callProvider = provider === "gemini" ? callGemini : callGroq;
    const output = await callProvider({ userprompt, systemprompt, temperature });
    res.locals.tokenUsage.push({ model: output.model, ...output.usage });

    const parseOutput = safeJsonParse(output.content);
    const result = parseOutput ? SummaryOutputSchema.safeParse(parseOutput) : null;
    if (result?.success) {
      res.json({ summary: result.data, provider })
      return;
    }

    // Retry with error feedback — either JSON was invalid or schema didn't match
    const retryErrors = result ? JSON.stringify(result.error?.issues) : "Response was not valid JSON";
    const newOutput = await callProvider({ userprompt: `Your previous response had errors: ${retryErrors}\n\nReturn ONLY valid JSON. Summarize this text: ${input.data.userinput}`, systemprompt, temperature })
    res.locals.tokenUsage.push({ model: newOutput.model, ...newOutput.usage });

    const newParsed = safeJsonParse(newOutput.content);
    const newResult = newParsed ? SummaryOutputSchema.safeParse(newParsed) : null;
    if (newResult?.success) {
      res.json({ summary: newResult.data, provider })
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

    const parsed = safeJsonParse(output.content);
    const result = parsed ? AnalysisOutputSchema.safeParse(parsed) : null;

    if (result?.success) {
      res.json({ analysis: result.data, provider: input.data.provider });
      return;
    }

    const retryErrors = result ? JSON.stringify(result.error.issues) : "Response was not valid JSON";
    const retryOutput = await callProvider({
      userprompt: `Your previous response had errors: ${retryErrors}\n\nReturn ONLY valid JSON. Analyze this text: ${input.data.userinput}`,
      systemprompt,
      temperature: 0.1,
    });
    res.locals.tokenUsage.push({ model: retryOutput.model, ...retryOutput.usage });

    const retryParsed = safeJsonParse(retryOutput.content);
    const retryResult = retryParsed ? AnalysisOutputSchema.safeParse(retryParsed) : null;

    if (retryResult?.success) {
      res.json({ analysis: retryResult.data, provider: input.data.provider });
      return;
    }

    res.status(500).json({ error: "LLM returned invalid format after retry" });
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
  if (req.query.stream === "true") {
    const model = input.data.provider === "gemini" ? GEMINI_MODEL : GROQ_MODEL;
    const result = streamText({ model, system: translateTemplate.systemprompt, prompt: input.data.userinput, temperature: translateTemplate.temperature });
    result.pipeTextStreamToResponse(res);
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

  if (req.query.stream === "true") {
    const model = input.data.provider === "gemini" ? GEMINI_MODEL : GROQ_MODEL;
    const result = streamText({ model, system: explainCodeTemplate.systemprompt, prompt: input.data.userinput, temperature: explainCodeTemplate.temperature });
    result.pipeTextStreamToResponse(res);
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

    const parsed = safeJsonParse(output.content);
    const result = parsed ? ReviewOutputSchema.safeParse(parsed) : null;

    if (result?.success) {
      res.json({ review: result.data, provider: input.data.provider });
      return;
    }

    // Retry once with error feedback
    const retryErrors = result ? JSON.stringify(result.error.issues) : "Response was not valid JSON";
    const retryOutput = await callProvider({
      userprompt: `Your previous response had errors: ${retryErrors}\n\nReturn ONLY valid JSON. Review this text again: ${input.data.userinput}`,
      systemprompt: reviewTextTemplate.systemprompt,
      temperature: 0.1,
    });
    res.locals.tokenUsage.push({ model: retryOutput.model, ...retryOutput.usage });

    const retryParsed = safeJsonParse(retryOutput.content);
    const retryResult = retryParsed ? ReviewOutputSchema.safeParse(retryParsed) : null;

    if (retryResult?.success) {
      res.json({ review: retryResult.data, provider: input.data.provider });
      return;
    }

    res.status(500).json({ error: "LLM returned invalid format after retry" });
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

app.post("/stream-summary", async (req, res) => {
  const input = InputSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
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
  const model = provider === "gemini" ? GEMINI_MODEL : GROQ_MODEL;
  const result = streamText({
    model,
    system: systemprompt,
    prompt: userprompt,
    temperature,
  });

  result.pipeTextStreamToResponse(res);
})

app.get("/playground", (req, res) => {
  res.sendFile(path.join(__dirname, "playground.html"));
});

// =============================================================================
// WEEK 4 ENDPOINTS - Conversation Memory & Multi-Turn Chat
// =============================================================================

/**
 * POST /chat - Send a message in a multi-turn conversation
 * 
 * This is the main Week 4 endpoint! It:
 * 1. Accepts a message + optional conversation ID
 * 2. Retrieves conversation history based on memory strategy
 * 3. Sends full context to LLM
 * 4. Stores response in history
 * 5. Returns response with metadata
 * 
 * Request body:
 * {
 *   "message": "Hello, what's my name?",     // Required: user's message
 *   "conversationId": "conv_123",            // Optional: continues existing chat
 *   "strategy": "sliding-window",            // Optional: full | sliding-window | summary
 *   "windowSize": 20,                        // Optional: for sliding window
 *   "provider": "groq",                      // Optional: groq | gemini
 *   "stream": false,                         // Optional: stream response
 *   "systemPrompt": "...",                   // Optional: custom system prompt
 *   "temperature": 0.7                       // Optional: randomness
 * }
 * 
 * Response:
 * {
 *   "content": "AI response text...",
 *   "conversationId": "conv_123",
 *   "strategy": "sliding-window",
 *   "messageCount": 5,
 *   "usage": { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
 *   "model": "llama-3.3-70b-versatile"
 * }
 */
app.post("/chat", async (req, res) => {
  // Validate input
  const input = ChatInputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  // Generate conversation ID if not provided
  const conversationId = input.data.conversationId || generateConversationId();

  try {
    // Check if streaming is requested
    if (input.data.stream) {
      // Streaming response - tokens sent as generated
      await chatStream(
        input.data.message,
        {
          conversationId,
          strategy: input.data.strategy,
          windowSize: input.data.windowSize,
          provider: input.data.provider,
          systemPrompt: input.data.systemPrompt,
          temperature: input.data.temperature,
        },
        res
      );
      // Note: Response is already piped to res, no need to send JSON
      return;
    }

    // Non-streaming response - wait for full response
    const response = await chat(input.data.message, {
      conversationId,
      strategy: input.data.strategy,
      windowSize: input.data.windowSize,
      provider: input.data.provider,
      systemPrompt: input.data.systemPrompt,
      temperature: input.data.temperature,
    });

    // Log token usage
    if (response.usage) {
      res.locals.tokenUsage.push({
        model: response.model,
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
      });
    }

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /conversation/:id - Get all messages in a conversation
 * 
 * Returns the full message history for debugging or display.
 */
app.get("/conversation/:id", (req, res) => {
  const { id } = req.params;
  const messages = getMessages(id);
  const stats = getConversationStats(id);
  const tokens = getConversationTokens(id);
  const cachedSummary = getCachedSummary(id);

  res.json({
    conversationId: id,
    messages,
    stats,
    estimatedTokens: tokens,
    cachedSummary,
  });
});

/**
 * GET /conversation/:id/stats - Get conversation statistics
 * 
 * Returns metadata about the conversation without the full message content.
 */
app.get("/conversation/:id/stats", (req, res) => {
  const { id } = req.params;
  const stats = getConversationStats(id);
  const tokens = getConversationTokens(id);

  res.json({
    ...stats,
    estimatedTokens: tokens,
  });
});

/**
 * DELETE /conversation/:id - Delete a conversation
 * 
 * Removes all message history and cached summary.
 */
app.delete("/conversation/:id", (req, res) => {
  const { id } = req.params;
  
  // Clear summary cache
  clearSummaryCache(id);
  
  // Delete conversation
  const deleted = deleteConversation(id);

  res.json({
    success: deleted,
    message: deleted ? "Conversation deleted" : "Conversation not found",
  });
});

/**
 * POST /conversation/:id/clear - Clear message history but keep conversation
 * 
 * Useful for "new chat" in same conversation window.
 */
app.post("/conversation/:id/clear", (req, res) => {
  const { id } = req.params;
  clearConversation(id);
  clearSummaryCache(id);

  res.json({
    success: true,
    message: "Conversation history cleared",
    conversationId: id,
  });
});

/**
 * POST /conversation/:id/summarize - Generate structured summary
 * 
 * Uses generateObject() to create a structured analysis of the conversation.
 * This is a demonstration of the new generateObject() pattern from Week 4!
 * 
 * Response:
 * {
 *   "mainTopics": ["topic1", "topic2"],
 *   "keyPoints": ["point1", "point2"],
 *   "userIntent": "What user is trying to accomplish",
 *   "sentiment": "positive" | "neutral" | "negative",
 *   "summary": "Brief summary text..."
 * }
 */
app.post("/conversation/:id/summarize", async (req, res) => {
  const { id } = req.params;
  const provider = (req.body.provider as "groq" | "gemini") || "groq";

  try {
    const summary = await summarizeConversation(id, provider);

    // Estimate tokens for logging (summary generation uses generateObject)
    res.locals.tokenUsage.push({
      model: provider === "gemini" ? "gemini-2.0-flash" : "llama-3.3-70b-versatile",
      prompt_tokens: 0, // generateObject doesn't return detailed usage
      completion_tokens: 0,
      total_tokens: 0,
    });

    res.json({
      conversationId: id,
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /conversation/:id/cache-summary - Generate and cache summary for summary memory strategy
 * 
 * This generates a summary of the conversation and caches it for use in future
 * requests with the "summary" memory strategy.
 */
app.post("/conversation/:id/cache-summary", async (req, res) => {
  const { id } = req.params;
  const provider = (req.body.provider as "groq" | "gemini") || "groq";

  try {
    const summary = await generateAndCacheSummary(id, provider);

    res.json({
      conversationId: id,
      cachedSummary: summary,
      message: "Summary cached successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /conversations - List all conversation IDs
 * 
 * Useful for debugging or building a "recent chats" feature.
 */
app.get("/conversations", (req, res) => {
  const conversations = listConversations();

  res.json({
    count: conversations.length,
    conversations: conversations.map((id) => ({
      id,
      stats: getConversationStats(id),
    })),
  });
});

/**
 * POST /intent - Classify user intent
 * 
 * Uses generateObject() to classify what the user is trying to do.
 * Useful for routing requests or analytics.
 * 
 * Response:
 * {
 *   "intent": "question" | "task_request" | "clarification" | "chitchat" | "complaint" | "feedback",
 *   "confidence": 0.95,
 *   "suggestedResponse": "How to respond..."
 * }
 */
app.post("/intent", async (req, res) => {
  const input = IntentInputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  try {
    const result = await classifyIntent(input.data.message, input.data.provider);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /entities - Extract entities from text
 * 
 * Uses generateObject() to extract structured data from text.
 * Useful for analytics, RAG, or enhancing search.
 * 
 * Response:
 * {
 *   "people": ["John", "Mary"],
 *   "organizations": ["Google", "Microsoft"],
 *   "locations": ["New York", "London"],
 *   "dates": ["tomorrow", "next week"],
 *   "topics": ["AI", "Machine Learning"]
 * }
 */
app.post("/entities", async (req, res) => {
  const input = EntitiesInputSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues });
    return;
  }

  try {
    const result = await extractEntities(input.data.text, input.data.provider);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /chat-playground - Interactive chat UI for testing
 * 
 * A simple HTML page for testing multi-turn conversations.
 */
app.get("/chat-playground", (req, res) => {
  res.sendFile(path.join(__dirname, "chat-playground.html"));
});

// =============================================================================
// WEEK 5 ENDPOINTS - Embeddings & Semantic Search
// =============================================================================

/**
 * POST /embed - Embed a single text into a vector
 *
 * Takes any text, returns its 768-dimension embedding vector.
 * This is the raw building block — see what embeddings look like.
 *
 * Request: { "text": "What is React?" }
 * Response: { "embedding": [0.12, -0.45, ...], "dimensions": 768, "model": "text-embedding-004" }
 */
app.post("/embed", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required and must be a string" });
    return;
  }

  try {
    const embedding = await embedText(text);
    res.json({
      embedding,
      dimensions: embedding.length,
      model: "text-embedding-004",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /search - Semantic search over programming FAQs
 *
 * Embeds the query, compares against all FAQ embeddings using cosine similarity,
 * returns the most semantically similar results.
 *
 * Request: { "query": "how to debug my code", "topK": 5 }
 * Response: { "results": [{ "question": "...", "answer": "...", "similarity": 0.89 }], ... }
 */
app.post("/search", async (req, res) => {
  const { query, topK = 5 } = req.body;
  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "query is required and must be a string" });
    return;
  }

  try {
    const results = await semanticSearch(query, topK);
    res.json({
      results,
      query,
      topK,
      model: "text-embedding-004",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log("server running on port " + PORT);
});

