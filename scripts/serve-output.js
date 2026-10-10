// Serves .vercel/output locally, roughly as Vercel would: config.json routes in order, static
// files at `handle: filesystem` (with directory index.html), and route destinations that name a
// function invoke it with the rewritten URL. For checking a build, not for production.
//
//   npm run build && PORT=4321 WRITINGS_API_URL=http://127.0.0.1:8080 npm run serve:output
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const output = fileURLToPath(new URL("../.vercel/output/", import.meta.url));
const config = JSON.parse(readFileSync(join(output, "config.json"), "utf8"));
const port = Number(process.env.PORT ?? 4321);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function staticFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  const base = normalize(join(output, "static", decoded));
  if (!base.startsWith(join(output, "static"))) return undefined;
  for (const candidate of [base, join(base, "index.html")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

const functions = new Map();
async function loadFunction(pathname) {
  const dir = join(output, "functions", `${pathname.replace(/^\//, "")}.func`);
  if (!existsSync(dir)) return undefined;
  if (!functions.has(dir)) {
    const vc = JSON.parse(readFileSync(join(dir, ".vc-config.json"), "utf8"));
    const mod = await import(pathToFileURL(join(dir, vc.handler)).href);
    functions.set(dir, mod.default);
  }
  return functions.get(dir);
}

function sendFile(res, file, status, headers) {
  res.writeHead(status, { "Content-Type": types[extname(file)] ?? "application/octet-stream", ...headers });
  createReadStream(file).pipe(res);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const headers = {};
  try {
    for (const route of config.routes) {
      if (route.handle === "filesystem") {
        const file = staticFile(url.pathname);
        if (file) return sendFile(res, file, 200, headers);
        const handler = await loadFunction(url.pathname);
        if (handler) return await handler(req, res);
        continue;
      }
      if (route.handle) continue;
      const match = new RegExp(route.src).exec(url.pathname);
      if (!match) continue;
      Object.assign(headers, route.headers ?? {});
      if (route.continue) continue;
      if (route.dest) {
        const dest = new URL(route.dest.replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? ""), "http://localhost");
        for (const [key, value] of url.searchParams) dest.searchParams.append(key, value);
        const handler = await loadFunction(dest.pathname);
        if (handler) {
          // The worst case for the function: it only sees the rewritten URL.
          req.url = dest.pathname + dest.search;
          for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
          return await handler(req, res);
        }
        const file = staticFile(dest.pathname);
        if (file) return sendFile(res, file, route.status ?? 200, headers);
      }
      if (route.status) {
        res.writeHead(route.status, headers);
        return res.end();
      }
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error\n");
  }
}).listen(port, () => console.log(`serving .vercel/output on http://localhost:${port}`));
