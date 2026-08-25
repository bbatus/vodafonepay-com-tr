import { describe, expect, it } from "vitest";
import { buildCef, eventToCef } from "@/lib/cef";

describe("eventToCef", () => {
  it("produces a spec-shaped CEF:Version|Vendor|Product|Version|SigID|Name|Severity|Extension line", () => {
    const line = eventToCef({
      createdAt: "2026-08-24T12:00:00.000Z",
      userEmail: "test-nv-maker@vodafonepay.local",
      userRole: "new_vertical_maker",
      action: "publish",
      collectionSlug: "campaigns",
      documentId: "18",
      summary: 'campaigns: "Yaz Kampanyası" yayınlandı',
      ip: "192.168.65.1",
    });

    const [prefix, extension] = line.split(/\|(?=[^|]*$)/); // split on the LAST pipe, since summary/msg can't contain one (escaped) but the header fields are pipe-delimited
    expect(prefix).toBe("CEF:0|VodafonePay|CMS|1.0|publish|Record Published|3");
    expect(extension).toContain("suser=test-nv-maker@vodafonepay.local");
    expect(extension).toContain("src=192.168.65.1");
    expect(extension).toContain("act=publish");
    expect(extension).toContain("cs2Label=Collection cs2=campaigns");
    expect(extension).toContain("cs3Label=DocumentId cs3=18");
    expect(extension).toMatch(/msg=campaigns: "Yaz Kampanyası" yayınlandı/);
  });

  it("maps a denied attempt to a higher severity than a routine login", () => {
    const denied = eventToCef({ action: "denied" });
    const login = eventToCef({ action: "login" });
    const severityOf = (line: string) => Number(line.split("|")[6]);
    expect(severityOf(denied)).toBeGreaterThan(severityOf(login));
  });

  it("escapes backslashes and equals signs in extension values (pipes are fine unescaped there)", () => {
    const line = eventToCef({ action: "update", summary: 'field=value with a | pipe and a \\ backslash' });
    // CEF extension key=value pairs only need \, =, and \n escaped — a bare
    // "|" is unambiguous there since extension fields are space-delimited,
    // not pipe-delimited (only the header portion is).
    expect(line).toContain("msg=field\\=value with a | pipe and a \\\\ backslash");
  });

  it("falls back to the raw action string and severity 1 for an unrecognized action", () => {
    const line = eventToCef({ action: "some_future_action" });
    const [, , , , sigId, name, severity] = line.split("|");
    expect(sigId).toBe("some_future_action");
    expect(name).toBe("some_future_action");
    expect(severity).toBe("1");
  });

  it("omits extension keys for absent optional fields instead of emitting empty values", () => {
    const line = eventToCef({ action: "login" });
    expect(line).not.toContain("suser=");
    expect(line).not.toContain("src=");
    expect(line).not.toContain("msg=");
  });
});

describe("buildCef", () => {
  it("joins multiple events with newlines, one event per line", () => {
    const output = buildCef([{ action: "login" }, { action: "logout" }]);
    const lines = output.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("|login|");
    expect(lines[1]).toContain("|logout|");
  });

  it("returns an empty string for zero events", () => {
    expect(buildCef([])).toBe("");
  });
});
