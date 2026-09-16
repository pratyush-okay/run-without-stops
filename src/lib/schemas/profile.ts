import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, "Use 3-24 letters, numbers, or underscores");

export const profileSchema = z.object({
  clerkId: z.string().min(1),
  username: usernameSchema.nullable(),
  email: z.email().nullable(),
  displayName: z.string().min(1).nullable(),
});

export const profileResponseSchema = profileSchema.extend({
  persisted: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
