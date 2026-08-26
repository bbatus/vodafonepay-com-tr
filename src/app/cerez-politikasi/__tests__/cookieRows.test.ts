import { describe, expect, it } from "vitest";
import { cookieRows } from "@/app/cerez-politikasi/cookieRows";

describe("cookieRows", () => {
  it("is a non-empty list of well-formed cookie disclosure rows", () => {
    expect(cookieRows.length).toBeGreaterThan(0);
    for (const row of cookieRows) {
      expect(row.name).toBeTruthy();
      expect(row.provider).toBeTruthy();
      expect(["Birinci taraf", "Üçüncü taraf"]).toContain(row.party);
    }
  });
});
