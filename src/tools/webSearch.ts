import { tool } from "ai";
import { z } from "zod/v4";

export const webSearch = tool({
    description: "Search the web for current information, news, or topics the LLM doesn't know about",
    inputSchema: z.object({
        query: z.string().describe("Search query to look up on the web"),
    }),
    execute: async ({ query }) => {
        try {
            const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
            const data = await res.json();
            return {
                heading: data.Heading,
                abstractText: data.AbstractText,
                abstractSource: data.AbstractSource,
                abstractURL: data.AbstractURL,
                relatedTopics: data.RelatedTopics?.slice(0, 5)?.map((t: any) => t.Text).filter(Boolean)
            };
        } catch {
            return { query, error: "Failed to search the web" };
        }
    }
})
