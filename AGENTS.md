# www-tos

Marketing site for Team of Silicons, built with SolidJS + Vite + Tailwind CSS v4.

- `src/app.tsx` holds the router and the list of prerendered `routes`. A new page needs a route
  there and a component in `src/pages/`.
- `npm run build` does a client build, an SSR build of `src/entry-server.tsx`, then
  `scripts/prerender.js` writes static HTML for every route into `dist/`. The client hydrates
  that markup, so components must render the same thing on the server and in the browser: keep
  `window`/`document` access inside `onMount`.
- The 3D booklet (`src/lib/booklet-scene.ts`, three.js) is lazily imported by
  `src/components/booklet-section.tsx` so it stays out of the main bundle.
- Product data lives in `src/lib/products.ts`, logos in `public/logos/`. Writings are listed from
  `src/lib/writings.ts`.
- Deployed on Vercel from `main`; `vercel.json` sets the Vite preset and `dist` output.
