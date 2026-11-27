import { stat, readFile } from 'node:fs/promises';
const html = await stat(new URL('../public/index.html', import.meta.url));
const modelPath = new URL('../public/models/WebZHost-Vertex-15M-Q8_0.gguf', import.meta.url);
const info = await stat(modelPath);
const bytes = await readFile(modelPath);
if (bytes.toString('ascii', 0, 4) !== 'GGUF' || info.size < 10_000_000 || info.size > 25_000_000) throw new Error('Invalid GGUF model asset');
console.log(`Static site verified. HTML: ${html.size} bytes; GGUF: ${(info.size/1048576).toFixed(2)} MiB.`);
