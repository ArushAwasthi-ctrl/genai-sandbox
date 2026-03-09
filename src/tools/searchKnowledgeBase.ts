import { tool } from "ai";
import z from "zod/v4";
import { retrieveChunks } from "../rag/ragService.js";

export const searchKnowledgeBase = tool({
    description: "Search the ingested knowledge base documents for relevant information about a topic",
    inputSchema: z.object({ question: z.string().describe("question asked by the user") }),
    execute: async ({question})=>{
        const result = await retrieveChunks(question);
        return  result;
    }
})