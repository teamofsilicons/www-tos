// Entry point of the Vercel function that renders /writings/*. scripts/build-vercel.js copies
// it into .vercel/output/functions/_writings.func next to the server build and template.
import { readFileSync } from "node:fs";
import { handleNodeRequest } from "./server/entry-server.js";

const template = readFileSync(new URL("./template.html", import.meta.url), "utf8");

export default function handler(req, res) {
  return handleNodeRequest(req, res, template);
}
