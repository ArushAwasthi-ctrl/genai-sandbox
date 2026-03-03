import { z } from "zod";

// =============================================================================
// WEEK 1-3 SCHEMAS (Existing)
// =============================================================================

// --- Input Schemas ---

// General input (used by /summary, /analyze, /translate, /explain-code, /review-text)
export const InputSchema = z.object({
  userinput: z.string().min(10, "Input must be at least 10 characters"),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

// For /test-prompt — lets you pass a custom system prompt and control runs
export const TestPromptInputSchema = z.object({
  userinput: z.string().min(10),
  systemprompt: z.string().min(10, "System prompt must be at least 10 characters"),
  temperature: z.number().min(0).max(2).default(0.7),
  runs: z.number().int().min(1).max(5).default(3),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

// --- Output Schemas (validate what the LLM returns) ---

export const SummaryOutputSchema = z.object({
  summary: z.string().min(10),
});

export const AnalysisOutputSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  topics: z.array(z.string()),
  summary: z.string(),
});

// For /review-text — persona endpoint returns structured feedback
export const ReviewOutputSchema = z.object({
  score: z.number().min(1).max(10),
  issues: z.array(z.string()),
  rewrite: z.string(),
});

// =============================================================================
// WEEK 4 SCHEMAS - Conversation Memory & Multi-Turn Chat
// =============================================================================

/**
 * Memory strategies for conversation context
 * 
 * - full: Send ALL messages (expensive, hits token limits)
 * - sliding-window: Last N messages only (default, balanced)
 * - summary: Summarize old messages, send summary + recent (complex)
 */
export const MemoryStrategySchema = z.enum(["full", "sliding-window", "summary"]);
export type MemoryStrategyType = z.infer<typeof MemoryStrategySchema>;

/**
 * Input for /chat endpoint - send a message in a conversation
 * 
 * @param message - What the user wants to say
 * @param conversationId - Unique ID for this conversation (auto-generated if not provided)
 * @param strategy - Memory strategy to use
 * @param windowSize - For sliding window, how many messages to include
 * @param provider - Which LLM to use
 * @param stream - Whether to stream the response
 */
export const ChatInputSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message too long"),
  conversationId: z.string().optional(),  // Auto-generated if not provided
  strategy: MemoryStrategySchema.default("sliding-window"),
  windowSize: z.number().int().min(2).max(50).default(20),
  provider: z.enum(["groq", "gemini"]).default("groq"),
  stream: z.boolean().default(false),
  systemPrompt: z.string().max(2000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
});

/**
 * Input for /conversation/:id/clear - clear conversation history
 */
export const ClearConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

/**
 * Input for /conversation/:id/summary - get structured summary
 */
export const ConversationSummaryInputSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

/**
 * Input for /intent endpoint - classify user intent
 */
export const IntentInputSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

/**
 * Input for /entities endpoint - extract entities from text
 */
export const EntitiesInputSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters"),
  provider: z.enum(["groq", "gemini"]).default("groq"),
});

// --- Response Schemas for Week 4 ---

/**
 * Response from /chat endpoint
 */
export const ChatResponseSchema = z.object({
  content: z.string(),
  conversationId: z.string(),
  strategy: MemoryStrategySchema,
  messageCount: z.number(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
  model: z.string(),
});

/**
 * Conversation stats response
 */
export const ConversationStatsSchema = z.object({
  id: z.string(),
  messageCount: z.number(),
  userMessages: z.number(),
  assistantMessages: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Intent classification response
 */
export const IntentResponseSchema = z.object({
  intent: z.enum(["question", "task_request", "clarification", "chitchat", "complaint", "feedback"]),
  confidence: z.number().min(0).max(1),
  suggestedResponse: z.string(),
});

/**
 * Entity extraction response
 */
export const EntitiesResponseSchema = z.object({
  people: z.array(z.string()),
  organizations: z.array(z.string()),
  locations: z.array(z.string()),
  dates: z.array(z.string()),
  topics: z.array(z.string()),
});
