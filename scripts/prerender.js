// Renders the static routes to HTML after the client and server builds, so each page ships
// its markup and meta tags and the client only hydrates. Writings pages are rendered per
// request instead (src/server/writings.ts); they get the untouched template.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const serverDir = join(root, "dist-server");

const { render, routes } = await import(join(serverDir, "entry-server.js"));
const template = await readFile(join(dist, "index.html"), "utf8");

// dist/index.html becomes the home page below; keep the shell for the server renderer.
await writeFile(join(serverDir, "template.html"), template);

const pages = [...routes.map((path) => ({ path })), { path: "/404", file: "404.html" }];

for (const page of pages) {
  const { head, html } = render(page.path);
  const output = template.replace("<!--app-head-->", () => head).replace("<!--app-html-->", () => html);
  const file =
    page.file ?? (page.path === "/" ? "index.html" : join(page.path.slice(1), "index.html"));
  const target = join(dist, file);

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output);
  console.log(`prerendered ${page.path} → dist/${file}`);
}
