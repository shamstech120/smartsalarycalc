# Salary Calculator UK

Static, calculator-first UK salary site. Design: "Sterling Ledger" (from the Stitch export).
Strategy: Phase 1 of the 70-page topical map. Only pages with real, distinct content are built.

```bash
npm test          # engine tests (hand-computed HMRC figures)
npm run check     # build + link / SEO / JSON-LD / template-junk checks over dist/
npm run build     # -> dist/   (set SITE_URL=https://yourdomain.com first)
npm run serve     # preview dist/ on http://localhost:4173
```

## How it fits together
- `src/engine.js` – the ONE calculation engine (tax, NI, student loan, pension, Scotland, tax codes). Runs in Node and the browser.
- `src/render.js` – shared HTML fragments, so pre-rendered pages and live results are identical.
- `src/calc.js` – browser behaviour only. `src/site.mjs` – layout, registry, widget. `src/pages.mjs` – page content.
- Salary pages just call the engine with a pre-filled salary; every number in the copy is computed, never typed.

## Adding a page (later phases)
1. Add its path to `LIVE`/`NAMES` in `src/site.mjs`. Links to unbuilt pages are dropped automatically.
2. Add a builder in `src/pages.mjs` and register it in `buildAll()`.
3. Give it unique data or intent. `npm run check` catches duplicate titles/descriptions.

## Yearly update (each April)
Edit `YEARS` in `src/engine.js` (thresholds, student loan plans, Scottish band widths), update the
hand-computed expectations in `tests/engine.test.mjs`, and sources listed on `/about/`.
