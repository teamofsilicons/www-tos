import { generateHydrationScript, getAssets, renderToString } from "solid-js/web";
import { App } from "./app";

export { routes } from "./app";

export function render(url: string) {
  const html = renderToString(() => <App url={url} />);
  return { head: getAssets() + generateHydrationScript(), html };
}
