import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap";

export default defineConfig({
  plugins: [
    react(),

    sitemap({
      hostname: "https://eduerp.uz",
    }),
  ],

  build: {
    sourcemap: false,
    minify: "esbuild",
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    open: true,
  },

  preview: {
    port: 4173,
  },
});