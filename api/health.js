import { access, stat } from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET required' });
  const modelPath = path.join(process.cwd(), 'models', 'WebZHost-Vertex-15M-Q8_0.gguf');
  try {
    await access(modelPath);
    const info = await stat(modelPath);
    return res.status(200).json({ ok: true, service: 'WebZHost AI', modelFileFound: true, modelSizeMB: +(info.size / 1048576).toFixed(2), model: 'Vertex 0.6 15M Instruct Q8_0', knowledge: 'embedded verified source-code knowledge', runtime: 'node-llama-cpp CPU inference (not runtime-tested)' });
  } catch {
    return res.status(503).json({ ok: false, service: 'WebZHost AI', modelFileFound: false, error: 'GGUF model is missing. Add models/WebZHost-Vertex-15M-Q8_0.gguf or allow the Vercel build download.' });
  }
}
