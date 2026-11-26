import { stat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../models/WebZHost-Vertex-15M-Q8_0.gguf', import.meta.url));
const info = await stat(file);
if (info.size < 10_000_000 || info.size > 25_000_000) {
  throw new Error(`Expected bundled WebZHost GGUF between 10 MB and 25 MB; got ${info.size} bytes.`);
}
const handle = await readFile(file);
if (handle.toString('ascii', 0, 4) !== 'GGUF') {
  throw new Error('Bundled model is not a valid GGUF file (bad magic header).');
}
console.log(`Bundled WebZHost GGUF verified: ${(info.size / 1048576).toFixed(2)} MiB.`);
