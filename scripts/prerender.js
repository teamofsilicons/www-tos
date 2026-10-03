// Renders every route to static HTML after the client and server builds, so
// each page ships its markup and meta tags and the client only hydrates.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const serverDir = join(root, "dist-server");

const { render, routes } = await import(join(serverDir, "entry-server.js"));
const template = await readFile(join(dist, "index.html"), "utf8");

const pages = [...routes.map((path) => ({ path })), { path: "/404", file: "404.html" }];

for (const page of pages) {
  const { head, html } = render(page.path);
  const output = template.replace("<!--app-head-->", head).replace("<!--app-html-->", html);
  const file =
    page.file ?? (page.path === "/" ? "index.html" : join(page.path.slice(1), "index.html"));
  const target = join(dist, file);

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output);
  console.log(`prerendered ${page.path} → dist/${file}`);
}

await rm(serverDir, { recursive: true, force: true });
