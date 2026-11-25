# WebZHost AI — experimental Vercel project

This is a **proof-of-concept**, not a verified production AI service.

## What it does

- Serves a small chat page from `public/index.html`.
- Provides `/api/health` and `/api/model` diagnostics.
- Attempts server-side inference using `node-llama-cpp`.
- Downloads the 58.6 MB Falcon-H1-Tiny-90M-Instruct Q4_K_M GGUF during the Vercel build, so visitors do not download the model into their browser.
- Uses a tiny local JSON knowledge file and refuses unrelated questions by instruction.

## Important limitations

1. The selected model is only 90M parameters and is English-focused. Bangla response quality is not guaranteed.
2. `node-llama-cpp` uses native binaries. A Vercel deployment can fail if its Linux binary, native dependencies, or model bundle are not traced correctly.
3. A successful `/api/health` response does **not** prove that inference works. Test `/api/model`, then `/api/chat`.
4. The model is downloaded during build and included in the Function bundle. Vercel Hobby has a 100 MB static upload limit and a 250 MB Function bundle limit; this project relies on the model being included in the Function, not uploaded as a static asset. Confirm the actual deployment output and build logs.
5. Vercel Hobby is intended for personal, non-commercial use. It includes limited active CPU time. A public AI endpoint can exhaust the included quota or become slow under concurrent use.
6. The in-memory model cache is per serverless instance, not shared across all instances. Cold starts may reload the model.
7. The starter knowledge file contains only a few safe facts. Add verified WebZHost documentation before relying on it for support.
8. Review the Falcon-LLM license before redistribution or commercial use.

## Deploy from a phone

1. Create a new GitHub repository named `WebZHost-AI`.
2. Upload **all files and folders from this project ZIP** to the repository root. Do not upload the outer ZIP folder as a nested directory.
3. In Vercel, choose **Add New → Project**, import `WebZHost-AI`, and keep the defaults.
4. Set the Node.js version to 20 or newer if prompted. No environment variables are required.
5. Deploy. The build script downloads the model from Hugging Face. This requires network access during the build.
6. Open these URLs on the deployed domain:
   - `/api/health`
   - `/api/model`
   - `/`
7. Only if both diagnostics pass, test a short question in the chat. Check Vercel Runtime Logs if it fails.

## Connecting from WebZHost

After the separate AI site works, use its deployed URL in an iframe, for example:

```html
<iframe
  src="https://YOUR-WEBZHOST-AI.vercel.app/"
  title="WebZHost AI"
  loading="lazy"
  style="width:100%;height:720px;border:0;border-radius:16px"
></iframe>
```

Replace the example domain with your real Vercel deployment URL.

## Model source

Falcon-H1-Tiny-90M-Instruct GGUF, Q4_K_M:
https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF

The model is not included in this ZIP; Vercel downloads it during the build.
