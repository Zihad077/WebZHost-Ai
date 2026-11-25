import path from "node:path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

export const config = {
maxDuration: 300
};

let modelPromise;

async function loadModel() {
if (!modelPromise) {
modelPromise = (async () => {
const modelPath = path.join(
process.cwd(),
"models/Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf"
);

  const llama = await getLlama();

  return await llama.loadModel({
    modelPath,
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

const started = Date.now();
let phase = "validation";
let modelLoadMs = 0;
let contextMs = 0;
let inferenceMs = 0;
let context;

try {
const message = req.body?.message;

if (!message || typeof message !== "string") {
  return res.status(400).json({
    ok: false,
    error: "Message required"
  });
}

phase = "model-load";
let timer = Date.now();
const model = await loadModel();
modelLoadMs = Date.now() - timer;

phase = "context-create";
timer = Date.now();

context = await model.createContext({
  contextSize: 512
});

contextMs = Date.now() - timer;

phase = "inference";
timer = Date.now();

const session = new LlamaChatSession({
  contextSequence: context.getSequence()
});

const answer = await session.prompt(
  `You are WebZHost AI.

Answer only questions about WebZHost.
Reply in Bangla when the user writes Bangla.
Otherwise reply in English.
Be concise and factual.
If you do not know, say so.
User: ${message}`,
{ maxTokens: 64 }
);

inferenceMs = Date.now() - timer;

return res.status(200).json({
  ok: true,
  answer,
  timingsMs: {
    modelLoad: modelLoadMs,
    contextCreate: contextMs,
    inference: inferenceMs,
    total: Date.now() - started
  }
});

} catch (error) {
return res.status(500).json({
ok: false,
error: "AI processing failed",
phase,
timingsMs: {
modelLoad: modelLoadMs,
contextCreate: contextMs,
inference: inferenceMs,
total: Date.now() - started
},
details: String(error?.stack || error).slice(0, 2000)
});

} finally {
if (context) {
await context.dispose().catch(() => {});
}
}
}
