import type { Request, Response, NextFunction } from "express";

export interface TokenUsageEntry {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export const tokenLogger = (req: Request, res: Response, next: NextFunction) => {
  // BEFORE the route handler runs: record start time
  const startTime = Date.now();

  // Create an empty array on res.locals — route handlers will push usage data here
  // res.locals is an Express object that lives for ONE request only
  res.locals.tokenUsage = [] as TokenUsageEntry[];

  // res.on("finish") fires AFTER the response is sent to the client
  // This is where we log — we now have all the data
  res.on("finish", () => {
    const latencyMs = Date.now() - startTime;
    const usageEntries: TokenUsageEntry[] = res.locals.tokenUsage;

    // Skip non-AI routes (GET /, etc.) — they won't have any token usage
    if (usageEntries.length === 0) return;

    // Sum up tokens across all LLM calls in this request
    // Why multiple? Retries (e.g., /analyze retries on bad JSON) or parallel runs (/test-prompt)
    const totals = usageEntries.reduce(
      (acc, entry) => ({
        prompt_tokens: acc.prompt_tokens + entry.prompt_tokens,
        completion_tokens: acc.completion_tokens + entry.completion_tokens,
        total_tokens: acc.total_tokens + entry.total_tokens,
      }),
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    );

    console.log(`\n--- Token Usage ---`);
    console.log(`  endpoint:           ${req.method} ${req.path}`);
    console.log(`  model:              ${usageEntries[0]!.model}`);
    console.log(`  llm_calls:          ${usageEntries.length}`);
    console.log(`  prompt_tokens:      ${totals.prompt_tokens}`);
    console.log(`  completion_tokens:  ${totals.completion_tokens}`);
    console.log(`  total_tokens:       ${totals.total_tokens}`);
    console.log(`  latency_ms:         ${latencyMs}`);
    console.log(`  status:             ${res.statusCode}`);
    console.log(`-------------------\n`);
  });

  next();
};
