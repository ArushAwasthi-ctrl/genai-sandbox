import express, { urlencoded } from "express";
import { callGroq } from "./groq.js";
const app = express();
const PORT = 2402;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Working");
});
app.post("/summary", async (req, res) => {
  const userprompt = req.body.userinput;
  const systemprompt = `You are a concise summary assistant.

Rules:
- Output ONLY the summary, nothing else
- Exactly 1-2 sentences, never more
- Be direct and factual — no introductions like "Here is a summary"
- Capture the key points, skip minor details
- Use simple, clear language`;
  const temperature = 0.7;
  const output = await callGroq({ userprompt, systemprompt, temperature });
  res.json({ summary: output });
});
app.listen(PORT, () => {
  console.log("server running on port " + PORT);
});
