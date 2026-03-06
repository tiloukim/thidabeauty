import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  // Verify caller is admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service client to list auth users (has emails)
  const serviceClient = createServiceClient();
  const {
    data: { users: authUsers },
  } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });

  // Fetch profiles
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("*");

  // Fetch all orders
  const { data: orders } = await serviceClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  // Merge auth users with profiles
  const profileMap = new Map(
    (profiles || []).map((p: Record<string, unknown>) => [p.id, p])
  );
  const ordersByUser = new Map<string, Record<string, unknown>[]>();
  for (const order of orders || []) {
    const list = ordersByUser.get(order.user_id) || [];
    list.push(order);
    ordersByUser.set(order.user_id, list);
  }

  const merged = (authUsers || []).map((u) => {
    const prof = (profileMap.get(u.id) || {}) as Record<string, unknown>;
    return {
      id: u.id,
      email: u.email || "",
      full_name: prof.full_name || null,
      phone: u.phone || prof.phone || null,
      is_admin: prof.is_admin || false,
      created_at: u.created_at,
      orders: ordersByUser.get(u.id) || [],
    };
  });

  return NextResponse.json(merged);
}
