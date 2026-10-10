import tailwindcss from "@tailwindcss/vite";
import { readFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";

/**
 * Renders /writings/* in `npm run dev` through the same handler the Vercel function uses, so
 * writers can preview posts against a local or the live writings API.
 */
function writingsDevServer(): Plugin {
  return {
    name: "tos:writings-dev-ssr",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl ?? req.url ?? "/";
        const pathname = url.split("?")[0];
        if (pathname !== "/writings" && !pathname.startsWith("/writings/")) return next();
        try {
          const index = await readFile(new URL("./index.html", import.meta.url), "utf8");
          // Link the stylesheet as well as importing it from the client entry, so the
          // server-rendered page is styled before the scripts run.
          const template = (await server.transformIndexHtml(url, index)).replace(
            "<!--app-head-->",
            '<link rel="stylesheet" href="/src/styles.css"><!--app-head-->',
          );
          const { handleNodeRequest } = await server.ssrLoadModule("/src/entry-server.tsx");
          await handleNodeRequest(req, res, template);
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ command, isSsrBuild }) => ({
  plugins: [solid({ ssr: true }), tailwindcss(), writingsDevServer()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // public/ belongs to the client build; the server build only needs code.
  build: { copyPublicDir: !isSsrBuild },
  ssr: {
    // The production server build is self-contained: it runs in the Vercel function, which has
    // no node_modules. In dev, bundle the Solid libraries so they resolve to the same server
    // build of solid-js as the app code.
    noExternal: command === "build" ? true : ["@solidjs/router", "@solidjs/meta"],
  },
}));
