import { NextResponse } from "next/server";
import { fetchBestRoute } from "@/lib/routing";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { routeRequestSchema, routeResponseSchema } from "@/lib/schemas/route";

export async function POST(request: Request) {
  const parsed = routeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Add at least a start and finish point" }),
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(routeResponseSchema.parse(await fetchBestRoute(parsed.data)));
  } catch {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "A running route could not be calculated" }),
      { status: 502 },
    );
  }
}
