const MODEL_URL = "https://huggingface.co/Zihad077/webzhost-ai-model/resolve/main/Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ ok: false, error: "GET required" });
  }

  try {
    const response = await fetch(MODEL_URL, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        modelAvailable: false,
        status: response.status,
        error: "Hugging Face could not provide the model file. Check that the repository and filename are correct and the repository is public."
      });
    }

    const length = Number(response.headers.get("content-length") || 0);
    return res.status(200).json({
      ok: true,
      modelAvailable: true,
      model: "Falcon-H1-Tiny-90M-Instruct Q4_K_M",
      repository: "Zihad077/webzhost-ai-model",
      file: "Falcon-H1-Tiny-90M-Instruct-Q4_K_M.gguf",
      fileSizeMB: length ? Number((length / 1024 / 1024).toFixed(1)) : null,
      storage: "Hugging Face (persistent source; Vercel caches a temporary copy per warm instance)",
      note: "This checks the hosted file only. It does not load the model or prove inference works."
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      modelAvailable: false,
      error: "Could not reach the Hugging Face model file.",
      details: String(error?.message || error).slice(0, 500)
    });
  }
}
