import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "@/components/browse/copy-button";

describe("<CopyButton />", () => {
  it("copies the text, says Copied, then goes back", async () => {
    const user = userEvent.setup();
    render(<CopyButton text="npx inclineui add arrow-left" label="Copy command" resetAfterMs={50} />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(await navigator.clipboard.readText()).toBe("npx inclineui add arrow-left");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy command" })).toBeInTheDocument(),
    );
  });

  it("reports when copying fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"));
    render(<CopyButton text="x" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("button", { name: /couldn't copy/i })).toBeInTheDocument();
  });
});