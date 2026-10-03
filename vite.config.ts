import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid({ ssr: true }), tailwindcss()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  ssr: {
    // Bundle Solid libraries into the prerender build so they resolve to the
    // same server build of solid-js as the app code.
    noExternal: ["@solidjs/router", "@solidjs/meta"],
  },
});
