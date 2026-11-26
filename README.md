# WebZHost AI — Production Package

A compact WebZHost assistant package. The chat interface is one self-contained HTML file (HTML + CSS + browser JavaScript). The backend retrieves product facts from the supplied WebZHost 2.0 source archive and uses the bundled GGUF only for general programming questions.

## Included
- `public/index.html` — responsive chat UI, dark/light theme, local chat history.
- `api/chat.js` — identity guard, verified-source retrieval, deterministic answers, optional GGUF inference for general coding questions.
- `api/health.js` — model presence and size check.
- `models/WebZHost-Vertex-15M-Q8_0.gguf` — bundled 16.63 MB GGUF persona edition.
- `vercel.json`, `package.json` — Vercel configuration and runtime dependency.

## Knowledge coverage
Knowledge was extracted from the supplied `WebZHost 2.0` source ZIP and README. It covers:
- Vercel + Firebase Authentication + Firestore architecture.
- Telegram bot creation, text-message webhook flow, welcome/command/keyword/fallback replies and URL buttons.
- Project ZIP upload, built-in templates, file editor, export, health analysis and backups.
- Plan defaults, manual bKash/Nagad/Binance payments, grace period and admin tools.
- Upload/file/project limits and current execution-runtime limitation.

The supplied source says the execution server URL and secret are empty. Therefore this source build stores and analyzes project files but does not execute arbitrary Python/Node.js projects. The live `/docs` page content was not included in the source archive; newer live features and changed settings are not asserted as facts.

## Model limitations — important
The bundled model is Vertex 0.6 15M Instruct Q8_0 with a WebZHost persona/chat-template configuration. It is **not fine-tuned** on WebZHost documentation, and its weights were not retrained. The verified WebZHost answers are served from the source-grounded knowledge layer rather than trusting the tiny model to invent product details. The model itself is very small and weak at reasoning/coding; prompting cannot remove that limitation. Context remains 2048 tokens.

## Deploy to Vercel
1. Upload the contents of this folder to a GitHub repository root.
2. Import the repository into Vercel.
3. Use Node.js 20+ and allow the install/build to complete.
4. The build validates the bundled GGUF; it does not download a model.
5. Open `/api/health`. Confirm `modelFileFound: true`.
6. Test `/api/chat` with:
   - `Who are you?`
   - `What is WebZHost?`
   - `Can WebZHost run Python?`
   - `How do Telegram bot replies work?`
   - a general HTML/CSS/JavaScript question.

## API
- `GET /api/health`
- `POST /api/chat` with JSON `{ "message": "...", "history": [{"role":"user|assistant","content":"..."}] }`.

## Runtime note
`node-llama-cpp` uses native runtime components. Vercel deployment success and `/api/health` only confirm that the model file is present, not that native inference works in the serverless environment. Test an actual general-code prompt after deployment. If native inference fails, WebZHost-specific answers still work through the deterministic verified knowledge layer; general-code generation will return an error until a compatible inference runtime is provided.
