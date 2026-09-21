import { canUseAgentChat, isAdminUserId, parseAdminUserIds } from "@/lib/agent/admin";

describe("parseAdminUserIds", () => {
  it("splits, trims, and dedupes Clerk ids", () => {
    expect(parseAdminUserIds(" user_a, user_b,user_a , ")).toEqual(["user_a", "user_b"]);
  });

  it("returns an empty list when unset", () => {
    expect(parseAdminUserIds(undefined)).toEqual([]);
    expect(parseAdminUserIds("")).toEqual([]);
  });
});

describe("isAdminUserId", () => {
  it("matches an allowlisted Clerk id", () => {
    expect(isAdminUserId("user_a", ["user_a", "user_b"])).toBe(true);
    expect(isAdminUserId("user_c", ["user_a"])).toBe(false);
  });
});

describe("canUseAgentChat", () => {
  it("stays off when no admin allowlist is configured", () => {
    expect(canUseAgentChat("user_a")).toBe(false);
  });
});
