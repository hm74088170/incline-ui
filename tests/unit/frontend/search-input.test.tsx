import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SearchInput } from "@/components/browse/search-input";

function Harness() {
  const [value, setValue] = useState("");
  return <SearchInput value={value} onChange={setValue} />;
}

const box = () => screen.getByRole("searchbox", { name: /search icons/i });

describe("<SearchInput />", () => {
  it("shows what the user types", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(box(), "arrow");
    expect(box()).toHaveValue("arrow");
  });

  it("has no clear button while empty", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
  });

  it("clears the text and focuses the input again", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(box(), "arrow");
    await user.click(screen.getByRole("button", { name: /clear search/i }));
    expect(box()).toHaveValue("");
    expect(box()).toHaveFocus();
  });
});