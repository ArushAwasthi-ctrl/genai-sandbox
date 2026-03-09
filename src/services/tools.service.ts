import { allTools } from "../tools/index.js";
import { GROQ_MODEL } from "../groq.js";
import { generateText, stepCountIs } from "ai";

export async function toolService(query: string) {
    const result = await generateText({
        model: GROQ_MODEL,
        tools: allTools,
        system: `You are a helpful assistant with access to tools. Follow these rules:
1. Use a tool ONLY when the user's question requires it.
2. After receiving a tool result, respond to the user in plain text using that result. Do NOT call the same tool again.
3. If no tool is needed, respond directly.
4. Never call a tool more than once for the same purpose.`,
        prompt: `${query}`,
        temperature: 0,
        stopWhen: stepCountIs(5)
    })
    return ({
        text: result.text,
        steps: result.steps,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        tokenUsage: result.usage
    })
} 