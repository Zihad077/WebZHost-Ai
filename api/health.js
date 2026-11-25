export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    service: "WebZHost AI",
    stage: "huggingface-runtime-model",
    modelSource: "Hugging Face",
    modelConfigured: true,
    note: "Health check only. Use /api/model to verify the hosted model file and POST /api/chat to test inference."
  });
}
