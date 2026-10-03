import { MetaProvider } from "@solidjs/meta";
import { Route, Router, type RouteSectionProps } from "@solidjs/router";
import { Footer } from "~/components/footer";
import { Nav } from "~/components/nav";
import { HomePage } from "~/pages/home";
import { NotFoundPage } from "~/pages/not-found";
import { ProductsPage } from "~/pages/products";
import { WritingsPage } from "~/pages/writings";

/** Routes prerendered to static HTML at build time. */
export const routes = ["/", "/products", "/writings"];

function Layout(props: RouteSectionProps) {
  return (
    <>
      <Nav />
      {props.children}
      <Footer />
    </>
  );
}

export function App(props: { url?: string }) {
  return (
    <MetaProvider>
      <Router url={props.url} root={Layout}>
        <Route path="/" component={HomePage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/writings" component={WritingsPage} />
        <Route path="*404" component={NotFoundPage} />
      </Router>
    </MetaProvider>
  );
}
