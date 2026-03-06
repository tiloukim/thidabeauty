"use client";

import { useState } from "react";
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

const ORDER_STEPS = [
  { key: "confirmed", label: "Confirmed", icon: "✓" },
  { key: "processing", label: "Processing", icon: "⚙" },
  { key: "shipped", label: "Shipped", icon: "📦" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

function getStepIndex(status: string) {
  if (status === "completed" || status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "processing") return 1;
  return 0; // confirmed / pending
}

export default function AccountClient({
  email,
  userId,
  orders,
  isAdmin,
}: {
  email: string;
  userId: string;
  orders: Order[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);

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

        {/* Admin Section */}
        {isAdmin && (
          <div className="account-section" style={{ background: "var(--deep)", border: "1px solid rgba(201,169,110,.25)" }}>
            <div className="account-admin-section">
              <div>
                <h2 style={{ color: "var(--gold)", marginBottom: 4 }}>✦ Admin</h2>
                <p style={{ fontSize: 12, color: "rgba(201,169,110,.5)", margin: 0 }}>
                  Manage products, orders, and users
                </p>
              </div>
              <Link
                href="/admin"
                style={{
                  background: "var(--gold)",
                  color: "var(--deep)",
                  textDecoration: "none",
                  padding: "10px 24px",
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontFamily: "'Jost',sans-serif",
                  borderRadius: 2,
                  transition: "all .2s",
                }}
              >
                Open Dashboard →
              </Link>
            </div>
          </div>
        )}

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
              {orders.map((order) => {
                const stepIdx = getStepIndex(order.status);
                const isTracking = trackingOrder === order.id;
                return (
                  <div
                    key={order.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      background: "white",
                      overflow: "hidden",
                    }}
                  >
                    {/* Order summary row */}
                    <div style={{ padding: 16 }}>
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
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>
                            ${order.total}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 12 }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setTrackingOrder(isTracking ? null : order.id)
                          }
                          style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            color: "var(--gold-dark)",
                            padding: "6px 14px",
                            fontSize: 10,
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "'Jost',sans-serif",
                            fontWeight: 600,
                            borderRadius: 4,
                            transition: "all .2s",
                          }}
                        >
                          {isTracking ? "Hide" : "Track Order"}
                        </button>
                      </div>
                    </div>

                    {/* Tracking panel */}
                    {isTracking && (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          padding: "20px 16px",
                          background: "var(--cream)",
                        }}
                      >
                        {/* Progress bar */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            position: "relative",
                            marginBottom: 8,
                          }}
                        >
                          {/* Line behind dots */}
                          <div
                            style={{
                              position: "absolute",
                              top: 14,
                              left: 14,
                              right: 14,
                              height: 3,
                              background: "rgba(201,169,110,.15)",
                              borderRadius: 2,
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              top: 14,
                              left: 14,
                              width: `${(stepIdx / (ORDER_STEPS.length - 1)) * (100 - 8)}%`,
                              height: 3,
                              background: "var(--gold)",
                              borderRadius: 2,
                              transition: "width .4s ease",
                            }}
                          />
                          {ORDER_STEPS.map((step, i) => (
                            <div
                              key={step.key}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 6,
                                position: "relative",
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background:
                                    i <= stepIdx ? "var(--gold)" : "white",
                                  border:
                                    i <= stepIdx
                                      ? "2px solid var(--gold)"
                                      : "2px solid rgba(201,169,110,.25)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  color:
                                    i <= stepIdx
                                      ? "var(--deep)"
                                      : "rgba(201,169,110,.35)",
                                  fontWeight: 700,
                                  zIndex: 1,
                                }}
                              >
                                {step.icon}
                              </div>
                              <span
                                style={{
                                  fontSize: 9,
                                  letterSpacing: 1,
                                  textTransform: "uppercase",
                                  color:
                                    i <= stepIdx
                                      ? "var(--gold-dark)"
                                      : "var(--muted)",
                                  fontWeight: i <= stepIdx ? 600 : 400,
                                  textAlign: "center",
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
