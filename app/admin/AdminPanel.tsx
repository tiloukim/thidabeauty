"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: number;
  name_en: string;
  name_kh: string | null;
  brand: string | null;
  category: string;
  price: number;
  sale_price: number | null;
  badge: string | null;
  emoji: string | null;
  stock: number;
  image_url: string | null;
}

interface Order {
  id: string;
  user_id: string;
  items: unknown;
  total: number;
  status: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  is_admin: boolean;
  created_at: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  orders?: Order[];
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  orders: Order[];
}

type Tab = "dashboard" | "products" | "orders" | "users";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Product form state
  const [nameEn, setNameEn] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("skincare");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [badge, setBadge] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", is_admin: false });
  const [editSaving, setEditSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    revenue: 0,
  });

  const catEmojis: Record<string, string> = {
    skincare: "🌿",
    makeup: "💄",
    fragrance: "🌸",
    hair: "💆",
    body: "🧴",
    tools: "🖌️",
  };

  const loadProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
  }, []);

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
  }, []);

  const loadAdminUsers = useCallback(async () => {
    if (usersLoaded) return;
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
        setUsersLoaded(true);
      }
    } catch {
      // silently fail
    }
  }, [usersLoaded]);

  const startEditUser = (user: AdminUser) => {
    setEditingUser(user.id);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      is_admin: user.is_admin,
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  const saveUser = async (userId: string) => {
    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...editForm }),
      });
      if (res.ok) {
        setAdminUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, full_name: editForm.full_name || null, email: editForm.email, phone: editForm.phone || null, is_admin: editForm.is_admin }
              : u
          )
        );
        setEditingUser(null);
        setMessage("User updated successfully!");
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Error: Failed to update user");
    }
    setEditSaving(false);
  };

  const loadAll = useCallback(async () => {
    const supabase = createClient();

    const [prodRes, orderRes, userRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);

    const prods = prodRes.data || [];
    const ords = orderRes.data || [];
    const usrs = userRes.data || [];

    setProducts(prods);
    setOrders(ords);
    setUsers(usrs);

    setStats({
      totalProducts: prods.length,
      totalUsers: usrs.length,
      totalOrders: ords.length,
      revenue: ords.reduce((sum: number, o: Order) => sum + (o.total || 0), 0),
    });

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  useEffect(() => {
    if (activeTab === "users") loadAdminUsers();
  }, [activeTab, loadAdminUsers]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !price) {
      setMessage("Please fill product name & price");
      return;
    }
    setLoading(true);

    // Upload image first if a file was selected
    let finalImageUrl = imageUrl || null;
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(`Error: ${data.error}`);
          setLoading(false);
          return;
        }
        finalImageUrl = data.url;
      } catch {
        setMessage("Error: Image upload failed");
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();
    const { error } = await supabase.from("products").insert({
      name_en: nameEn,
      name_kh: nameKh || null,
      brand: brand || null,
      category,
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      badge: badge || null,
      emoji: catEmojis[category] || "✦",
      stock: parseInt(stock) || 0,
      image_url: finalImageUrl,
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Product added successfully!");
      setNameEn("");
      setNameKh("");
      setBrand("");
      setPrice("");
      setSalePrice("");
      setBadge("");
      setStock("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview(null);
      loadProducts();
    }
    setLoading(false);
  };

  const deleteProduct = async (id: number) => {
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "products", label: "Products", icon: "🛍️" },
    { key: "orders", label: "Orders", icon: "📦" },
    { key: "users", label: "Users", icon: "👥" },
  ];

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: "🛍️", color: "var(--gold)" },
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "var(--blue)" },
    { label: "Total Orders", value: stats.totalOrders, icon: "📦", color: "var(--green)" },
    { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: "💰", color: "var(--rose)" },
  ];

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(201,169,110,.45)",
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--gold-light)",
  };

  return (
    <div style={{ background: "var(--deep)", minHeight: "100vh" }}>
      <div className="admin-wrapper">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">
              ✦ Admin Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "rgba(201,169,110,.5)" }}>
              Manage your store
            </p>
          </div>
          <Link
            href="/"
            style={{
              color: "var(--gold-light)",
              textDecoration: "none",
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              border: "1px solid rgba(201,169,110,.3)",
              padding: "8px 20px",
              borderRadius: 2,
            }}
          >
            ← Back to Store
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--gold)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--gold)" : "rgba(201,169,110,.4)",
                padding: "12px 24px",
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Jost',sans-serif",
                fontWeight: activeTab === tab.key ? 600 : 400,
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message banner */}
        {message && (
          <div
            style={{
              background: message.startsWith("Error")
                ? "rgba(212,135,122,.2)"
                : "rgba(76,175,125,.2)",
              border: `1px solid ${message.startsWith("Error") ? "var(--rose)" : "var(--green)"}`,
              color: message.startsWith("Error") ? "var(--rose)" : "var(--green)",
              padding: "12px 16px",
              borderRadius: 4,
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {message}
          </div>
        )}

        {/* ═══ DASHBOARD TAB ═══ */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats Cards */}
            <div className="admin-stats">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(201,169,110,.15)",
                    borderRadius: 6,
                    padding: "24px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: "rgba(201,169,110,.08)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        color: "rgba(201,169,110,.5)",
                        marginBottom: 4,
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: 28,
                        color: card.color,
                        fontWeight: 500,
                      }}
                    >
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h3
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 22,
                color: "var(--gold)",
                marginBottom: 16,
              }}
            >
              Quick Actions
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <button
                onClick={() => setActiveTab("products")}
                style={{
                  background: "var(--gold)",
                  color: "var(--deep)",
                  border: "none",
                  padding: "12px 24px",
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Jost',sans-serif",
                  borderRadius: 2,
                  transition: "all .2s",
                }}
              >
                ✦ Add Product
              </button>
              <Link
                href="/"
                style={{
                  color: "var(--gold-light)",
                  textDecoration: "none",
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  border: "1px solid rgba(201,169,110,.3)",
                  padding: "12px 24px",
                  borderRadius: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "'Jost',sans-serif",
                }}
              >
                View Store
              </Link>
            </div>

            {/* Recent Orders */}
            <h3
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 22,
                color: "var(--gold)",
                marginBottom: 16,
              }}
            >
              Recent Orders
            </h3>
            {orders.length === 0 ? (
              <p style={{ color: "rgba(201,169,110,.4)", fontSize: 13, marginBottom: 40 }}>
                No orders yet.
              </p>
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(201,169,110,.12)",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 40,
                }}
              >
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="admin-dash-order-row"
                  >
                    <span style={{ fontSize: 13, color: "var(--gold-light)", fontFamily: "monospace" }}>
                      #{order.id.slice(0, 8)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: 2,
                        background: order.status === "completed" ? "rgba(76,175,125,.15)" : "rgba(201,169,110,.15)",
                        color: order.status === "completed" ? "var(--green)" : "var(--gold)",
                      }}
                    >
                      {order.status}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--gold)", fontWeight: 600 }}>
                      ${order.total?.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(201,169,110,.4)" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PRODUCTS TAB ═══ */}
        {activeTab === "products" && (
          <div>
            <div className="admin-panel" style={{ display: "block" }}>
              <h2>
                ✦ <span>Add New Product</span>
              </h2>
              <p className="sub">Fill in the product details below</p>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Product Name (English)</label>
                    <input
                      type="text"
                      placeholder="e.g. Glow Serum"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Product Name (Khmer)</label>
                    <input
                      type="text"
                      placeholder="e.g. សេរ៉ូមមនោហរ"
                      value={nameKh}
                      onChange={(e) => setNameKh(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. La Mer"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="skincare">Skincare</option>
                      <option value="makeup">Makeup</option>
                      <option value="fragrance">Fragrance</option>
                      <option value="hair">Hair</option>
                      <option value="body">Body</option>
                      <option value="tools">Tools</option>
                    </select>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Price (USD)</label>
                    <div className="price-row">
                      <div className="price-prefix">$</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Sale Price (optional)</label>
                    <div className="price-row">
                      <div className="price-prefix">$</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Badge</label>
                    <select value={badge} onChange={(e) => setBadge(e.target.value)}>
                      <option value="">None</option>
                      <option value="new">New</option>
                      <option value="sale">Sale</option>
                      <option value="bestseller">Best Seller</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Stock</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Product Image</label>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: imagePreview ? 8 : "28px 16px",
                        border: "2px dashed rgba(201,169,110,.3)",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "rgba(255,255,255,.03)",
                        transition: "border-color .2s",
                      }}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 180,
                            borderRadius: 4,
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <>
                          <span style={{ fontSize: 28, opacity: 0.5 }}>📷</span>
                          <span style={{ fontSize: 12, color: "rgba(201,169,110,.5)", textTransform: "none", letterSpacing: 0 }}>
                            Tap to upload or take a photo
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        style={{
                          marginTop: 8,
                          background: "none",
                          border: "1px solid rgba(212,135,122,.4)",
                          color: "var(--rose)",
                          padding: "4px 12px",
                          fontSize: 10,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          cursor: "pointer",
                          fontFamily: "'Jost',sans-serif",
                          borderRadius: 2,
                        }}
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="add-product-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Adding..."
                    : "✦ Add Product to Store / បន្ថែមផលិតផល"}
                </button>
              </form>
            </div>

            {/* Product List */}
            <div style={{ marginTop: 48 }}>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 28,
                  color: "var(--gold)",
                  marginBottom: 24,
                }}
              >
                Existing Products ({products.length})
              </h2>
              {products.length === 0 ? (
                <p style={{ color: "rgba(201,169,110,.5)", fontSize: 14 }}>
                  No products in database yet. Add your first product above.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 20,
                  }}
                >
                  {products.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(201,169,110,.15)",
                        padding: 20,
                        borderRadius: 4,
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
                            fontSize: 10,
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: "var(--gold)",
                          }}
                        >
                          {p.brand || "No brand"}
                        </span>
                        {p.badge && (
                          <span
                            style={{
                              fontSize: 9,
                              background: "rgba(201,169,110,.2)",
                              color: "var(--gold)",
                              padding: "2px 8px",
                              borderRadius: 2,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: 18,
                          color: "var(--gold-light)",
                          marginBottom: 4,
                        }}
                      >
                        {p.emoji} {p.name_en}
                      </div>
                      {p.name_kh && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(201,169,110,.4)",
                            marginBottom: 8,
                          }}
                        >
                          {p.name_kh}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "var(--gold)",
                            }}
                          >
                            ${p.price}
                          </span>
                          {p.sale_price && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--rose)",
                                marginLeft: 8,
                              }}
                            >
                              Sale: ${p.sale_price}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(201,169,110,.4)",
                          }}
                        >
                          Stock: {p.stock}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        style={{
                          marginTop: 12,
                          background: "none",
                          border: "1px solid rgba(212,135,122,.4)",
                          color: "var(--rose)",
                          padding: "6px 14px",
                          fontSize: 10,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                          cursor: "pointer",
                          fontFamily: "'Jost',sans-serif",
                          borderRadius: 2,
                          width: "100%",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ORDERS TAB ═══ */}
        {activeTab === "orders" && (
          <div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 28,
                color: "var(--gold)",
                marginBottom: 24,
              }}
            >
              All Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p style={{ color: "rgba(201,169,110,.4)", fontSize: 14 }}>
                No orders yet.
              </p>
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(201,169,110,.12)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {/* Table Header */}
                <div
                  className="admin-orders-table-header"
                  style={{
                    borderBottom: "1px solid rgba(201,169,110,.15)",
                    fontSize: 10,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "rgba(201,169,110,.5)",
                  }}
                >
                  <span>Order ID</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span>Total</span>
                  <span>Date</span>
                </div>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="admin-orders-table-row"
                    style={{ borderBottom: "1px solid rgba(201,169,110,.06)" }}
                  >
                    <span style={{ fontSize: 13, color: "var(--gold-light)", fontFamily: "monospace" }}>
                      #{order.id.slice(0, 8)}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(201,169,110,.5)", fontFamily: "monospace" }}>
                      {order.user_id?.slice(0, 8)}...
                    </span>
                    <span>
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          padding: "3px 10px",
                          borderRadius: 2,
                          background: order.status === "completed" ? "rgba(76,175,125,.15)" : "rgba(201,169,110,.15)",
                          color: order.status === "completed" ? "var(--green)" : "var(--gold)",
                        }}
                      >
                        {order.status}
                      </span>
                    </span>
                    <span style={{ fontSize: 14, color: "var(--gold)", fontWeight: 600 }}>
                      ${order.total?.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(201,169,110,.4)" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {activeTab === "users" && (
          <div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 28,
                color: "var(--gold)",
                marginBottom: 24,
              }}
            >
              Registered Users ({adminUsers.length})
            </h2>
            {!usersLoaded ? (
              <p style={{ color: "rgba(201,169,110,.4)", fontSize: 14 }}>
                Loading users...
              </p>
            ) : adminUsers.length === 0 ? (
              <p style={{ color: "rgba(201,169,110,.4)", fontSize: 14 }}>
                No registered users yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {adminUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(201,169,110,.15)",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    {/* User Row - clickable */}
                    <div
                      onClick={() =>
                        setExpandedUser(expandedUser === user.id ? null : user.id)
                      }
                      className="admin-user-row"
                    >
                      {/* Name */}
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            color: "var(--gold-light)",
                            fontFamily: "'Cormorant Garamond',serif",
                            fontWeight: 600,
                          }}
                        >
                          {user.full_name || "—"}
                        </div>
                      </div>
                      {/* Email */}
                      <div style={{ fontSize: 13, color: "var(--gold-light)" }}>
                        {user.email}
                      </div>
                      {/* Phone */}
                      <div style={{ fontSize: 12, color: "rgba(201,169,110,.5)" }}>
                        {user.phone || "—"}
                      </div>
                      {/* Role */}
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            padding: "3px 10px",
                            borderRadius: 2,
                            background: user.is_admin
                              ? "rgba(201,169,110,.15)"
                              : "rgba(255,255,255,.06)",
                            color: user.is_admin
                              ? "var(--gold)"
                              : "rgba(201,169,110,.4)",
                          }}
                        >
                          {user.is_admin ? "Admin" : "Customer"}
                        </span>
                      </div>
                      {/* Expand arrow */}
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 14,
                          color: "rgba(201,169,110,.4)",
                          transition: "transform .2s",
                          transform:
                            expandedUser === user.id
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                        }}
                      >
                        ▾
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedUser === user.id && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(201,169,110,.1)",
                          padding: "20px",
                          background: "rgba(0,0,0,.15)",
                        }}
                      >
                        {/* Edit / View toggle */}
                        {editingUser === user.id ? (
                          /* ── EDIT MODE ── */
                          <div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 16,
                                marginBottom: 16,
                              }}
                            >
                              <div className="form-field">
                                <label>Full Name</label>
                                <input
                                  type="text"
                                  placeholder="Full name"
                                  value={editForm.full_name}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, full_name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="form-field">
                                <label>Email</label>
                                <input
                                  type="email"
                                  placeholder="Email address"
                                  value={editForm.email}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, email: e.target.value })
                                  }
                                />
                              </div>
                              <div className="form-field">
                                <label>Phone</label>
                                <input
                                  type="text"
                                  placeholder="Phone number"
                                  value={editForm.phone}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, phone: e.target.value })
                                  }
                                />
                              </div>
                              <div className="form-field">
                                <label>Role</label>
                                <select
                                  value={editForm.is_admin ? "admin" : "customer"}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, is_admin: e.target.value === "admin" })
                                  }
                                >
                                  <option value="customer">Customer</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <button
                                onClick={() => saveUser(user.id)}
                                disabled={editSaving}
                                style={{
                                  background: "var(--gold)",
                                  color: "var(--deep)",
                                  border: "none",
                                  padding: "10px 24px",
                                  fontSize: 11,
                                  letterSpacing: 2,
                                  textTransform: "uppercase",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontFamily: "'Jost',sans-serif",
                                  borderRadius: 2,
                                  opacity: editSaving ? 0.6 : 1,
                                }}
                              >
                                {editSaving ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                style={{
                                  background: "none",
                                  border: "1px solid rgba(201,169,110,.3)",
                                  color: "var(--gold-light)",
                                  padding: "10px 24px",
                                  fontSize: 11,
                                  letterSpacing: 2,
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                  fontFamily: "'Jost',sans-serif",
                                  borderRadius: 2,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── VIEW MODE ── */
                          <div>
                            <div className="admin-user-details">
                              <div>
                                <div style={labelStyle}>Name</div>
                                <div style={valueStyle}>
                                  {user.full_name || "Not set"}
                                </div>
                              </div>
                              <div>
                                <div style={labelStyle}>Email</div>
                                <div style={valueStyle}>{user.email}</div>
                              </div>
                              <div>
                                <div style={labelStyle}>Phone</div>
                                <div style={valueStyle}>
                                  {user.phone || "Not set"}
                                </div>
                              </div>
                              <div>
                                <div style={labelStyle}>User ID</div>
                                <div
                                  style={{
                                    ...valueStyle,
                                    fontFamily: "monospace",
                                    fontSize: 11,
                                  }}
                                >
                                  {user.id}
                                </div>
                              </div>
                              <div>
                                <div style={labelStyle}>Joined</div>
                                <div style={valueStyle}>
                                  {new Date(user.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </div>
                              </div>
                              <div>
                                <div style={labelStyle}>Total Orders</div>
                                <div style={valueStyle}>
                                  {user.orders.length}
                                </div>
                              </div>
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={() => startEditUser(user)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(201,169,110,.3)",
                                color: "var(--gold)",
                                padding: "8px 20px",
                                fontSize: 10,
                                letterSpacing: 2,
                                textTransform: "uppercase",
                                cursor: "pointer",
                                fontFamily: "'Jost',sans-serif",
                                borderRadius: 2,
                                marginBottom: 20,
                              }}
                            >
                              Edit User
                            </button>
                          </div>
                        )}

                        {/* Order History (always visible) */}
                        <div style={{ marginTop: editingUser === user.id ? 20 : 0 }}>
                          <div
                            style={{
                              fontSize: 10,
                              letterSpacing: 2,
                              textTransform: "uppercase",
                              color: "var(--gold)",
                              marginBottom: 10,
                              fontWeight: 600,
                            }}
                          >
                            Order History
                          </div>
                          {user.orders.length === 0 ? (
                            <p
                              style={{
                                color: "rgba(201,169,110,.3)",
                                fontSize: 13,
                              }}
                            >
                              No orders yet.
                            </p>
                          ) : (
                            <div
                              style={{
                                background: "rgba(255,255,255,.03)",
                                border: "1px solid rgba(201,169,110,.1)",
                                borderRadius: 4,
                                overflow: "hidden",
                              }}
                            >
                              {user.orders.map((order) => (
                                <div
                                  key={order.id}
                                  className="admin-order-row"
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "var(--gold-light)",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    #{order.id.slice(0, 8)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      letterSpacing: 1,
                                      textTransform: "uppercase",
                                      padding: "2px 8px",
                                      borderRadius: 2,
                                      background:
                                        order.status === "completed"
                                          ? "rgba(76,175,125,.15)"
                                          : "rgba(201,169,110,.15)",
                                      color:
                                        order.status === "completed"
                                          ? "var(--green)"
                                          : "var(--gold)",
                                    }}
                                  >
                                    {order.status}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: "var(--gold)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ${order.total?.toFixed(2)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "rgba(201,169,110,.4)",
                                    }}
                                  >
                                    {new Date(
                                      order.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
