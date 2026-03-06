import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const country = req.headers.get("x-vercel-ip-country") || "unknown";
    const city = req.headers.get("x-vercel-ip-city") || "unknown";

    const body = await req.json().catch(() => ({}));
    const path = (body as { path?: string }).path || "/";

    const supabase = createServiceClient();
    await supabase.from("visitors").insert({
      ip,
      country,
      city,
      path,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
