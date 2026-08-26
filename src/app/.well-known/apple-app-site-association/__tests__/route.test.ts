import { describe, expect, it } from "vitest";
import { GET } from "@/app/.well-known/apple-app-site-association/route";

describe("GET /.well-known/apple-app-site-association", () => {
  it("serves the applinks manifest as application/json", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toBe("application/json");

    const body = await res.json();
    expect(body.applinks.details[0].paths).toContain("/kampanyalar/*");
    expect(body.applinks.details[0].paths).toContain("NOT /admin/*");
    expect(body.webcredentials.apps).toEqual(body.applinks.details.map((d: { appID: string }) => d.appID));
  });
});
