import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IconUploadForm } from "@/components/admin/icon-upload-form";
import type { Category } from "@/lib/api/types";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/components/admin/admin-provider", () => ({
  useAdmin: () => ({ status: "authed", key: "good-key", signIn: vi.fn(), signOut }),
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const makeCategory = (name: string, id: string): Category => ({
  id,
  name,
  slug: name.toLowerCase(),
  description: "",
  createdAt: "",
  updatedAt: "",
});

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
const svgFile = (name = "arrow-right.svg") =>
  new File([svg], name, { type: "image/svg+xml" });

let failNext: { status: number; code: string; message: string } | null;
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  failNext = null;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url, init) => {
    const method = init?.method ?? "GET";
    if (url === "/api/categories" && method === "GET") {
      return json({
        data: [makeCategory("Arrows", "c-arrows"), makeCategory("Actions", "c-actions")],
      });
    }
    if (url === "/api/icons" && method === "POST") {
      if (failNext) {
        const f = failNext;
        failNext = null;
        return json({ error: { code: f.code, message: f.message } }, f.status);
      }
      return json({ data: { slug: "arrow-right", name: "arrow right" } }, 201);
    }
    return json({ error: { code: "NOT_FOUND", message: "nope" } }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  // jsdom has no object URLs
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <IconUploadForm />
    </QueryClientProvider>,
  );
}

const submitButton = () => screen.getByRole("button", { name: /upload icon/i });

describe("<IconUploadForm />", () => {
  it("lists the categories in the dropdown", async () => {
    renderForm();
    expect(await screen.findByRole("option", { name: "Arrows" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Actions" })).toBeInTheDocument();
  });

  it("previews the chosen file and fills the name from the file name", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.upload(screen.getByLabelText("SVG file"), svgFile("arrow-right.svg"));

    const preview = await screen.findByRole("img", { name: /preview of arrow-right\.svg/i });
    expect(preview).toHaveAttribute("src", "blob:preview");
    expect(screen.getByLabelText("Name")).toHaveValue("arrow right");
  });

  it("rejects a file that is not an svg", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm();

    await user.upload(
      screen.getByLabelText("SVG file"),
      new File(["x"], "arrow.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/\.svg/i);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("only enables upload once there is a file, a name and a category", async () => {
    const user = userEvent.setup();
    renderForm();
    await screen.findByRole("option", { name: "Arrows" });
    expect(submitButton()).toBeDisabled();

    await user.upload(screen.getByLabelText("SVG file"), svgFile());
    await screen.findByRole("img");
    expect(submitButton()).toBeDisabled(); // no category yet

    await user.selectOptions(screen.getByLabelText("Category"), "Arrows");
    expect(submitButton()).toBeEnabled();
  });

  it("sends the file, name, category and tags with the admin key", async () => {
    const user = userEvent.setup();
    renderForm();
    await screen.findByRole("option", { name: "Arrows" });

    await user.upload(screen.getByLabelText("SVG file"), svgFile());
    await screen.findByRole("img");
    await user.selectOptions(screen.getByLabelText("Category"), "Arrows");
    await user.type(screen.getByLabelText("Tags"), "arrow, direction");
    await user.click(submitButton());

    await screen.findByText(/uploaded arrow right/i);
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(new Headers(call[1]?.headers).get("authorization")).toBe("Bearer good-key");
    const body = call[1]?.body as FormData;
    expect(body.get("name")).toBe("arrow right");
    expect(body.get("categoryId")).toBe("c-arrows");
    expect(body.get("tags")).toBe("arrow,direction");
    expect((body.get("file") as File).name).toBe("arrow-right.svg");
  });

  it("shows the server error when the upload fails", async () => {
    failNext = { status: 409, code: "CONFLICT", message: "Icon already exists" };
    const user = userEvent.setup();
    renderForm();
    await screen.findByRole("option", { name: "Arrows" });

    await user.upload(screen.getByLabelText("SVG file"), svgFile());
    await screen.findByRole("img");
    await user.selectOptions(screen.getByLabelText("Category"), "Arrows");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    // the form keeps what the admin typed so they can fix it
    expect(screen.getByLabelText("Name")).toHaveValue("arrow right");
  });

  it("clears the form after a successful upload", async () => {
    const user = userEvent.setup();
    renderForm();
    await screen.findByRole("option", { name: "Arrows" });

    await user.upload(screen.getByLabelText("SVG file"), svgFile());
    await screen.findByRole("img");
    await user.selectOptions(screen.getByLabelText("Category"), "Arrows");
    await user.click(submitButton());

    expect(await screen.findByRole("status")).toHaveTextContent(/uploaded arrow right/i);
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });
});