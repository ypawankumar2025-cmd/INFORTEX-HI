import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 8080,
    allowedHosts: ["terminal.local"],
    proxy: { "/api": "http://127.0.0.1:8081" },
  },
  build: { sourcemap: false },
});
