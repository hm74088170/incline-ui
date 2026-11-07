import { render, screen } from "@testing-library/react";
import { SvgPreview } from "@/components/browse/svg-preview";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';

describe("<SvgPreview />", () => {
  it("renders the svg inside a labelled box of the given size and color", () => {
    const { container } = render(
      <SvgPreview svg={svg} name="Arrow Left" size={64} color="#ff0000" />,
    );
    const box = screen.getByRole("img", { name: "Arrow Left" });
    expect(box).toHaveStyle({ width: "64px", height: "64px", color: "#ff0000" });
    expect(container.querySelector("svg path")).not.toBeNull();
  });

  it("inherits the text color when no color is given", () => {
    render(<SvgPreview svg={svg} name="Arrow Left" size={32} />);
    expect(screen.getByRole("img", { name: "Arrow Left" }).style.color).toBe("");
  });
});