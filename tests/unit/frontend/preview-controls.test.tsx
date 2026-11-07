import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewControls } from "@/components/browse/preview-controls";

const setup = (props: Partial<Parameters<typeof PreviewControls>[0]> = {}) => {
  const onSizeChange = vi.fn();
  const onColorChange = vi.fn();
  render(
    <PreviewControls
      size={48}
      onSizeChange={onSizeChange}
      onColorChange={onColorChange}
      {...props}
    />,
  );
  return { onSizeChange, onColorChange };
};

describe("<PreviewControls />", () => {
  it("shows the current size and reports changes as numbers", () => {
    const { onSizeChange } = setup();
    expect(screen.getByText("48px")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: "Size" }), { target: { value: "96" } });
    expect(onSizeChange).toHaveBeenCalledWith(96);
  });

  it("reports a preset color and the default (undefined)", async () => {
    const user = userEvent.setup();
    const { onColorChange } = setup({ color: "#ef4444" });

    await user.click(screen.getByRole("button", { name: "Blue" }));
    expect(onColorChange).toHaveBeenLastCalledWith("#3b82f6");

    await user.click(screen.getByRole("button", { name: "Default" }));
    expect(onColorChange).toHaveBeenLastCalledWith(undefined);
  });

  it("marks the current color as pressed", () => {
    setup({ color: "#ef4444" });
    expect(screen.getByRole("button", { name: "Red" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Default" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports a custom color", () => {
    const { onColorChange } = setup();
    fireEvent.change(screen.getByLabelText("Custom color"), { target: { value: "#00ff00" } });
    expect(onColorChange).toHaveBeenCalledWith("#00ff00");
  });
});