"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Order {
  id: string;
  items: unknown;
  total: number;
  status: string;
  created_at: string;
}

export default function AccountClient({
  email,
  userId,
  orders,
}: {
  email: string;
  userId: string;
  orders: Order[];
}) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Simple header */}
      <header>
        <div className="header-inner">
          <Link
            className="logo"
            href="/"
            style={{ display: "flex", alignItems: "center" }}
          >
            <span className="logo-main">ThidaBeauty</span>
            <span className="logo-khmer">ថីតាប្យូទី</span>
          </Link>
          <div className="header-actions">
            <Link
              href="/"
              style={{
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "var(--text)",
                textDecoration: "none",
              }}
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </header>

      <div className="account-page">
        <div className="account-header">
          <h1>My Account</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Manage your profile and view order history
          </p>
        </div>

        {/* Profile Section */}
        <div className="account-section">
          <h2>Profile</h2>
          <div className="account-info">
            <div className="account-info-row">
              <span>Email</span>
              <span>{email}</span>
            </div>
            <div className="account-info-row">
              <span>User ID</span>
              <span style={{ fontSize: 11, fontFamily: "monospace" }}>
                {userId.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="account-section">
          <h2>Order History</h2>
          {orders.length === 0 ? (
            <div className="order-empty">
              <p>No orders yet. Start shopping to see your order history!</p>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  color: "var(--gold)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Browse Products →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: 16,
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    background: "var(--cream)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: "var(--muted)",
                      }}
                    >
                      #{order.id.slice(0, 8)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        color:
                          order.status === "completed"
                            ? "var(--green)"
                            : "var(--gold)",
                        fontWeight: 600,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      ${order.total}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
