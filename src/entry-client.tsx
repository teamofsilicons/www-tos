import { hydrate, render } from "solid-js/web";
import { App } from "./app";
import { PAGE_DATA_ID } from "./lib/page-data";
import type { PageData } from "./lib/writings";
import "./styles.css";

const root = document.getElementById("app")!;

// Writings pages are rendered per request by src/server/writings.ts and carry the data they
// were rendered from.
function readPageData(): PageData | undefined {
  const script = document.getElementById(PAGE_DATA_ID);
  if (!script?.textContent) return undefined;
  try {
    return JSON.parse(script.textContent) as PageData;
  } catch {
    return undefined;
  }
}

const data = readPageData();

// Production pages are prerendered by scripts/prerender.js; the dev server serves the bare
// shell for them. Writings pages are server-rendered in both.
if (import.meta.env.DEV && !data) {
  render(() => <App />, root);
} else {
  try {
    hydrate(() => <App data={data} />, root);
  } catch (error) {
    if (data) {
      // The server markup is complete without JavaScript (and holds the post body, which
      // Solid cannot recreate), so keep it rather than rendering over it.
      console.warn("Hydration failed; keeping the server-rendered page.", error);
    } else {
      // Markup from a different route (a host's catch-all rewrite, say) cannot
      // hydrate; render this URL from scratch instead.
      console.warn("Hydration failed, rendering on the client.", error);
      root.textContent = "";
      render(() => <App />, root);
    }
  }
}
