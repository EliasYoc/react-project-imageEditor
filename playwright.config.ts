import { defineConfig, devices } from "@playwright/test";

/** Puerto propio: no se confunde con un `npm run preview` que ya esté abierto. */
const PORT = 4180;

/**
 * Tests de punta a punta (e2e) con Playwright, en un navegador real.
 *
 * Se prueba el build de producción (el mismo que se publica, con el service
 * worker de la PWA), en escritorio y en un móvil con pantalla táctil.
 *
 * Se usa el Microsoft Edge instalado en el equipo (`channel: "msedge"`):
 * no hace falta descargar navegadores con `playwright install`.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "msedge",
    locale: "es-ES",
    // Si un test falla, se guarda la traza (capturas, DOM y red de cada paso)
    // para verla con `npx playwright show-trace`.
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "escritorio",
      use: {
        ...devices["Desktop Edge"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "móvil",
      use: {
        ...devices["Pixel 7"],
        channel: "msedge",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Siempre un build nuevo: nunca se prueba uno viejo por error.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
