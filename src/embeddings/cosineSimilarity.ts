export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Arrays must have the same length");
    }

    let dot = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i: number = 0; i < a.length; i++) {
        const aVal = a[i] ?? 0;
        const bVal = b[i] ?? 0;
        dot += aVal * bVal;
        magnitudeA += aVal * aVal;
        magnitudeB += bVal * bVal;
    }
    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    if (denominator === 0) return 0;
    return dot / denominator;
}
export function findTopK(
    queryEmbedding: number[],
    candidates: Array<{
        id: string;
        question: string;
        answer: string;
        embedding: number[];
    }>,
    topK: number
) {
    const scored = candidates.map((faq) => {
        const { embedding, ...rest } = faq;
        return {
            ...rest,
            similarity: cosineSimilarity(queryEmbedding, embedding),
        };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
}
