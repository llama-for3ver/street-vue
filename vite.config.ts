import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from 'vite-plugin-dts'


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.app.json' })],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "street-vue",
      formats: ["es"],
      fileName: "street-vue"
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },  
});
