import { embed, embedMany } from "ai";
import { google } from '../gemini.js'
import { programmingFAQs } from "../data/programmingFAQs.js";
import { findTopK } from "./cosineSimilarity.js";
interface FAQ {
    id: string,
    question: string,
    answer: string,
    embedding: number[]
}
const embedModel = google.embeddingModel("gemini-embedding-001");

let cachedFAQs: FAQ[] = [];

export async function embedText(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embedModel,
        value: text
    })

    return embedding;
}
export async function loadFAQs() {
    if (cachedFAQs.length > 0) return cachedFAQs;

    const { embeddings } = await embedMany({
        model: embedModel,
        values: programmingFAQs.map((faq) => faq.question)
    })
    programmingFAQs.forEach((faq, index) => {
        cachedFAQs.push({
            ...faq,
            embedding: embeddings[index]!
        })
    })
    return cachedFAQs;
}

export async function semanticSearch(query: string, topK: number) {
    const queryVector = await embedText(query);
    const FAQs: FAQ[] = await loadFAQs();
    const semantics = findTopK(queryVector, FAQs, topK);
    return semantics

}