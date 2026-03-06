"use client";

import { useState } from "react";
import Link from "next/link";

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
  return 0;
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const stepIdx = getStepIndex(order.status);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "white",
        overflow: "hidden",
      }}
    >
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
                order.status === "completed" ? "var(--green)" : "var(--gold)",
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
            <span
              style={{ fontSize: 12, color: "var(--muted)", marginLeft: 12 }}
            >
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
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
            {expanded ? "Hide" : "Track Order"}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "20px 16px",
            background: "var(--cream)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              position: "relative",
              marginBottom: 8,
            }}
          >
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
                    background: i <= stepIdx ? "var(--gold)" : "white",
                    border:
                      i <= stepIdx
                        ? "2px solid var(--gold)"
                        : "2px solid rgba(201,169,110,.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color:
                      i <= stepIdx ? "var(--deep)" : "rgba(201,169,110,.35)",
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
                      i <= stepIdx ? "var(--gold-dark)" : "var(--muted)",
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
}

export default function TrackOrderClient({
  loggedIn,
  orders,
}: {
  loggedIn: boolean;
  orders: Order[];
}) {
  const [orderId, setOrderId] = useState("");
  const [lookedUpOrder, setLookedUpOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLookedUpOrder(null);
    setLoading(true);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setLookedUpOrder(data.order);
      }
    } catch {
      setError("Failed to look up order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <header>
        <div className="header-inner">
          <Link
            className="logo"
            href="/"
            style={{ display: "flex", alignItems: "center" }}
          >
            <span className="logo-main">ThidaBeauty</span>
            <span className="logo-khmer">{"\u1790\u17B8\u178F\u17B6\u1794\u17D2\u1799\u17BC\u1791\u17B8"}</span>
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
              &larr; Back to Store
            </Link>
          </div>
        </div>
      </header>

      <div className="account-page">
        <div className="account-header">
          <h1>Track Your Order</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {loggedIn
              ? "View the status of your recent orders"
              : "Enter your order ID to check the status"}
          </p>
        </div>

        {/* Guest lookup form */}
        {!loggedIn && (
          <div className="account-section">
            <h2>Look Up Order</h2>
            <form onSubmit={handleLookup}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your order ID"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "monospace",
                    background: "white",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !orderId.trim()}
                  style={{
                    background: "var(--gold)",
                    color: "var(--deep)",
                    border: "none",
                    padding: "10px 24px",
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    fontFamily: "'Jost',sans-serif",
                    borderRadius: 4,
                    cursor: loading ? "wait" : "pointer",
                    opacity: loading || !orderId.trim() ? 0.6 : 1,
                    transition: "all .2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {loading ? "Looking up..." : "Track"}
                </button>
              </div>
              {error && (
                <p style={{ color: "var(--rose)", fontSize: 12, margin: 0 }}>
                  {error}
                </p>
              )}
            </form>

            {lookedUpOrder && (
              <div style={{ marginTop: 16 }}>
                <OrderCard order={lookedUpOrder} />
              </div>
            )}
          </div>
        )}

        {/* Logged-in user orders */}
        {loggedIn && (
          <div className="account-section">
            <h2>Your Orders</h2>
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
                  Browse Products &rarr;
                </Link>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Login prompt for guests */}
        {!loggedIn && (
          <div
            className="account-section"
            style={{ textAlign: "center", padding: "24px 16px" }}
          >
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
              Have an account? Sign in to see all your orders.
            </p>
            <Link
              href="/login"
              style={{
                color: "var(--gold)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Sign In &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
