import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "object",
    ssr: false,
    ssrManifest: false,
    rollupOptions: {
      input: {
        chat: "chat.html",
        standalone: "standalone.html",
      },
    },
  },
});
