import { NextResponse } from "next/server";
import { helloResponseSchema } from "@/lib/schemas/hello";

export async function GET() {
  const body = helloResponseSchema.parse({
    ok: true,
    message: "API is running in the same Next.js app",
  });

  return NextResponse.json(body);
}
