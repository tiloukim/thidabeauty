import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== "string" || orderId.trim().length < 6) {
      return NextResponse.json(
        { error: "Please enter a valid order ID" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, items, total, status, created_at")
      .eq("id", orderId.trim())
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found. Please check the ID and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
