import { env } from "@/env";

export function parseAdminUserIds(value: string | undefined) {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}

export function isAdminUserId(userId: string, allowlist: readonly string[]) {
  return allowlist.includes(userId);
}

export function isAdminUser(userId: string) {
  return isAdminUserId(userId, parseAdminUserIds(env.ADMIN_USER_IDS));
}

/** Chat is admin-only until it is opened to every signed-in user. */
export function canUseAgentChat(userId: string) {
  return isAdminUser(userId);
}
