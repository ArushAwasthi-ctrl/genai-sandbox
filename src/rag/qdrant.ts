import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrantclient = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!
})


export async function ensureCollection(dbName: string) {
    const { exists } = await qdrantclient.collectionExists(dbName)
    if (!exists) {
        await qdrantclient.createCollection(dbName, {
            vectors: {
                size: 3072,
                distance: "Cosine"
            }
        })
    }

}

export async function upsert(dbName: string, id: string, vector: number[], payload: { text: string, docTitle: string, chunkIndex: number }): Promise<Object> {
    const upsert = await qdrantclient.upsert(dbName, {
        points: [{ id, vector, payload }]
    })
    return upsert;
}
export async function searchSimilar(dbName: string, query: number[], topK: number): Promise<Object[]> {
    const retrieve = await qdrantclient.query(dbName, {
        query: query,
        limit: topK,
        with_payload: true
    })
    return retrieve.points;
}


