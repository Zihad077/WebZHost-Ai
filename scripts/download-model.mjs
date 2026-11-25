import { mkdir, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const modelDir = new URL("../models/", import.meta.url);
const modelPath = new URL("../models/Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf", import.meta.url);
const modelUrl = "https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF/resolve/main/Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf";

await mkdir(modelDir, { recursive: true });

try {
  const existing = await stat(modelPath);
  if (existing.size > 10_000_000) {
    console.log(`Model already present (${(existing.size / 1024 / 1024).toFixed(1)} MB).`);
    process.exit(0);
  }
} catch {}

console.log("Downloading the GGUF model during the Vercel build...");
const response = await fetch(modelUrl, { redirect: "follow" });
if (!response.ok || !response.body) {
  throw new Error(`Model download failed: HTTP ${response.status}`);
}
const total = Number(response.headers.get("content-length") || 0);
console.log(`Download started${total ? ` (${(total / 1024 / 1024).toFixed(1)} MB)` : ""}.`);
await pipeline(Readable.fromWeb(response.body), createWriteStream(modelPath));
const result = await stat(modelPath);
if (result.size < 10_000_000) {
  throw new Error("Downloaded model is unexpectedly small; refusing to continue.");
}
console.log(`Model downloaded: ${(result.size / 1024 / 1024).toFixed(1)} MB.`);
