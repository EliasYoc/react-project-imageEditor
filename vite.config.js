import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA: se puede instalar y funciona sin conexión.
    VitePWA({
      // La versión nueva se descarga en segundo plano y ESPERA a que se cierren
      // las pestañas de la app: se usa al volver a abrirla. Nunca recarga una
      // pestaña abierta (el dibujo vive en memoria y se perdería).
      registerType: "prompt",
      // Un script pequeño (registerSW.js) registra el service worker: no hace
      // falta meter workbox-window en el bundle de la app.
      injectRegister: "script-defer",
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Editor de imágenes",
        short_name: "Editor",
        description:
          "Dibuja, escribe y añade fondos a tus fotos, en el navegador y sin conexión.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#111111",
        background_color: "#111111",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // La app entera (incluido el editor) queda en caché al instalarse el
        // service worker: después funciona sin conexión.
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // Las fuentes (17 familias, ~1,4 MB) no se precargan: cada una se
        // guarda la primera vez que se usa (o al abrir la lista de fuentes,
        // que las carga todas) y a partir de ahí también va sin conexión.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "fuentes",
              expiration: { maxEntries: 80 },
            },
          },
        ],
        // Las rutas de la app sin conexión responden con index.html.
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    // Se publica desde "build/" (igual que con Create React App); vercel.json
    // le indica a Vercel esta carpeta con "outputDirectory".
    outDir: "build",
  },
  test: {
    // Solo los tests unitarios: los e2e (carpeta e2e/) son de Playwright.
    include: ["src/**/*.test.{js,jsx,ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
  },
});
