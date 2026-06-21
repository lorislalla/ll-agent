import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4300",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "npm run dev -w server",
      url: "http://localhost:3333/api/health",
      reuseExistingServer: true,
      timeout: 30_000
    },
    {
      command: "npm run start -w client -- --proxy-config proxy.conf.json --port 4300",
      url: "http://localhost:4300",
      reuseExistingServer: true,
      timeout: 30_000
    }
  ]
})
