import { test, expect } from "@playwright/test";

/* Smoke E2E: flujos vitales contra Supabase real, con un usuario
   de prueba dedicado (cuenta aislada por RLS, no toca datos reales).
   El usuario debe existir y estar confirmado en Supabase Auth. */

const EMAIL = "e2e-test-sobres@mailinator.com";
const PASSWORD = "E2eSobres!2026";

test.beforeEach(async ({ page }) => {
  // saltar el tour de bienvenida (7 slides) en cada navegador fresco
  await page.addInitScript(() => localStorage.setItem("sobres_tour_done", "1"));
});

async function login(page) {
  await page.goto("/");
  await page.getByPlaceholder("tu@correo.com").fill(EMAIL);
  await page.getByPlaceholder("••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/* La primera vez que el usuario de prueba entra no tiene perfil
   y aparece el wizard; lo completamos con la plantilla Basico.
   Si ya tiene perfil, va directo a la vista semanal. */
async function completarOnboardingSiAparece(page) {
  const wizard = page.getByText("Como te llamas?");
  const app = page.getByText("Libreta de la semana");
  await expect(wizard.or(app)).toBeVisible({ timeout: 15_000 });
  if (!(await wizard.isVisible())) return; // ya tiene perfil
  await page.getByPlaceholder("Tu nombre").fill("E2E Test");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: /Basico/ }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
}

test("la pantalla de login carga", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sobres Semanales" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByText("No tengo cuenta — registrarme")).toBeVisible();
});

test("rechaza credenciales invalidas", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("tu@correo.com").fill("nadie@example.com");
  await page.getByPlaceholder("••••••").fill("clave-incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible({ timeout: 10_000 });
});

test("login → registrar gasto → aparece en libreta → borrarlo", async ({ page }) => {
  await login(page);
  await completarOnboardingSiAparece(page);

  // llegamos a la vista semanal
  await expect(page.getByText("Libreta de la semana")).toBeVisible({ timeout: 15_000 });

  // registrar un gasto con nota unica para identificarlo
  const nota = `E2E ${Date.now()}`;
  await page.locator(".md3-fab").click();
  await expect(page.getByRole("heading", { name: "Registrar gasto" })).toBeVisible();
  await page.getByPlaceholder("0.00").fill("123");
  await page.locator(".chip").first().click(); // primer sobre (auto-llena categoria)
  await page.getByPlaceholder("Walmart, tacos...").fill(nota);
  await page.getByRole("button", { name: "Guardar gasto" }).click();

  // el gasto aparece en la libreta (ida y vuelta a Supabase)
  const fila = page.locator(".md3-card", { hasText: nota });
  await expect(fila).toBeVisible({ timeout: 10_000 });
  await expect(fila).toContainText("123");

  // limpieza: borrarlo desde la UI (✕ pide confirmacion "Borrar?")
  await fila.getByText("✕").click();
  await fila.getByRole("button", { name: "Borrar?" }).click();
  await expect(fila).toHaveCount(0, { timeout: 10_000 });
});
