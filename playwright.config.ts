import { defineConfig, devices } from "@playwright/test";

// Tests de bout en bout : l'appli construite (dist/) est servie par « vite preview »,
// puis pilotée dans Chromium avec un écran d'iPhone.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173/FORMA-8/",
    ...devices["iPhone 13"],
    browserName: "chromium",
    trace: "off",
  },
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173/FORMA-8/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
