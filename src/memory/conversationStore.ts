/**
 * ============================================================================
 * CONVERSATION STORE - In-Memory Storage for Multi-Turn Chat
 * ============================================================================
 * 
 * WHAT: Stores conversation history so LLM can "remember" previous messages
 * WHY: LLMs are STATELESS - they forget everything after each request
 * HOW: We store messages keyed by conversationId, send history with each LLM call
 * 
 * In production, this would be Redis or MongoDB. For learning, in-memory is fine.
 * 
 * KEY CONCEPTS:
 * - Conversation = array of messages with roles (user/assistant/system)
 * - Each message has content, timestamp, and optional token count
 * - Store is keyed by conversationId (like a session ID)
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * A single message in a conversation
 * - role: who sent the message (user = human, assistant = AI, system = instructions)
 * - content: the actual text
 * - timestamp: when it was sent (useful for debugging, analytics)
 * - tokenCount: approximate tokens (useful for memory management)
 */
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokenCount?: number;
}

/**
 * A complete conversation with metadata
 * - id: unique identifier (you can use UUID, or any string)
 * - messages: array of all messages in order
 * - createdAt/updatedAt: for analytics and cleanup
 * - metadata: optional info like model used, total tokens, memory strategy
 */
export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    model?: string;
    totalTokens?: number;
    strategy?: MemoryStrategy;
  };
}

/**
 * Three memory strategies we'll implement:
 * 
 * 1. FULL: Send ALL messages every time
 *    - Pros: Complete context, best coherence
 *    - Cons: Expensive, hits token limits quickly
 * 
 * 2. SLIDING-WINDOW: Send last N messages only
 *    - Pros: Controlled token usage, predictable cost
 *    - Cons: Loses old context, may forget important info
 * 
 * 3. SUMMARY: Old messages → LLM summary → Cache summary → Send summary + recent messages
 *    - Pros: Best of both worlds - old context preserved, controlled tokens
 *    - Cons: Extra LLM call to generate summary, complexity
 */
export type MemoryStrategy = "full" | "sliding-window" | "summary";

// =============================================================================
// IN-MEMORY STORAGE
// =============================================================================

/**
 * The actual storage - a Map where:
 * - Key = conversationId (string)
 * - Value = Conversation object
 * 
 * Why Map over object?
 * - Map has .size, .keys(), .values() methods
 * - Map keys can be any type (object keys are always strings)
 * - Map has better performance for frequent additions/deletions
 */
const conversations = new Map<string, Conversation>();

// =============================================================================
// CORE OPERATIONS
// =============================================================================

/**
 * Create a new conversation with empty messages array
 * 
 * @param id - Unique identifier for this conversation
 * @returns The newly created conversation
 * 
 * Example:
 *   const conv = createConversation("conv-123");
 *   // conv = { id: "conv-123", messages: [], createdAt: Date, ... }
 */
export const createConversation = (id: string): Conversation => {
  const conversation: Conversation = {
    id,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  };
  conversations.set(id, conversation);
  return conversation;
};

/**
 * Get conversation by ID, create if doesn't exist
 * 
 * This pattern (get-or-create) is common because:
 * - First message in a chat shouldn't require explicit "create" call
 * - Simplifies API - caller doesn't need to check if conversation exists
 * 
 * @param id - Conversation ID
 * @returns The conversation (existing or newly created)
 */
export const getConversation = (id: string): Conversation => {
  let conversation = conversations.get(id);
  if (!conversation) {
    // Auto-create if doesn't exist - convenient for first message
    conversation = createConversation(id);
  }
  return conversation;
};

/**
 * Add a message to a conversation
 * 
 * @param conversationId - Which conversation to add to
 * @param message - The message (without timestamp - we add that)
 * @returns The updated conversation
 * 
 * Example:
 *   addMessage("conv-123", { role: "user", content: "Hello!" });
 *   addMessage("conv-123", { role: "assistant", content: "Hi there!" });
 */
export const addMessage = (
  conversationId: string,
  message: Omit<Message, "timestamp">
): Conversation => {
  const conversation = getConversation(conversationId);
  
  // Push new message with auto-generated timestamp
  conversation.messages.push({
    ...message,
    timestamp: new Date(),
  });
  
  // Update the updatedAt field (useful for cleanup old conversations)
  conversation.updatedAt = new Date();
  
  return conversation;
};

/**
 * Get all messages for a conversation
 * 
 * @param conversationId - Which conversation
 * @returns Array of messages (empty array if conversation doesn't exist)
 */
export const getMessages = (conversationId: string): Message[] => {
  return getConversation(conversationId).messages;
};

/**
 * Clear message history but keep the conversation object
 * 
 * Useful when user wants to "start fresh" but keep same conversation ID
 */
export const clearConversation = (conversationId: string): void => {
  const conversation = conversations.get(conversationId);
  if (conversation) {
    conversation.messages = [];
    conversation.updatedAt = new Date();
  }
};

/**
 * Delete conversation entirely from storage
 * 
 * @returns true if existed and was deleted, false if didn't exist
 */
export const deleteConversation = (conversationId: string): boolean => {
  return conversations.delete(conversationId);
};

/**
 * List all conversation IDs
 * 
 * Useful for debugging or building a "recent chats" feature
 */
export const listConversations = (): string[] => {
  return Array.from(conversations.keys());
};

/**
 * Get stats about a conversation
 * 
 * Useful for analytics, debugging, or showing user their chat stats
 */
export const getConversationStats = (conversationId: string) => {
  const conversation = getConversation(conversationId);
  const messageCount = conversation.messages.length;
  const userMessages = conversation.messages.filter((m) => m.role === "user").length;
  const assistantMessages = conversation.messages.filter(
    (m) => m.role === "assistant"
  ).length;

  return {
    id: conversationId,
    messageCount,
    userMessages,
    assistantMessages,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

// =============================================================================
// TOKEN UTILITIES
// =============================================================================

/**
 * Estimate token count for a string
 * 
 * RULE OF THUMB: 1 token ≈ 4 characters for English text
 * 
 * This is an approximation. Actual tokenization depends on:
 * - The tokenizer used (GPT uses tiktoken, different for other models)
 * - Language (English is efficient, other languages may use more tokens)
 * - Special characters, code, etc.
 * 
 * For production, use a proper tokenizer library like `tiktoken`
 * 
 * @param text - The text to estimate
 * @returns Approximate token count
 */
export const estimateTokens = (text: string): number => {
  // Simple approximation: 1 token per 4 characters
  return Math.ceil(text.length / 4);
};

/**
 * Get total estimated tokens in a conversation
 * 
 * Useful for:
 * - Deciding when to use sliding window
 * - Estimating API costs
 * - Preventing context window overflow
 * 
 * @param conversationId - Which conversation
 * @returns Total estimated tokens across all messages
 */
export const getConversationTokens = (conversationId: string): number => {
  const messages = getMessages(conversationId);
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);
};

// =============================================================================
// MEMORY STRATEGY IMPLEMENTATIONS
// =============================================================================

/**
 * STRATEGY 1: Full History
 * 
 * Returns ALL messages in the conversation.
 * 
 * When to use:
 * - Short conversations (< 20 messages)
 * - When complete context is critical
 * - When token limit is not a concern
 * 
 * Risks:
 * - Will fail when conversation exceeds model's context window
 * - Llama 70B = 128K tokens, but you want to leave room for response
 */
export const getFullHistory = (conversationId: string): Message[] => {
  return getMessages(conversationId);
};

/**
 * STRATEGY 2: Sliding Window
 * 
 * Returns only the last N messages.
 * 
 * When to use:
 * - Long conversations where token limit is a concern
 * - When recent context is more important than old context
 * - Default strategy for most production systems
 * 
 * Tradeoff:
 * - Loses old context (LLM won't remember early conversation)
 * - But guarantees predictable token usage
 * 
 * @param conversationId - Which conversation
 * @param windowSize - How many recent messages to include (default: 20)
 */
export const getSlidingWindow = (
  conversationId: string,
  windowSize: number = 20
): Message[] => {
  const messages = getMessages(conversationId);
  
  // If fewer messages than window size, return all
  if (messages.length <= windowSize) {
    return messages;
  }
  
  // Otherwise, return last N messages
  // slice(-N) returns last N elements
  return messages.slice(-windowSize);
};

/**
 * STRATEGY 3: Summary Memory (the complex one!)
 * 
 * This strategy:
 * 1. Keeps recent messages as-is (last N)
 * 2. Summarizes older messages into a single "summary" message
 * 3. Caches the summary to avoid re-summarizing
 * 
 * Result structure:
 * [
 *   { role: "system", content: "Summary of earlier conversation: ..." },
 *   { role: "user", content: "Recent message 1" },
 *   { role: "assistant", content: "Recent response 1" },
 *   ...
 * ]
 * 
 * When to use:
 * - Very long conversations where context window is exceeded
 * - When old context is still somewhat important
 * - Production systems with long-running conversations
 * 
 * Tradeoff:
 * - Extra complexity (caching, summary generation)
 * - Extra LLM call to generate summary (cost + latency)
 * - Summary may lose important details
 */

// Cache for summaries: Map<conversationId, summaryText>
const summaryCache = new Map<string, string>();

/**
 * Get cached summary for a conversation
 */
export const getCachedSummary = (conversationId: string): string | null => {
  return summaryCache.get(conversationId) || null;
};

/**
 * Cache a summary for a conversation
 */
export const cacheSummary = (conversationId: string, summary: string): void => {
  summaryCache.set(conversationId, summary);
};

/**
 * Clear the summary cache (when user wants to "forget" old context)
 */
export const clearSummaryCache = (conversationId: string): void => {
  summaryCache.delete(conversationId);
};

/**
 * Get messages using summary memory strategy
 * 
 * @param conversationId - Which conversation
 * @param recentMessageCount - How many recent messages to keep as-is (default: 5)
 * @returns Messages array with summary + recent messages
 */
export const getSummaryMemory = (
  conversationId: string,
  recentMessageCount: number = 5
): Message[] => {
  const messages = getMessages(conversationId);
  
  // If conversation is short, no need for summary
  if (messages.length <= recentMessageCount) {
    return messages;
  }
  
  // Split into "old" and "recent"
  const oldMessages = messages.slice(0, -recentMessageCount);
  const recentMessages = messages.slice(-recentMessageCount);
  
  // Get cached summary (or placeholder if not yet summarized)
  const cachedSummary = getCachedSummary(conversationId);
  
  // Build result: summary as system message + recent messages
  const result: Message[] = [];
  
  if (cachedSummary) {
    // We have a cached summary - use it
    result.push({
      role: "system",
      content: `[Summary of earlier conversation]: ${cachedSummary}`,
      timestamp: new Date(),
    });
  } else if (oldMessages.length > 0) {
    // No cached summary but have old messages
    // Return a placeholder - the caller should generate a summary
    result.push({
      role: "system",
      content: `[Note: ${oldMessages.length} earlier messages not yet summarized. They will be included in the next response.]`,
      timestamp: new Date(),
    });
  }
  
  // Add recent messages
  result.push(...recentMessages);
  
  return result;
};

/**
 * MASTER FUNCTION: Get messages based on strategy
 * 
 * This is what your chat endpoint will call.
 * 
 * @param conversationId - Which conversation
 * @param strategy - Which memory strategy to use
 * @param windowSize - For sliding window, how many messages
 * @returns Messages array ready to send to LLM
 */
export const getMessagesForLLM = (
  conversationId: string,
  strategy: MemoryStrategy = "sliding-window",
  windowSize: number = 20
): Message[] => {
  switch (strategy) {
    case "full":
      return getFullHistory(conversationId);
    
    case "sliding-window":
      return getSlidingWindow(conversationId, windowSize);
    
    case "summary":
      return getSummaryMemory(conversationId, Math.floor(windowSize / 4));
    
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = strategy;
      return _exhaustive;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export const conversationStore = {
  // Core operations
  create: createConversation,
  get: getConversation,
  addMessage,
  getMessages,
  clear: clearConversation,
  delete: deleteConversation,
  list: listConversations,
  stats: getConversationStats,
  
  // Token utilities
  estimateTokens,
  getTotalTokens: getConversationTokens,
  
  // Memory strategies
  getFullHistory,
  getSlidingWindow,
  getSummaryMemory,
  getMessagesForLLM,
  
  // Summary cache
  getCachedSummary,
  cacheSummary,
  clearSummaryCache,
};