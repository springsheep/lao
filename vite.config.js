import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import autoprefixer from "autoprefixer";
import postcssPxToViewport from "postcss-px-to-viewport";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  outputDir: "docs",
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        postcssPxToViewport({
          viewportWidth: 750,
          viewportHeight: 1334,
          unitPrecision: 5,
          viewportUnit: "vw",
          selectorBlackList: [".ignore", ".hairlines"],
          minPixelValue: 1,
          mediaQuery: false,
          exclude: [/node_modules/],
        }),
      ],
    },
  },
  base: "./",
  server: {
    port: 3000,
    open: true,
  },
});
