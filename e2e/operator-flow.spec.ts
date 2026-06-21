import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test("analizza, revisiona e ripristina una richiesta dallo storico", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://localhost:4300"
  })

  await page.getByRole("button", { name: /Problema tecnico urgente/ }).click()
  const requestText = await page.getByLabel("Richiesta cliente").inputValue()
  await page.getByLabel("Modalità analisi").selectOption("mock")
  await page.getByRole("button", { name: "Analizza" }).click()

  await expect(page.getByRole("heading", { name: "Risultato analisi" })).toBeVisible()
  await expect(page.getByText("Mock rules")).toBeVisible()
  await expect(page.getByText(/Confidenza stimata/)).toBeVisible()

  await page.getByLabel("Categoria").selectOption("Reclamo")
  await page.getByLabel("Urgenza").selectOption("Alta")
  await page.getByLabel("Bozza risposta modificabile").fill("Risposta revisionata dall'operatore.")
  await page.getByRole("button", { name: "Copia", exact: true }).click()
  await expect(page.getByRole("button", { name: "Copiata" })).toBeVisible()

  await page.getByRole("button", { name: "Nuova analisi" }).click()
  const savedItem = page.locator(".history-row").first()
  await expect(savedItem).toContainText("Reclamo")
  await expect(savedItem).toContainText("Urgenza alta")
  await savedItem.click()

  await expect(page.getByLabel("Richiesta cliente")).toHaveValue(requestText)
  await expect(page.getByLabel("Categoria")).toHaveValue("Reclamo")
  await expect(page.getByLabel("Urgenza")).toHaveValue("Alta")
  await expect(page.getByLabel("Bozza risposta modificabile")).toHaveValue("Risposta revisionata dall'operatore.")
})

test("segnala un file che supera il limite supportato", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "richiesta-troppo-lunga.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("a".repeat(8001))
  })

  await expect(page.getByRole("alert")).toContainText("Il file supera il limite di 8000 caratteri.")
  await expect(page.getByLabel("Richiesta cliente")).toHaveValue("")
})
