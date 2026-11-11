import { expect, test } from "@playwright/test";

test.describe("admin", () => {
  test("/admin leads to the login form", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/categories$/);
    await expect(page.getByLabel(/admin key/i)).toBeVisible();
  });

  test("rejects a wrong key", async ({ page }) => {
    await page.goto("/admin/categories");
    await page.getByLabel(/admin key/i).fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid admin key/i)).toBeVisible();
  });

  test("signs in and creates then deletes a category", async ({ page }) => {
    await page.goto("/admin/categories");
    await page.getByLabel(/admin key/i).fill("e2e-admin-key");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();

    const name = `E2E ${Date.now()}`;
    await page.getByLabel("New category name").fill(name);
        const created = page.waitForResponse(
      (res) =>
        res.url().endsWith("/api/categories") &&
        res.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Add category" }).click();
    expect((await created).status()).toBe(201);
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});