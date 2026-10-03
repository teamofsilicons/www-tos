import { hydrate, render } from "solid-js/web";
import { App } from "./app";
import "./styles.css";

const root = document.getElementById("app")!;

// Production pages are prerendered by scripts/prerender.js; the dev server
// serves the bare shell.
if (import.meta.env.DEV) {
  render(() => <App />, root);
} else {
  try {
    hydrate(() => <App />, root);
  } catch (error) {
    // Markup from a different route (a host's catch-all rewrite, say) cannot
    // hydrate; render this URL from scratch instead.
    console.warn("Hydration failed, rendering on the client.", error);
    root.textContent = "";
    render(() => <App />, root);
  }
}
