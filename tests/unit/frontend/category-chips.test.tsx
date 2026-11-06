import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryChips } from "@/components/browse/category-chips";

const categories = [
  { slug: "arrows", name: "Arrows" },
  { slug: "weather", name: "Weather" },
];

describe("<CategoryChips />", () => {
  it("renders All plus every category", () => {
    render(<CategoryChips categories={categories} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arrows" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weather" })).toBeInTheDocument();
  });

  it("marks All as pressed when nothing is selected", () => {
    render(<CategoryChips categories={categories} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("marks the selected category as pressed", () => {
    render(<CategoryChips categories={categories} value="arrows" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Arrows" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the clicked category and clearing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryChips categories={categories} value="arrows" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Weather" }));
    expect(onChange).toHaveBeenLastCalledWith("weather");

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});