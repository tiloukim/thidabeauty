import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tran_id, status } = body as {
      tran_id: string;
      status: number;
      apv?: string;
      merchant_ref_no?: string;
    };

    const supabase = createServiceClient();

    if (status === 0) {
      // Payment successful — update order status
      await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("payment_tran_id", tran_id);
    } else {
      // Payment failed
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("payment_tran_id", tran_id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
