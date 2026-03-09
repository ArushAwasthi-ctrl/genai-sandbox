import { tool } from "ai";
import {z} from "zod/v4";
import { callGroq } from "../groq.js";
export const translateText = tool({
    description: "use this tool to translate in any language specified",
    inputSchema: z.object({
        content: z.string().describe("content to be translated into specified language"),
        language: z.string().describe("which language to translate into")
    }),
    execute: async ({ content, language }) => {
        const systemprompt = `You are a translator. Translate the given text to ${language}. Return only the translation, nothing else.`
        const userprompt = `${content}`
        const { content: translatedContent } = await callGroq({ systemprompt, userprompt, temperature: 0 })
        return { originalText: content, targetLanguage: language, translatedText: translatedContent }

    }
})