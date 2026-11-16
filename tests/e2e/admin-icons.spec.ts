import { expect, test, type Page } from "@playwright/test";

const ADMIN_KEY = "e2e-admin-key";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await page.getByLabel(/admin key/i).fill(ADMIN_KEY);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("admin icons", () => {
  test("the Icons link opens the icons page", async ({ page }) => {
    await signIn(page, "/admin/categories");
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();

    await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Icons" }).click();

    await expect(page).toHaveURL(/\/admin\/icons$/);
    await expect(page.getByRole("heading", { name: "Icons", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /all icons/i })).toBeVisible();
  });

  test("choosing an svg shows a preview and needs a category before upload", async ({
    page,
    request,
  }) => {
    const categoryName = `E2E Cat ${Date.now()}`;
    const created = await request.post("/api/categories", {
      headers: { authorization: `Bearer ${ADMIN_KEY}` },
      data: { name: categoryName },
    });
    expect(created.status()).toBe(201);
    const { data } = await created.json();

    try {
      await signIn(page, "/admin/icons");
      await expect(page.getByRole("heading", { name: "Icons", exact: true })).toBeVisible();

      await page.getByLabel("SVG file").setInputFiles({
        name: "e2e-arrow.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(svg),
      });

      await expect(page.getByRole("img", { name: /preview of e2e-arrow\.svg/i })).toBeVisible();
      await expect(page.getByLabel("Name", { exact: true })).toHaveValue("e2e arrow");
      const upload = page.getByRole("button", { name: "Upload icon" });
      await expect(upload).toBeDisabled();

      await page.getByLabel("Category").selectOption({ label: categoryName });
      await expect(upload).toBeEnabled();
    } finally {
      await request.delete(`/api/categories/${data.id}`, {
        headers: { authorization: `Bearer ${ADMIN_KEY}` },
      });
    }
  });

  test("rejects a file that is not an svg", async ({ page }) => {
    await signIn(page, "/admin/icons");
    await expect(page.getByRole("heading", { name: "Icons", exact: true })).toBeVisible();

    await page.getByLabel("SVG file").setInputFiles({
      name: "arrow.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an svg"),
    });

    await expect(page.getByText(/choose a \.svg file/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload icon" })).toBeDisabled();
  });
});