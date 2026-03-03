/**
 * ============================================================================
 * AI SERVICE - Core AI Operations with Memory Support
 * ============================================================================
 * 
 * WHAT: Centralized service for all AI operations
 * WHY: Encapsulates LLM calls, memory management, and structured output
 * HOW: Uses Vercel AI SDK's generateText, streamText, and generateObject
 * 
 * KEY CONCEPTS:
 * 1. generateText() - Get full text response (you know this from Weeks 1-3)
 * 2. streamText() - Stream response token by token (you know this)
 * 3. generateObject() - NEW! Get validated structured output directly
 * 
 * generateObject() is a GAME CHANGER:
 * - No manual JSON.parse()
 * - No retry logic for malformed JSON
 * - Pass Zod schema, get validated object back
 * - AI SDK handles prompt engineering for structured output internally
 */

import { generateText, streamText, generateObject } from "ai";
import type { Response } from "express";
import { z } from "zod";
import { GROQ_MODEL } from "../groq.js";
import { GEMINI_MODEL } from "../gemini.js";
import type { Message, MemoryStrategy } from "../memory/conversationStore.js";
import {
  getMessagesForLLM,
  addMessage,
  getCachedSummary,
  cacheSummary,
  getMessages,
} from "../memory/conversationStore.js";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Available providers - same as your existing endpoints
 */
export type Provider = "groq" | "gemini";

/**
 * Configuration for chat operations
 */
export interface ChatConfig {
  provider?: Provider;           // Which LLM to use (default: groq)
  conversationId: string;        // Which conversation
  strategy?: MemoryStrategy;     // Memory strategy (default: sliding-window)
  windowSize?: number;           // For sliding window, how many messages
  systemPrompt?: string | undefined;  // Custom system prompt (optional)
  temperature?: number;          // Randomness (default: 0.7)
  stream?: boolean;              // Whether to stream response
}

/**
 * Response from chat operation
 */
export interface ChatResponse {
  content: string;               // The AI's response text
  conversationId: string;        // Which conversation
  strategy: MemoryStrategy;      // Which strategy was used
  messageCount: number;          // How many messages were sent to LLM
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;                 // Which model was used
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the model based on provider
 * 
 * This pattern lets you swap providers easily - core concept from Weeks 1-3
 */
const getModel = (provider: Provider) => {
  return provider === "gemini" ? GEMINI_MODEL : GROQ_MODEL;
};

/**
 * Default system prompt for chat
 * 
 * This makes the AI conversational and aware it's in a chat context
 */
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant having a conversation.

Guidelines:
- Be concise but thorough
- Remember the context of our conversation
- If you don't know something, say so
- Be friendly but professional
- Format responses clearly (use bullet points, code blocks when appropriate)`;

/**
 * Convert our Message format to AI SDK's message format
 * 
 * Our format has timestamp, AI SDK's doesn't need it
 * This function strips the timestamp for the API call
 */
const toAIMessages = (messages: Message[]) => {
  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
};

// =============================================================================
// CORE CHAT FUNCTION
// =============================================================================

/**
 * Send a message and get AI response with conversation memory
 * 
 * This is the MAIN function for multi-turn chat!
 * 
 * FLOW:
 * 1. Get conversation history based on strategy
 * 2. Add new user message to history
 * 3. Send history + new message to LLM
 * 4. Add AI response to history
 * 5. Return response with metadata
 * 
 * @param userMessage - What the user wants to say
 * @param config - Chat configuration
 * @returns AI response with metadata
 */
export const chat = async (
  userMessage: string,
  config: ChatConfig
): Promise<ChatResponse> => {
  const {
    provider = "groq",
    conversationId,
    strategy = "sliding-window",
    windowSize = 20,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    temperature = 0.7,
  } = config;

  // Step 1: Add user message to conversation history
  // This happens FIRST so it's included in what we send to LLM
  addMessage(conversationId, { role: "user", content: userMessage });

  // Step 2: Get conversation history based on strategy
  // This includes the message we just added
  const history = getMessagesForLLM(conversationId, strategy, windowSize);

  // Step 3: Convert to AI SDK format
  const messages = toAIMessages(history);

  // Step 4: Get the model
  const model = getModel(provider);

  // Step 5: Call LLM with full context
  const result = await generateText({
    model,
    system: systemPrompt,
    messages,  // ← This is the KEY difference from Weeks 1-3!
                // We're sending the ENTIRE conversation history, not just one prompt
    temperature,
  });

  // Step 6: Add AI response to conversation history
  addMessage(conversationId, { role: "assistant", content: result.text });

  // Step 7: Return response with metadata
  return {
    content: result.text,
    conversationId,
    strategy,
    messageCount: messages.length,
    usage: {
      promptTokens: result.usage.inputTokens ?? 0,
      completionTokens: result.usage.outputTokens ?? 0,
      totalTokens: result.usage.totalTokens ?? 0,
    },
    model: provider === "gemini" ? "gemini-2.0-flash" : "llama-3.3-70b-versatile",
  };
};

/**
 * Streaming version of chat
 * 
 * Same as chat(), but streams tokens as they're generated.
 * Useful for long responses - user sees progress immediately.
 * 
 * IMPORTANT: With streaming, we need to collect the full response
 * before adding it to history!
 * 
 * @param userMessage - What the user wants to say
 * @param config - Chat configuration
 * @param res - Express response object to pipe stream to
 */
export const chatStream = async (
  userMessage: string,
  config: ChatConfig,
  res: Response
): Promise<void> => {
  const {
    provider = "groq",
    conversationId,
    strategy = "sliding-window",
    windowSize = 20,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    temperature = 0.7,
  } = config;

  // Step 1: Add user message to history
  addMessage(conversationId, { role: "user", content: userMessage });

  // Step 2: Get history based on strategy
  const history = getMessagesForLLM(conversationId, strategy, windowSize);
  const messages = toAIMessages(history);

  // Step 3: Get model and create stream
  const model = getModel(provider);
  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    temperature,
  });

  // Step 4: Pipe stream to response AND collect full text for history
  // IMPORTANT: We must await pipeTextStreamToResponse so that streaming
  // completes before we try to read the full text.
  // Without await, the function returns immediately and the assistant
  // message never gets added to history — breaking multi-turn context.
  await result.pipeTextStreamToResponse(res);

  // Step 5: AFTER streaming completes, add to history
  // result.text resolves to the full concatenated text after the stream ends
  const fullText = await result.text;
  addMessage(conversationId, { role: "assistant", content: fullText });
};

// =============================================================================
// GENERATE OBJECT - Structured Output (NEW IN WEEK 4!)
// =============================================================================

/**
 * Schema for summarizing a conversation
 * 
 * This demonstrates generateObject() - you define a Zod schema,
 * and the AI SDK ensures the LLM returns data matching that schema.
 * 
 * NO MORE:
 * - Manual JSON.parse() and hoping it's valid
 * - Retry logic for malformed JSON
 * - Crafting "return JSON only" prompts
 * 
 * The AI SDK handles ALL of this internally!
 */
const ConversationSummarySchema = z.object({
  mainTopics: z.array(z.string()).describe("Main topics discussed"),
  keyPoints: z.array(z.string()).describe("Key points or decisions made"),
  userIntent: z.string().describe("What the user is trying to accomplish"),
  sentiment: z.enum(["positive", "neutral", "negative"]).describe("Overall conversation sentiment"),
  summary: z.string().describe("Brief 2-3 sentence summary of the conversation"),
});

/**
 * Type inferred from the schema
 * TypeScript automatically knows the shape!
 */
type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

/**
 * Generate a structured summary of a conversation
 * 
 * This uses generateObject() - the NEW way to get structured output.
 * 
 * Compare to your Week 1-3 pattern:
 * - OLD: generateText() → JSON.parse() → Zod.safeParse() → retry if invalid
 * - NEW: generateObject() → get validated object directly!
 * 
 * @param conversationId - Which conversation to summarize
 * @param provider - Which LLM to use
 */
export const summarizeConversation = async (
  conversationId: string,
  provider: Provider = "groq"
): Promise<ConversationSummary> => {
  const messages = getMessages(conversationId);
  
  // Create a text representation of the conversation
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const model = getModel(provider);

  // THIS IS THE MAGIC! 🪄
  // Pass schema directly, get validated object back
  const result = await generateObject({
    model,
    schema: ConversationSummarySchema,
    prompt: `Analyze and summarize this conversation:

${conversationText}

Provide a structured analysis with topics, key points, user intent, sentiment, and a brief summary.`,
  });

  // result.object is FULLY VALIDATED and TYPE-SAFE!
  // No JSON.parse, no retry logic, no manual validation
  return result.object;
};

// =============================================================================
// SUMMARY GENERATION FOR SUMMARY MEMORY STRATEGY
// =============================================================================

/**
 * Schema for generating summaries to cache
 * 
 * This is what we'll inject as a "memory" of old conversation
 */
const CachedSummarySchema = z.object({
  summary: z.string().describe("Concise summary of the conversation so far"),
  keyFacts: z.array(z.string()).describe("Important facts to remember about the user or discussion"),
});

/**
 * Generate and cache a summary of old messages
 * 
 * This is used by the "summary" memory strategy:
 * 1. Take old messages (not recent ones)
 * 2. Generate a concise summary
 * 3. Cache it in memory
 * 4. Future requests use cached summary instead of full history
 * 
 * @param conversationId - Which conversation
 * @param provider - Which LLM
 * @returns The generated summary
 */
export const generateAndCacheSummary = async (
  conversationId: string,
  provider: Provider = "groq"
): Promise<string> => {
  // Check if we already have a cached summary
  const existing = getCachedSummary(conversationId);
  if (existing) {
    return existing;
  }

  const messages = getMessages(conversationId);
  
  // Only summarize if we have enough messages
  if (messages.length < 4) {
    return "Not enough conversation to summarize yet.";
  }

  // Create text representation
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const model = getModel(provider);

  // Generate structured summary
  const result = await generateObject({
    model,
    schema: CachedSummarySchema,
    prompt: `Summarize this conversation concisely. Focus on key facts about the user and important context that should be remembered for future responses.

Conversation:
${conversationText}

Provide a brief summary and key facts to remember.`,
  });

  // Format the summary for injection into future prompts
  const formattedSummary = `${result.object.summary}\n\nKey facts: ${result.object.keyFacts.join(", ")}`;

  // Cache it for future use
  cacheSummary(conversationId, formattedSummary);

  return formattedSummary;
};

// =============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// =============================================================================

/**
 * Schema for intent classification
 * 
 * Another example of generateObject() - classifying user intent
 */
const IntentSchema = z.object({
  intent: z.enum([
    "question",        // User asking for information
    "task_request",    // User wants AI to do something
    "clarification",   // User asking to explain previous response
    "chitchat",        // Casual conversation
    "complaint",       // User unhappy with something
    "feedback",        // User providing feedback
  ]).describe("The primary intent of the user's message"),
  confidence: z.number().min(0).max(1).describe("Confidence level (0-1)"),
  suggestedResponse: z.string().describe("Brief suggestion for how to respond"),
});

/**
 * Classify user intent - useful for routing or analytics
 */
export const classifyIntent = async (
  message: string,
  provider: Provider = "groq"
): Promise<z.infer<typeof IntentSchema>> => {
  const model = getModel(provider);

  const result = await generateObject({
    model,
    schema: IntentSchema,
    prompt: `Classify the intent of this user message: "${message}"`,
  });

  return result.object;
};

/**
 * Schema for entity extraction
 * 
 * Another generateObject() example - extracting structured data from text
 */
const EntitySchema = z.object({
  people: z.array(z.string()).describe("Names of people mentioned"),
  organizations: z.array(z.string()).describe("Companies or organizations mentioned"),
  locations: z.array(z.string()).describe("Places mentioned"),
  dates: z.array(z.string()).describe("Dates or time references"),
  topics: z.array(z.string()).describe("Main topics or subjects discussed"),
});

/**
 * Extract entities from a message - useful for analytics or RAG
 */
export const extractEntities = async (
  text: string,
  provider: Provider = "groq"
): Promise<z.infer<typeof EntitySchema>> => {
  const model = getModel(provider);

  const result = await generateObject({
    model,
    schema: EntitySchema,
    prompt: `Extract all entities (people, organizations, locations, dates, topics) from this text:

"${text}"`,
  });

  return result.object;
};

// =============================================================================
// EXPORTS
// =============================================================================

export const aiService = {
  // Core chat functions
  chat,
  chatStream,
  
  // Summary functions
  summarizeConversation,
  generateAndCacheSummary,
  
  // Utility functions
  classifyIntent,
  extractEntities,
  
  // Schemas (for reference)
  ConversationSummarySchema,
  IntentSchema,
  EntitySchema,
};