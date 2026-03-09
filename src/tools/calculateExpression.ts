import { tool } from 'ai'
import { z } from 'zod/v4'

export const calculateExpression = tool({
    description: "This tool will be called when performing mathematical expression calculation",
    inputSchema: z.object({
        expression: z.string().describe("JavaScript math expression. Use '**' for powers (e.g. '2**10'), Math.sqrt(144), '2 + 2'. Do NOT use '^' for exponentiation.")
    }),
    execute: ({ expression }) => {
        try {
            const result = new Function(`return ${expression}`)();
            return { expression, result: String(result) };
        } catch {
            return { expression, error: "Invalid expression" };
        }
    }
})