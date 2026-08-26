import "@testing-library/jest-dom/vitest";

// jsdom has no IntersectionObserver — components like ScrollReveal need one
// to exist globally even in tests that don't care about scroll-reveal
// behavior itself. Individual tests can still vi.stubGlobal their own.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver = NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
