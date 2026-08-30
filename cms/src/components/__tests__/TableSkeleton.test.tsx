// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { TableSkeleton } from "@/components/TableSkeleton";

describe("TableSkeleton", () => {
  it("renders one header cell and N row cells per requested column count", () => {
    const { container } = render(<TableSkeleton columns={4} rows={3} />);
    expect(container.querySelectorAll("thead th")).toHaveLength(4);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(container.querySelectorAll("tbody td")).toHaveLength(12);
  });

  it("defaults to 5 placeholder rows", () => {
    const { container } = render(<TableSkeleton columns={2} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  });

  it("is hidden from assistive tech — it carries no real information", () => {
    const { container } = render(<TableSkeleton columns={3} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
