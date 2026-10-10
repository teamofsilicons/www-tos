import { generateHydrationScript, getAssets, renderToString } from "solid-js/web";
import { App } from "~/app";
import type { PageData } from "~/lib/writings";

/** Renders the app for a URL. Returns the head tags and the markup for `#app`. */
export function render(url: string, data?: PageData) {
  const html = renderToString(() => <App url={url} data={data} />);
  return { head: getAssets() + generateHydrationScript(), html };
}
