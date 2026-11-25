import { access, stat } from "node:fs/promises";
import path from "node:path";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const modelPath = path.join(process.cwd(), "models", "Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf");
  try {
    await access(modelPath);
    const info = await stat(modelPath);
    return res.status(200).json({
      ok: true,
      modelFileFound: true,
      fileSizeMB: Number((info.size / 1024 / 1024).toFixed(1)),
      model: "Falcon-H1-Tiny-90M-Instruct Q4_K_M",
      loadedIntoMemory: false,
      note: "This endpoint checks whether the bundled model file is present. It does not load the model."
    });
  } catch {
    return res.status(500).json({
      ok: false,
      modelFileFound: false,
      error: "Model file is missing from the deployed Function bundle.",
      hint: "Check the Vercel build log and the functions.includeFiles setting."
    });
  }
}
