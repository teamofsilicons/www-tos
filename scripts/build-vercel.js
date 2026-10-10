// Writes the Vercel Build Output API (v3) directory after `vite build` and the prerender:
//
//   .vercel/output/config.json             routes: static files first, /writings/* → function
//   .vercel/output/static/                 everything in dist/ (prerendered pages, assets)
//   .vercel/output/functions/_writings.func/
//     .vc-config.json, package.json        Node.js 22 function, ES modules
//     index.js                             scripts/vercel-function.js
//     server/                              dist-server: the self-contained SSR build
//     template.html                        the built index.html shell
//
// Vercel uses this directory as is when the build command produces it.
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, ".vercel", "output");
const serverDir = join(root, "dist-server");
const fn = join(output, "functions", "_writings.func");

const FUNCTION_PATH = "/_writings";

const config = {
  version: 3,
  routes: [
    {
      src: "^/sw\\.js$",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      continue: true,
    },
    {
      src: "^/assets/(.*)$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    { handle: "filesystem" },
    // Rendered on request and cached at the edge by the function's own headers. The original
    // path rides along in case the function sees the rewritten URL.
    { src: "^(/writings(?:/.*)?)$", dest: `${FUNCTION_PATH}?__path=$1` },
    { src: "^/.*$", dest: "/404.html", status: 404 },
  ],
};

await rm(output, { recursive: true, force: true });
await mkdir(fn, { recursive: true });

await cp(join(root, "dist"), join(output, "static"), { recursive: true });
await writeFile(join(output, "config.json"), `${JSON.stringify(config, null, 2)}\n`);

await cp(serverDir, join(fn, "server"), { recursive: true });
await rm(join(fn, "server", "template.html"));
await cp(join(serverDir, "template.html"), join(fn, "template.html"));
await cp(join(root, "scripts", "vercel-function.js"), join(fn, "index.js"));
await writeFile(join(fn, "package.json"), `${JSON.stringify({ type: "module" }, null, 2)}\n`);
await writeFile(
  join(fn, ".vc-config.json"),
  `${JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      maxDuration: 15,
    },
    null,
    2,
  )}\n`,
);

await rm(serverDir, { recursive: true, force: true });
console.log(`wrote ${output}`);
