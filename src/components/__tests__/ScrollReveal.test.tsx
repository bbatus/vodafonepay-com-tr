import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ScrollReveal } from "@/components/ScrollReveal";

describe("ScrollReveal", () => {
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let capturedCallback: IntersectionObserverCallback | null;

  beforeEach(() => {
    observe = vi.fn();
    disconnect = vi.fn();
    capturedCallback = null;
    // Arrow functions can't be used with `new`, so this needs a real
    // function/class — vi.fn(arrowFn) would fail with "is not a constructor".
    class FakeIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        capturedCallback = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts hidden and observes its own element", () => {
    render(
      <ScrollReveal>
        <p>İçerik</p>
      </ScrollReveal>
    );
    expect(screen.getByText("İçerik").parentElement?.className).toContain("opacity-0");
    expect(observe).toHaveBeenCalledTimes(1);
  });

  it("reveals and stops observing once the element intersects", () => {
    render(
      <ScrollReveal>
        <p>İçerik</p>
      </ScrollReveal>
    );
    const wrapper = screen.getByText("İçerik").parentElement as HTMLElement;

    act(() => {
      capturedCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(wrapper.className).toContain("opacity-100");
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("stays hidden when the entry has not intersected yet", () => {
    render(
      <ScrollReveal>
        <p>İçerik</p>
      </ScrollReveal>
    );
    const wrapper = screen.getByText("İçerik").parentElement as HTMLElement;

    capturedCallback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(wrapper.className).toContain("opacity-0");
    expect(disconnect).not.toHaveBeenCalled();
  });
});
