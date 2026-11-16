import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminGate } from "@/components/admin/admin-gate";

vi.mock("@/components/admin/admin-provider", () => ({
  useAdmin: () => ({ status: "authed", key: "k", signIn: vi.fn(), signOut: vi.fn() }),
}));

describe("<AdminGate /> navigation", () => {
  it("links to the categories and icons pages", () => {
    render(
      <AdminGate>
        <p>content</p>
      </AdminGate>,
    );

    const nav = screen.getByRole("navigation", { name: "Admin" });
    expect(within(nav).getByRole("link", { name: "Categories" })).toHaveAttribute(
      "href",
      "/admin/categories",
    );
    expect(within(nav).getByRole("link", { name: "Icons" })).toHaveAttribute(
      "href",
      "/admin/icons",
    );
  });
});