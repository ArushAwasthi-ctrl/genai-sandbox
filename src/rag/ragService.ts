import crypto from "crypto";
import { ensureCollection, searchSimilar, upsert } from "./qdrant.js";
import { recursiveChunk } from "./chunker.js";
import { embedText, embedManyText } from "../embeddings/embeddingService.js";
import { buildRAGPrompt } from "./ragPrompts.js";
import { callGroq } from "../groq.js";

const dbName = 'rag-chunks'

let ingestedDocs: { title: string, chunkCount: number }[] = [];

export async function ingestDocument(title: string, content: string) {
    await ensureCollection(dbName)
    const chunks = recursiveChunk(content)
    const embeddings = await embedManyText(chunks)

    await Promise.all(embeddings.map(async (embed, index) =>
        await upsert(dbName, crypto.randomUUID(), embed, {
            text: chunks[index]!,
            docTitle: title,
            chunkIndex: index
        })
    ))

    ingestedDocs.push({ title, chunkCount: chunks.length })
    return { title, chunkCount: chunks.length }
}

export async function askQuestion(question: string, topK = 3) {
    await ensureCollection(dbName)
    const embedding = await embedText(question)
    const results = await searchSimilar(dbName, embedding, topK)
    const chunks = results.map((point: any) => point.payload as { text: string, docTitle: string, chunkIndex: number })

    const { systemprompt, userprompt } = buildRAGPrompt(chunks, question)
    const response = await callGroq({ systemprompt, userprompt, temperature: 0 })

    return {
        answer: response.content,
        sources: chunks,
        usage: response.usage
    }
}

export function getDocuments() {
    return ingestedDocs;
}