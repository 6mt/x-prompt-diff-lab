# Prompt Diff Lab

Local-first web tool for comparing two prompts and their model outputs side by side.

**@cue4j** · no accounts · no cloud sync · no API keys — paste outputs and diff.

## Features (Week 1 + Week 2)

- Dual-column **Prompt A / Prompt B** editors with char · word · line counts
- Text **diff** (lines / words / chars) with add/delete highlighting
- **Unified plain-text diff** copy (prompts + outputs)
- Side-by-side **Output A / Output B** paste areas
- Output diff + paragraph-level change notes
- One-click **PNG comparison card** (task blurb / prompt summary / output summary / timestamp)
- **localStorage** last 20 named sessions + draft auto-save
- JSON **export / import**
- Sample experiment one-click load (`?sample=1` or Sample button)
- No signup / paywall

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Optional sample via query:

```
http://localhost:5173/?sample=1
```

## Production build

```bash
npm run build
npm run preview
```

`dist/` is a static site you can host anywhere. This repo does not assume a public URL.

## Stack

- Vite + React + TypeScript
- [`diff`](https://www.npmjs.com/package/diff) for line/word/char diffs
- [`html-to-image`](https://www.npmjs.com/package/html-to-image) for PNG cards

## Notes

- Everything stays in the browser (`localStorage`).
- LLM calls are intentionally out of scope for MVP — paste completions yourself.
