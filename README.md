# WebZHost AI — On-device edition

This is a static website. AI inference runs inside each visitor’s browser using `@wllama/wllama` (llama.cpp compiled to WebAssembly). There is no `/api/chat`, no serverless inference function, no API key, and no AI inference server.

## Visitor flow
1. On opening the page, the visitor sees a consent prompt.
2. When they press **লোড করুন**, the browser downloads the ~16.6 MB GGUF model from the static site.
3. Wllama loads it in a browser worker and caches the model in browser storage where supported.
4. Prompts and answers are processed locally on the visitor’s device.

## Deploy
Upload this folder’s contents to the GitHub repository root and deploy to Vercel. Vercel only serves static files; it does not run an AI function. `public/models/WebZHost-Vertex-15M-Q8_0.gguf` must remain available at `/models/WebZHost-Vertex-15M-Q8_0.gguf`.

## Important limitations
- First load requires internet to fetch the static GGUF and Wllama WebAssembly runtime. Later loads can use the browser cache.
- Browser storage may be cleared by the user or the browser.
- Local inference speed depends on the phone/browser and may be slow on low-memory devices. Keep the page open while using the assistant.
- The bundled Vertex 15M model is extremely small and not fine-tuned; it can give weak general programming answers. WebZHost facts are answered from a local source-grounded knowledge base embedded in the page.
- No server-side model execution, API request, telemetry, or remote conversation storage is implemented.
- Wllama is loaded from jsDelivr CDN; its WASM runtime is fetched by the browser. This is a static library download, not an inference server.
