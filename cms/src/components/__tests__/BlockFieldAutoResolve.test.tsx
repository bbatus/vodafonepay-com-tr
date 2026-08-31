// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import BlockFieldAutoResolve from "@/components/BlockFieldAutoResolve";

/**
 * Covers the actual failure mode this works around (see the component's own
 * doc comment / payloadcms/payload#9567): a block added via "+ Layout Ekle"
 * sometimes renders with none of its own fields until a FULL form-state
 * refetch happens. `reset(getData())` is that refetch — these tests are
 * about exactly when it does and doesn't fire.
 */

let rowCount = 0;
const mockGetData = vi.fn(() => ({ layout: [] }));
const mockReset = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useForm: () => ({ getData: mockGetData, reset: mockReset }),
  useFormFields: (selector: (args: [Record<string, { rows?: unknown[] }>]) => unknown) =>
    selector([{ layout: { rows: Array.from({ length: rowCount }) } }]),
}));

beforeEach(() => {
  vi.useFakeTimers();
  rowCount = 0;
  mockGetData.mockClear();
  mockReset.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BlockFieldAutoResolve", () => {
  it("does nothing on initial mount, even with existing rows", () => {
    rowCount = 3;
    render(<BlockFieldAutoResolve path="layout" />);
    vi.advanceTimersByTime(1000);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("refetches form state ~600ms after a row is added, seeded with the form's own current data", () => {
    const { rerender } = render(<BlockFieldAutoResolve path="layout" />);
    rowCount = 1;
    rerender(<BlockFieldAutoResolve path="layout" />);
    expect(mockReset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(599);
    expect(mockReset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(mockGetData).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalledWith({ layout: [] });
  });

  it("does not refetch when a row is removed", () => {
    rowCount = 2;
    const { rerender } = render(<BlockFieldAutoResolve path="layout" />);
    rowCount = 1;
    rerender(<BlockFieldAutoResolve path="layout" />);
    vi.advanceTimersByTime(1000);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("does not refetch on reorder (row count unchanged)", () => {
    rowCount = 2;
    const { rerender } = render(<BlockFieldAutoResolve path="layout" />);
    rerender(<BlockFieldAutoResolve path="layout" />);
    vi.advanceTimersByTime(1000);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("cancels a pending refetch if the row is removed again before the delay elapses", () => {
    const { rerender } = render(<BlockFieldAutoResolve path="layout" />);
    rowCount = 1;
    rerender(<BlockFieldAutoResolve path="layout" />);
    vi.advanceTimersByTime(300);
    rowCount = 0;
    rerender(<BlockFieldAutoResolve path="layout" />);
    vi.advanceTimersByTime(1000);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("renders nothing", () => {
    const { container } = render(<BlockFieldAutoResolve path="layout" />);
    expect(container).toBeEmptyDOMElement();
  });
});
