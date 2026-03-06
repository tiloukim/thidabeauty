import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();
  const {
    data: { users: authUsers },
  } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });

  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("*");

  const { data: orders } = await serviceClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

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

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, full_name, email, phone, is_admin } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Update auth user (email)
  if (email !== undefined) {
    const { error } = await serviceClient.auth.admin.updateUserById(userId, {
      email,
    });
    if (error) {
      return NextResponse.json(
        { error: `Email update failed: ${error.message}` },
        { status: 400 }
      );
    }
  }

  // Update profile (full_name, phone, is_admin)
  const profileUpdate: Record<string, unknown> = {};
  if (full_name !== undefined) profileUpdate.full_name = full_name || null;
  if (phone !== undefined) profileUpdate.phone = phone || null;
  if (is_admin !== undefined) profileUpdate.is_admin = is_admin;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await serviceClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);
    if (error) {
      return NextResponse.json(
        { error: `Profile update failed: ${error.message}` },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
