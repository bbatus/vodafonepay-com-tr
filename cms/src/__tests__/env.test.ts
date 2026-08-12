import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OLD_ENV = process.env;

const validEnv = {
  DATABASE_URI: "postgres://user:pass@host:5432/db",
  PAYLOAD_SECRET: "a-real-random-secret",
  REVALIDATE_SECRET: "another-real-secret",
};

async function loadEnv() {
  vi.resetModules();
  return import("@/env");
}

describe("env validation", () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("loads successfully with all required vars present (dev)", async () => {
    process.env = { ...process.env, ...validEnv, NODE_ENV: "development" };
    const { env } = await loadEnv();
    expect(env.PAYLOAD_SECRET).toBe("a-real-random-secret");
  });

  it("throws when DATABASE_URI is missing", async () => {
    process.env = { ...process.env, PAYLOAD_SECRET: "x", REVALIDATE_SECRET: "y", DATABASE_URI: undefined };
    await expect(loadEnv()).rejects.toThrow(/DATABASE_URI/);
  });

  it("throws when PAYLOAD_SECRET is missing", async () => {
    process.env = { ...process.env, DATABASE_URI: "postgres://x", REVALIDATE_SECRET: "y", PAYLOAD_SECRET: undefined };
    await expect(loadEnv()).rejects.toThrow(/PAYLOAD_SECRET/);
  });

  it("refuses to boot in production with the dev-placeholder PAYLOAD_SECRET", async () => {
    process.env = {
      ...process.env,
      ...validEnv,
      NODE_ENV: "production",
      PAYLOAD_SECRET: "dev-payload-secret-change-me",
      CMS_AUTO_LOGIN: undefined,
    };
    await expect(loadEnv()).rejects.toThrow(/PAYLOAD_SECRET is unset or still the dev placeholder/);
  });

  it("refuses to boot in production with the dev-placeholder REVALIDATE_SECRET", async () => {
    process.env = {
      ...process.env,
      ...validEnv,
      NODE_ENV: "production",
      REVALIDATE_SECRET: "dev-revalidate-secret",
      CMS_AUTO_LOGIN: undefined,
    };
    await expect(loadEnv()).rejects.toThrow(/REVALIDATE_SECRET is unset or still the dev placeholder/);
  });

  it("allows dev-placeholder secrets in production when CMS_AUTO_LOGIN is on (local review mode)", async () => {
    process.env = {
      ...process.env,
      ...validEnv,
      NODE_ENV: "production",
      PAYLOAD_SECRET: "dev-payload-secret-change-me",
      CMS_AUTO_LOGIN: "true",
    };
    const { env } = await loadEnv();
    expect(env.PAYLOAD_SECRET).toBe("dev-payload-secret-change-me");
  });

  it("allows a real secret in production with CMS_AUTO_LOGIN off", async () => {
    process.env = { ...process.env, ...validEnv, NODE_ENV: "production", CMS_AUTO_LOGIN: undefined };
    const { env } = await loadEnv();
    expect(env.PAYLOAD_SECRET).toBe("a-real-random-secret");
  });
});
