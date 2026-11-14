import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Le site est publié sur https://<compte>.github.io/FORMA-8/ : toutes les URL sont relatives à /FORMA-8/.
export default defineConfig({
  base: "/FORMA-8/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        name: "FORMA-8 · Réveille l'équipe",
        short_name: "FORMA-8",
        description: "Apprends à créer tes applications avec l'IA : 11 membres d'équipe à réveiller.",
        lang: "fr",
        display: "standalone",
        orientation: "portrait",
        background_color: "#04060c",
        theme_color: "#04060c",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        // Les données privées (API GitHub) et l'API Claude ne sont jamais mises en cache par le service worker.
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
