import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    // Rodar contra `next start` (build de produção) é o recomendado. Mesmo assim,
    // damos folga para a API/Next responderem sem gerar falsos negativos.
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 10000,
    video: true, // evidência da execução headless (cypress/videos)
    screenshotOnRunFailure: true,
    retries: 0, // sem retries: um teste instável deve aparecer como falha
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});
