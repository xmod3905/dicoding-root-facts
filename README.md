# RootFacts

AI-powered plant & vegetable fun facts generator using your device camera.

> Dicoding submission for **Belajar Penerapan AI di Aplikasi Web**.

## Tech Stack

- **React 19** + **Vite** — UI & build tooling
- **TensorFlow.js** — in-browser object detection (plant/vegetable classification)
- **Hugging Face Transformers** — natural language generation for fun facts
- **PWA** (vite-plugin-pwa) — offline-capable Progressive Web App
- **Lucide React** — icons

## Getting Started

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build for production
npm run build

# preview production build
npm run preview
```

## How It Works

1. Open the app in a browser with camera access.
2. Point your camera at a plant or vegetable.
3. TensorFlow.js detects the object; Hugging Face generates fun facts about it.

---

Dicoding Academy — Belajar Penerapan AI di Aplikasi Web
