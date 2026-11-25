import path from "node:path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import knowledge from "../data/knowledge.json" with { type: "json" };

const MODEL_PATH = path.join(process.cwd(), "models", "Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf");
let modelPromise;

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const llama = await getLlama();
      return await llama.loadModel({
        modelPath: MODEL_PATH,
        gpuLayers: 0
      });
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

function findKnowledge(question) {
  const terms = question.toLowerCase().match(/[a-z0-9\u0980-\u09ff]{2,}/g) || [];
  const scored = knowledge.facts.map((item) => {
    const haystack = `${item.title} ${item.content}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
    return { ...item, score };
  }).sort((a, b) => b.score - a.score);
  return scored.filter((item) => item.score > 0).slice(0, 3);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const question = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!question) return res.status(400).json({ error: "Write a question first." });
  if (question.length > 1200) return res.status(413).json({ error: "Question is too long (maximum 1200 characters)." });

  try {
    const model = await getModel();
    const context = await model.createContext({ contextSize: 1024 });
    const session = new LlamaChatSession({
      contextSequence: context.getSequence()
    });

    const relevant = findKnowledge(question);
    const facts = relevant.length
      ? relevant.map((item) => `- ${item.title}: ${item.content}`).join("\n")
      : "No matching WebZHost facts were found in the local knowledge file.";

    const isBangla = /[\u0980-\u09FF]/.test(question);
    const languageRule = isBangla
      ? "Reply in Bangla because the user wrote in Bangla."
      : "Reply in clear, simple English.";

    const prompt = [
      "You are WebZHost AI, a narrowly scoped support assistant.",
      "Only answer questions about WebZHost. Do not answer unrelated general questions.",
      "Use only the verified facts supplied below. Never invent features, API routes, prices, limits, or troubleshooting steps.",
      "If the supplied facts do not contain the answer, say that you do not have enough verified WebZHost information and point to https://webzhost.vercel.app/docs.",
      languageRule,
      "Keep the answer short and practical.",
      "",
      "VERIFIED WEBZHOST KNOWLEDGE:",
      facts,
      "",
      `USER QUESTION: ${question}`,
      "ANSWER:"
    ].join("\n");

    const answer = await session.prompt(prompt, { maxTokens: 160 });
    await context.dispose();
    return res.status(200).json({
      ok: true,
      answer: String(answer || "").trim(),
      language: isBangla ? "bn" : "en",
      model: "Falcon-H1-Tiny-90M-Instruct Q4_K_M"
    });
  } catch (error) {
    console.error("WebZHost AI inference error:", error);
    return res.status(503).json({
      ok: false,
      error: "The AI model could not start or generate a reply on this Vercel instance.",
      detail: String(error?.message || error).slice(0, 300),
      hint: "Check Vercel Runtime Logs. This is an experimental native-runtime deployment."
    });
  }
}
