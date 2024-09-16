import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ["index.tsx", "global.d.ts"], insertTypesEntry: true }),
    libInjectCss(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "index.tsx"),
      name: "YourLibraryName",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "zod"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          zod: "Zod",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
