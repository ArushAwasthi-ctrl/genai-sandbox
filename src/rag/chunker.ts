export function recursiveChunk(text: string, maxSize = 500, overlap = 50): string[] {
    if (!text.trim()) return [];
    if (text.length <= maxSize) return [text.trim()];

    const chunks: string[] = [];
    const paragraphs = text.split("\n\n");

    let currentChunk = "";

    for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;

        // If a single paragraph is too long, split it by sentences
        if (trimmed.length > maxSize) {
            // First, push whatever we've accumulated so far
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }

            const sentences = trimmed.split(". ");
            let sentenceChunk = "";

            for (const sentence of sentences) {
                const toAdd = sentenceChunk ? ". " + sentence : sentence;

                if ((sentenceChunk + toAdd).length <= maxSize) {
                    sentenceChunk += toAdd;
                } else {
                    if (sentenceChunk.trim()) {
                        chunks.push(sentenceChunk.trim());
                    }
                    // Start new chunk with overlap from previous
                    const prev = sentenceChunk.trim();
                    const overlapText = prev.length > overlap ? prev.slice(-overlap) : prev;
                    sentenceChunk = overlapText + " " + sentence;
                }
            }

            if (sentenceChunk.trim()) {
                currentChunk = sentenceChunk;
            }
            continue;
        }

        // Normal case: paragraph fits within maxSize
        const separator = currentChunk ? "\n\n" : "";
        if ((currentChunk + separator + trimmed).length <= maxSize) {
            currentChunk += separator + trimmed;
        } else {
            // Push current chunk and start new one with overlap
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            const overlapText = currentChunk.length > overlap
                ? currentChunk.slice(-overlap)
                : currentChunk;
            currentChunk = overlapText.trim() + " " + trimmed;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}