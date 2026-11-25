export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    service: "WebZHost AI",
    stage: "backend-test",
    modelConfigured: true,
    note: "Health check only. It does not prove that the model has loaded or generated a reply."
  });
}
