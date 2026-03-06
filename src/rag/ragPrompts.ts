export function buildRAGPrompt(chunks: { text: string, docTitle: string, chunkIndex: number }[], question: string): { systemprompt: string, userprompt: string } {

    const systemprompt = `You are a helpful assistant that answers questions based ONLY on the provided context.

Rules:
1. ONLY use information from the provided context chunks to answer
2. Cite your sources using [Source N] format referencing which chunks you used
3. If the context does not contain enough information to answer the question, say "I don't have enough information to answer that based on the available documents."
4. Never make up or infer facts that are not explicitly stated in the context
5. Be concise and direct
`

    let context = chunks.map((chunk, index) =>
        `[Source ${index + 1}] (${chunk.docTitle}, chunk ${chunk.chunkIndex}): ${chunk.text}`
    ).join("\n")
    let userprompt = `Context:
        ${context}
Question: ${question}`




    return { systemprompt, userprompt }
}