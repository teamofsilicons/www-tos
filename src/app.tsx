import { MetaProvider } from "@solidjs/meta";
import { Route, Router, useBeforeLeave, type RouteSectionProps } from "@solidjs/router";
import { Footer } from "~/components/footer";
import { Nav } from "~/components/nav";
import { PageDataContext } from "~/lib/page-data";
import { isWritingsPath, type PageData } from "~/lib/writings";
import { HomePage } from "~/pages/home";
import { NotFoundPage } from "~/pages/not-found";
import { ProductsPage } from "~/pages/products";
import { WritingAuthorPage } from "~/pages/writing-author";
import { WritingPostPage } from "~/pages/writing-post";
import { WritingsPage } from "~/pages/writings";

/**
 * Routes prerendered to static HTML at build time. `/writings/*` is rendered on request by
 * `src/server/writings.ts` instead.
 */
export const routes = ["/", "/products"];

/**
 * Writings pages are rendered on the server from API data, so moving into, out of or between
 * them is a full page load. Hash links within a page stay client-side.
 */
function useWritingsNavigation() {
  useBeforeLeave((event) => {
    if (typeof event.to !== "string") return;
    const here = window.location;
    const to = new URL(event.to, here.href);
    if (to.origin !== here.origin) return;
    if (to.pathname === here.pathname && to.search === here.search) return;
    if (isWritingsPath(to.pathname) || isWritingsPath(here.pathname)) {
      event.preventDefault();
      window.location.assign(to.href);
    }
  });
}

function Layout(props: RouteSectionProps) {
  useWritingsNavigation();
  return (
    <>
      <Nav />
      {props.children}
      <Footer />
    </>
  );
}

export function App(props: { url?: string; data?: PageData }) {
  return (
    <PageDataContext.Provider value={props.data}>
      <MetaProvider>
        <Router url={props.url} root={Layout}>
          <Route path="/" component={HomePage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/writings" component={WritingsPage} />
          <Route path="/writings/authors/:handle" component={WritingAuthorPage} />
          <Route path="/writings/:slug" component={WritingPostPage} />
          <Route path="*404" component={NotFoundPage} />
        </Router>
      </MetaProvider>
    </PageDataContext.Provider>
  );
}
