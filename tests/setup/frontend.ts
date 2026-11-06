import "@testing-library/jest-dom/vitest";

vi.mock("next/link", async () => {
  const React = await import("react");
  type Props = {
    href: string;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    [key: string]: unknown;
  };
  return {
    default: ({ href, children, onClick, ...rest }: Props) =>
      React.createElement(
        "a",
        {
          href,
          ...rest,
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            onClick?.(e);
          },
        },
        children,
      ),
  };
});