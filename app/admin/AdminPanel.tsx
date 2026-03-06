"use client";

import { useState, useCallback } from "react";
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

export default function AdminPanel() {
  const [nameEn, setNameEn] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("skincare");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [badge, setBadge] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

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
    setLoaded(true);
  }, []);

  if (!loaded) loadProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !price) {
      setMessage("Please fill product name & price");
      return;
    }
    setLoading(true);
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
      image_url: imageUrl || null,
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
      loadProducts();
    }
    setLoading(false);
  };

  const deleteProduct = async (id: number) => {
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  return (
    <div style={{ background: "var(--deep)", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 36,
                color: "var(--gold)",
                marginBottom: 4,
              }}
            >
              ✦ Admin Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "rgba(201,169,110,.5)" }}>
              Product Management
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

        {message && (
          <div
            style={{
              background: message.startsWith("Error")
                ? "rgba(212,135,122,.2)"
                : "rgba(76,175,125,.2)",
              border: `1px solid ${message.startsWith("Error") ? "var(--rose)" : "var(--green)"}`,
              color: message.startsWith("Error")
                ? "var(--rose)"
                : "var(--green)",
              padding: "12px 16px",
              borderRadius: 4,
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {message}
          </div>
        )}

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
                <label>Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
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
    </div>
  );
}
