import { createClient } from "@/lib/supabase/server";
import TrackOrderClient from "./TrackOrderClient";

export default async function TrackOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orders: Array<{
    id: string;
    items: unknown;
    total: number;
    status: string;
    created_at: string;
  }> = [];

  if (user) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    orders = data ?? [];
  }

  return <TrackOrderClient loggedIn={!!user} orders={orders} />;
}
