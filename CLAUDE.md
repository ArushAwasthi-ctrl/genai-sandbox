# GenAI Sandbox — Claude Instructions

## What This Project Is
This is Arush's Gen AI learning sandbox — an Express + TypeScript API for experimenting with LLM integrations. It follows a 10-week pathway from basics to production-grade AI (see `../GenAI-Learning-Pathway-Arush.md`).

## Current Week & Status
- **Week 1**: Fix bugs, add Zod validation, structured LLM output
- Groq integration: WORKING (1 bug — `throw new error` in groq.ts)
- Gemini integration: BROKEN (6 bugs in gemini.ts — wrong import, typo `temprature`, void return, no JSON parse, not wired into app.ts)
- Zod: installed but UNUSED
- Error handling: NONE
- Streaming: NOT YET (Week 3)

## Tech Stack
- TypeScript (strict mode), Express 5, Zod 4
- Groq API (Llama 3.3 70B) — primary, free tier
- Gemini API (gemini-2.0-flash) — secondary
- Vercel AI SDK v6 — coming in Week 3
- No frontend yet (API only, HTML playground in Week 3)

## How to Help Arush

### Teaching Mode (DEFAULT)
Arush is LEARNING Gen AI. Don't just write code for him — teach as you go:
- Explain WHY before HOW. "We use Zod here because..." not just the code
- Point out bugs and let him try fixing first before showing the fix
- After implementing something, mention the relevant interview question
- Connect every concept to how it would work in production or at scale

### Code Style
- TypeScript strict mode — no `any` unless absolutely necessary
- Zod for ALL runtime validation (API inputs AND LLM outputs)
- Explicit error handling — never let the server crash silently
- Named exports, descriptive variable names
- Keep files focused — one concern per file (groq.ts, gemini.ts, etc.)

### Project Structure (evolves over weeks)
```
src/
├── app.ts              ← Express app + routes
├── groq.ts             ← Groq provider
├── gemini.ts           ← Gemini provider
├── prompts/            ← Week 2: prompt templates
├── middleware/          ← Error handling, validation, logging
└── utils/              ← Shared helpers
```

### Week-by-Week Context
Update this section as weeks progress:

**Week 1** — Fix bugs + Zod validation + `/analyze` endpoint (structured JSON output)
**Week 2** — Prompt engineering: few-shot, CoT, persona templates + `/test-prompt` harness
**Week 3** — Vercel AI SDK refactor + streaming (SSE) + `/playground` HTML page
**Week 4+** — Moves to Baat Cheet project (separate repo on Desktop)

## Commands
- `npm run dev` — starts dev server with hot reload on port 2402
- Server entry: `src/app.ts`

## Environment Variables (.env)
- `GROQ_API_KEY` — Groq API key
- `GROQ_API_URL` — `https://api.groq.com/openai/v1/chat/completions`
- `GEMINI_API_KEY` — Google Gemini API key
- `GEMINI_API_URL` — Gemini generateContent endpoint (includes key in URL)

## Interview Prep Reminders
When implementing a feature, always mention:
1. The concept name (e.g., "structured output", "few-shot prompting")
2. Why it matters in production
3. The tradeoffs vs alternatives
4. A likely interview question about it

## Key Principles
- Learn by BUILDING, not reading tutorials
- Understand raw APIs FIRST, then use abstractions (Vercel AI SDK in Week 3)
- Every endpoint should have: input validation (Zod) → processing → error handling → typed response
- Keep the `throw new error` and gemini bugs until Arush fixes them — don't silently fix known bugs
