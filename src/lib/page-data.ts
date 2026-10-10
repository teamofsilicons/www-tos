import { createContext, onMount, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import type { PageData } from "~/lib/writings";

/** Data the server fetched for this URL (writings routes only). */
export const PageDataContext = createContext<PageData | undefined>();

export const usePageData = () => useContext(PageDataContext);

/** The id of the `<script type="application/json">` that carries the page data. */
export const PAGE_DATA_ID = "tos-data";

/**
 * Writings pages only render from server data. If one is ever reached by client-side
 * navigation (no data, or data for another URL), load it from the server instead.
 */
export function useServerData<R extends PageData["route"]>(
  routes: R[],
): Extract<PageData, { route: R }> | undefined {
  const data = usePageData();
  const matches = (current: PageData | undefined) =>
    !!current &&
    (routes as string[]).includes(current.route) &&
    (isServer || samePath(current.path, window.location.pathname));

  onMount(() => {
    if (matches(data)) return;
    const key = `tos-reload:${window.location.pathname}`;
    try {
      // One reload per path per tab, so a mismatch can never loop.
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    window.location.reload();
  });

  return matches(data) ? (data as Extract<PageData, { route: R }>) : undefined;
}

function samePath(a: string, b: string) {
  try {
    return decodeURIComponent(a) === decodeURIComponent(b);
  } catch {
    return a === b;
  }
}
