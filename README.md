# WebZHost AI — Vercel + Hugging Face

A small experimental WebZHost support chat. The GGUF model is hosted in the public Hugging Face repository and downloaded by the server into the Vercel Function's temporary `/tmp` storage when a warm instance needs it. Visitors do not download the model into their browsers.

## Updated architecture

- Model source: `Zihad077/webzhost-ai-model` on Hugging Face.
- Runtime: `node-llama-cpp` on a Vercel Node.js Function.
- Model cache: `/tmp` within a Function instance. It is **not permanent** and can be cleared when Vercel replaces the instance. Hugging Face remains the persistent source of truth.
- Knowledge: `data/knowledge.json`, containing only the verified basic project facts currently available.
- Diagnostics: `/api/health` checks the service; `/api/model` checks that Hugging Face can serve the model; neither proves inference. Test `/api/chat` with a POST request through the chat page.

## Deploy/update

1. Upload the contents of this project to the root of the GitHub repository, replacing the matching files.
2. Keep `package.json`, `vercel.json`, `api/`, `data/`, and `public/` in the repository root.
3. Delete the old `scripts/download-model.mjs` file and the `scripts/` folder if empty. No build-time model download is used.
4. In Vercel, redeploy the project.
5. Test, in order: `/api/health`, `/api/model`, then send a short question from `/`.

## Important limitations

- Vercel `/tmp` is temporary. A new/cold Function instance may download the model again. This project does not provide permanent model storage inside Vercel.
- The 90M-parameter model is very small and its Bangla ability and instruction-following are limited. Prompting and a small keyword-based knowledge retrieval step do not guarantee correct answers.
- The included knowledge file is deliberately conservative. It does not contain the full WebZHost documentation. Add verified facts from official documentation before expecting detailed support answers.
- The first request can be slow due to model download, native runtime startup, and model loading. Warm instances may reuse the model, but Vercel does not guarantee instance persistence.
- Vercel Hobby resource, execution-duration, bundle, and usage limits can change. Check the current Vercel plan documentation before relying on this as a public production service. A 300-second maximum is a ceiling, not a performance target.
- `node-llama-cpp` relies on native components. Validate the deployment on the actual Vercel runtime; local success alone is not proof of deployment success.
- Check the model's license and Hugging Face repository access before redistribution or commercial use.

## Endpoints

- `GET /api/health` — service status.
- `GET /api/model` — checks the Hugging Face model URL and reports its file size when available.
- `POST /api/chat` — JSON body: `{ "message": "your WebZHost question" }`.

## Embedding

Use the deployed URL of this project in an iframe on WebZHost, for example:

```html
<iframe src="https://YOUR-WEBZHOST-AI.vercel.app/" title="WebZHost AI" loading="lazy" style="width:100%;height:720px;border:0;border-radius:16px"></iframe>
```
