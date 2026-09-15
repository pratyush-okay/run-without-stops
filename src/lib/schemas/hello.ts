import { z } from "zod";

export const helloResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string().min(1),
});

export type HelloResponse = z.infer<typeof helloResponseSchema>;
