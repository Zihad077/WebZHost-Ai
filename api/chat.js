import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

export const config = { maxDuration: 300 };

const MODEL_URL = "https://huggingface.co/Zihad077/webzhost-ai-model/resolve/main/Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf";
const MODEL_NAME = "Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf";
const MODEL_PATH = path.join(os.tmpdir(), MODEL_NAME);
const MIN_MODEL_BYTES = 10 * 1024 * 1024;

let downloadPromise;
let modelPromise;
let knowledgePromise;

async function ensureModelFile() {
  try {
    const existing = await fsp.stat(MODEL_PATH);
    if (existing.size >= MIN_MODEL_BYTES) return;
  } catch {
    // The Vercel temporary filesystem may have been cleared between instances.
    downloadPromise = null;
  }

  if (!downloadPromise) {
    downloadPromise = (async () => {
      const partialPath = `${MODEL_PATH}.part`;
      await fsp.rm(partialPath, { force: true });
      const response = await fetch(MODEL_URL, {
        redirect: "follow",
        signal: AbortSignal.timeout(240000),
        headers: { "User-Agent": "WebZHost-AI/1.1" }
      });

      if (!response.ok || !response.body) {
        throw new Error(`Hugging Face model download failed: HTTP ${response.status}`);
      }

      try {
        await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(partialPath));
        const info = await fsp.stat(partialPath);
        if (info.size < MIN_MODEL_BYTES) {
          throw new Error(`Downloaded model is too small (${info.size} bytes). Check the Hugging Face repository and file.`);
        }
        await fsp.rename(partialPath, MODEL_PATH);
      } catch (error) {
        await fsp.rm(partialPath, { force: true }).catch(() => {});
        throw error;
      }
    })().catch(error => {
      downloadPromise = null;
      throw error;
    });
  }

  await downloadPromise;
}

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await ensureModelFile();
      const llama = await getLlama();
      return llama.loadModel({ modelPath: MODEL_PATH, gpuLayers: 0 });
    })().catch(error => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

async function getKnowledge() {
  if (!knowledgePromise) {
    knowledgePromise = fsp.readFile(path.join(process.cwd(), "data", "knowledge.json"), "utf8")
      .then(JSON.parse)
      .catch(() => ({ project: "WebZHost", website: "https://webzhost.vercel.app/", documentation: "https://webzhost.vercel.app/docs", facts: [] }));
  }
  return knowledgePromise;
}

function tokenize(value) {
  return String(value || "").toLowerCase().match(/[a-z0-9]+|[ঀ-৿]+/g) || [];
}

function retrieveFacts(message, facts) {
  const query = new Set(tokenize(message));
  if (!query.size) return [];
  return facts.map(fact => {
    const words = new Set(tokenize(`${fact.title} ${fact.content} ${(fact.keywords || []).join(" ")}`));
    let score = 0;
    for (const word of query) if (words.has(word)) score++;
    return { fact, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.fact);
}

function looksWebZHostRelated(message) {
  const text = String(message).toLowerCase();
  const terms = [
    "webzhost", "web z host", "hosting", "host website", "host a website",
    "deploy", "deployment", "project", "repository", "repo", "upload",
    "file manager", "api", "documentation", "docs", "vercel", "website hosting",
    "html", "static site", "domain", "build error", "runtime error"
  ];
  return terms.some(term => text.includes(term));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST required" });
  }

  const started = Date.now();
  let phase = "validation";
  let modelLoadMs = 0;
  let contextMs = 0;
  let inferenceMs = 0;
  let context;

  try {
    const message = req.body?.message;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ ok: false, error: "Please enter a message." });
    }
    if (message.length > 1200) {
      return res.status(413).json({ ok: false, error: "Message is too long. Maximum 1,200 characters." });
    }

    if (!looksWebZHostRelated(message)) {
      return res.status(200).json({
        ok: true,
        answer: "I can help only with WebZHost. Please ask about WebZHost, its documentation, project setup, hosting, uploads, or troubleshooting.\n\nআমি শুধু WebZHost বিষয়ে সাহায্য করতে পারি। WebZHost সম্পর্কিত প্রশ্ন করো।",
        timingsMs: { total: Date.now() - started },
        source: "scope-filter"
      });
    }

    const knowledge = await getKnowledge();
    const matchedFacts = retrieveFacts(message, knowledge.facts || []);
    const knowledgeText = matchedFacts.length
      ? matchedFacts.map((fact, index) => `${index + 1}. ${fact.title}: ${fact.content}`).join("\n")
      : "No directly matching verified knowledge was found. Do not invent product details; state the limitation and point to official documentation.";

    phase = "model-download-and-load";
    let timer = Date.now();
    const model = await loadModel();
    modelLoadMs = Date.now() - timer;

    phase = "context-create";
    timer = Date.now();
    context = await model.createContext({ contextSize: 768 });
    contextMs = Date.now() - timer;

    phase = "inference";
    timer = Date.now();
    const session = new LlamaChatSession({ contextSequence: context.getSequence() });
    const answer = await session.prompt(
      `System: You are WebZHost AI, a concise support assistant. You must only help with WebZHost. Use only the verified notes below for factual claims. Never invent features, API syntax, limits, prices, or guarantees. If the notes do not answer the question, clearly say that you cannot verify it and direct the user to the official documentation. Reply in Bangla when the user writes Bangla; otherwise reply in English.

Verified WebZHost notes:
${knowledgeText}

Official website: ${knowledge.website}
Official documentation: ${knowledge.documentation}

User question: ${message.trim()}
Assistant:`,
      { maxTokens: 96 }
    );
    inferenceMs = Date.now() - timer;

    return res.status(200).json({
      ok: true,
      answer: String(answer || "I could not generate an answer. Please try again.").trim(),
      source: matchedFacts.length ? "knowledge-assisted-model" : "model-with-documentation-fallback",
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
      error: "AI processing failed.",
      phase,
      timingsMs: {
        modelLoad: modelLoadMs,
        contextCreate: contextMs,
        inference: inferenceMs,
        total: Date.now() - started
      },
      details: String(error?.stack || error).slice(0, 1600)
    });
  } finally {
    if (context) await context.dispose().catch(() => {});
  }
}
