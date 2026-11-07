import { render, screen } from "@testing-library/react";
import { CodeBlock } from "@/components/browse/code-block";

describe("<CodeBlock />", () => {
  it("shows the file name, the code and a copy button", () => {
    const code = "export function ArrowLeft() {\n  return null;\n}";
    const { container } = render(<CodeBlock title="icons/arrow-left.tsx" code={code} />);

    expect(screen.getByText("icons/arrow-left.tsx")).toBeInTheDocument();
    expect(container.querySelector("code")?.textContent).toBe(code);
    expect(screen.getByRole("button", { name: /copy code/i })).toBeInTheDocument();
  });
});