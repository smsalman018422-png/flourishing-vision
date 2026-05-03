import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "tiptap";
          if (id.includes("@dnd-kit")) return "dnd";
          if (id.includes("lottie")) return "lottie";
          if (id.includes("gsap")) return "gsap";
        },
      },
    },
  },
});
