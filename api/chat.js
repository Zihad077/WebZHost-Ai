import path from "node:path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

export const config = {
  maxDuration: 300
};

let modelPromise;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const llama = await getLlama();
      return await llama.loadModel({
        modelPath: path.join(
          process.cwd(),
          "models/Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf"
        ),
        gpuLayers: 0
      });
    })().catch(error => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "POST required"
    });
  }

  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Message required"
      });
    }

    const model = await loadModel();

    const context = await model.createContext({
      contextSize: 1024
    });

    const session = new LlamaChatSession({
      contextSequence: context.getSequence()
    });

    const answer = await session.prompt(
      `You are WebZHost AI. Answer only WebZHost questions.
       Reply in Bangla if the user writes Bangla.
       Otherwise reply in English.
       If unsure, say you don't know.
       User: ${message}`,
      { maxTokens: 120 }
    );

    await context.dispose();

    return res.status(200).json({
      ok: true,
      answer
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "AI processing failed",
      details: String(error?.stack || error).slice(0, 2000)
    });
  }
}
