import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/Button";

describe("<Button />", () => {
  it("renders its label", () => {
    render(<Button>Install</Button>);
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Install</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});