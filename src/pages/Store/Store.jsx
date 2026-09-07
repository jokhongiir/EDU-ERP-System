import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  Search,
  ShoppingBag,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Filter,
  BarChart3,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import "./Store.css";

const CATEGORIES = [
  "Books",
  "Notebooks",
  "Pens",
  "Drinks",
  "Stationery",
  "Other",
];

export default function Store({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("week");

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    unit: "pcs",
    category: "Books",
    stock: "",
  });

  const [moveForm, setMoveForm] = useState({
    product_id: "",
    quantity: "",
    unit_price: "",
    person_name: "",
    note: "",
  });

  // ========== LOAD DATA ==========
  const loadData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const [prodRes, transRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("branch_id", branchId)
        .order("name"),
      supabase
        .from("store_transactions")
        .select(`*, products(name, unit, category)`)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    if (prodRes.data) setProducts(prodRes.data);
    if (transRes.data) setTransactions(transRes.data);
    setSelectedIds([]);
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== SELECT ==========
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // ========== ADD PRODUCT ==========
  const submitProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const price = Number(productForm.price) || 0;
    const initialStock = Number(productForm.stock) || 0;

    const { data, error } = await supabase
      .from("products")
      .insert({
        branch_id: branchId,
        name: productForm.name.trim(),
        price,
        cost_price: price,
        unit: productForm.unit,
        category: productForm.category,
        stock: initialStock,
        total_in: initialStock,
        total_out: 0,
      })
      .select()
      .single();

    if (error) {
      setConfirmModal({
        type: "error",
        message: error.message,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    if (initialStock > 0 && data) {
      await supabase.from("store_transactions").insert({
        branch_id: branchId,
        product_id: data.id,
        type: "in",
        quantity: initialStock,
        unit_price: price,
        total_amount: initialStock * price,
        note: "Initial stock",
      });
    }

    setModal(null);
    setProductForm({
      name: "",
      price: "",
      unit: "pcs",
      category: "Books",
      stock: "",
    });
    loadData();
  };

  // ========== EDIT PRODUCT ==========
  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      unit: product.unit,
      category: product.category || "Books",
      stock: product.stock,
    });
    setModal("edit");
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct || !productForm.name.trim()) return;

    const price = Number(productForm.price) || 0;

    const { error } = await supabase
      .from("products")
      .update({
        name: productForm.name.trim(),
        price,
        cost_price: price,
        unit: productForm.unit,
        category: productForm.category,
      })
      .eq("id", editingProduct.id);

    if (error) {
      setConfirmModal({
        type: "error",
        message: error.message,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    setModal(null);
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: "",
      unit: "pcs",
      category: "Books",
      stock: "",
    });
    loadData();
  };

  // ========== DELETE ==========
  const askDeleteOne = (product) => {
    setConfirmModal({
      type: "confirm",
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await supabase.from("store_transactions").delete().eq("product_id", product.id);
        await supabase.from("products").delete().eq("id", product.id);
        setConfirmModal(null);
        loadData();
      },
    });
  };

  const askDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      type: "confirm",
      message: `Delete ${selectedIds.length} selected product(s)?`,
      onConfirm: async () => {
        await supabase.from("store_transactions").delete().in("product_id", selectedIds);
        await supabase.from("products").delete().in("id", selectedIds);
        setConfirmModal(null);
        loadData();
      },
    });
  };

  const askDeleteAll = () => {
    if (products.length === 0) return;
    setConfirmModal({
      type: "confirm",
      message: `Delete ALL ${products.length} products? This cannot be undone!`,
      onConfirm: async () => {
        const allIds = products.map((p) => p.id);
        await supabase.from("store_transactions").delete().in("product_id", allIds);
        await supabase.from("products").delete().in("id", allIds);
        setConfirmModal(null);
        loadData();
      },
    });
  };

  // ========== STOCK IN / SALE ==========
  const submitMove = async (e, type) => {
    e.preventDefault();
    const qty = Number(moveForm.quantity);
    const price = Number(moveForm.unit_price);

    if (!moveForm.product_id || qty <= 0) return;

    const product = products.find((p) => p.id === moveForm.product_id);
    if (!product) return;

    if (type === "out" && product.stock < qty) {
      setConfirmModal({
        type: "error",
        message: "Not enough stock available!",
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    const total = qty * price;

    const { error } = await supabase.from("store_transactions").insert({
      branch_id: branchId,
      product_id: moveForm.product_id,
      type,
      quantity: qty,
      unit_price: price,
      total_amount: total,
      person_name: type === "out" ? moveForm.person_name || null : null,
      note: moveForm.note || null,
    });

    if (error) {
      setConfirmModal({
        type: "error",
        message: error.message,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    const newStock = type === "in" ? product.stock + qty : product.stock - qty;
    const newTotalIn = type === "in" ? (product.total_in || 0) + qty : product.total_in || 0;
    const newTotalOut = type === "out" ? (product.total_out || 0) + qty : product.total_out || 0;

    await supabase
      .from("products")
      .update({
        stock: newStock,
        total_in: newTotalIn,
        total_out: newTotalOut,
      })
      .eq("id", moveForm.product_id);

    setModal(null);
    setMoveForm({
      product_id: "",
      quantity: "",
      unit_price: "",
      person_name: "",
      note: "",
    });
    loadData();
  };

  // ========== FILTER ==========
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "All" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  // ========== SALES REPORT ==========
  const salesReport = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (reportPeriod === "day") {
      startDate.setHours(0, 0, 0, 0);
    } else if (reportPeriod === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (reportPeriod === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    const filtered = transactions.filter(
      (t) => new Date(t.created_at) >= startDate
    );

    const income = filtered
      .filter((t) => t.type === "in")
      .reduce((s, t) => s + Number(t.total_amount), 0);

    const sales = filtered
      .filter((t) => t.type === "out")
      .reduce((s, t) => s + Number(t.total_amount), 0);

    const soldQty = filtered
      .filter((t) => t.type === "out")
      .reduce((s, t) => s + t.quantity, 0);

    return {
      income,
      sales,
      soldQty,
      count: filtered.length,
    };
  }, [transactions, reportPeriod]);

  // ========== TOTALS ==========
  const totalIn = transactions
    .filter((t) => t.type === "in")
    .reduce((s, t) => s + Number(t.total_amount), 0);

  const totalOut = transactions
    .filter((t) => t.type === "out")
    .reduce((s, t) => s + Number(t.total_amount), 0);

  const stockValue = products.reduce(
    (s, p) => s + p.stock * (p.price || 0),
    0
  );

  const saleTotal =
    Number(moveForm.quantity || 0) * Number(moveForm.unit_price || 0);

  if (loading) {
    return (
      <div className="erp-store-loading">
        <div className="erp-store-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="erp-store">
      {/* HEADER */}
      <header className="erp-store-header">
        <div className="erp-store-title">
          <ShoppingBag size={26} strokeWidth={1.8} />
          <div>
            <h1>Store</h1>
            <p>Inventory • Sales • Reports</p>
          </div>
        </div>

        <div className="erp-store-actions">
          <button
            className="erp-btn erp-btn--primary"
            onClick={() => setModal("product")}
          >
            <Plus size={17} /> Product
          </button>
          <button
            className="erp-btn erp-btn--success"
            onClick={() => setModal("in")}
          >
            <ArrowDownToLine size={17} /> Stock In
          </button>
          <button
            className="erp-btn erp-btn--danger"
            onClick={() => setModal("out")}
          >
            <ArrowUpFromLine size={17} /> Sale
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="erp-store-stats">
        <div className="erp-stat">
          <div className="erp-stat__icon erp-stat__icon--blue">
            <Package size={20} />
          </div>
          <div>
            <span>Products</span>
            <strong>{products.length}</strong>
          </div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat__icon erp-stat__icon--green">
            <TrendingUp size={20} />
          </div>
          <div>
            <span>Total Income</span>
            <strong>{totalIn.toLocaleString("en-US")} so'm</strong>
          </div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat__icon erp-stat__icon--red">
            <TrendingDown size={20} />
          </div>
          <div>
            <span>Total Sales</span>
            <strong>{totalOut.toLocaleString("en-US")} so'm</strong>
          </div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat__icon erp-stat__icon--purple">
            <Package size={20} />
          </div>
          <div>
            <span>Stock Value</span>
            <strong>{stockValue.toLocaleString("en-US")} so'm</strong>
          </div>
        </div>
      </div>

      {/* SALES REPORT */}
      <div className="erp-weekly">
        <div className="erp-weekly__header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} />
            <h3>Sales Report</h3>
          </div>

          <div className="erp-period-tabs">
            <button
              className={`erp-period-btn ${reportPeriod === "day" ? "active" : ""}`}
              onClick={() => setReportPeriod("day")}
            >
              Day
            </button>
            <button
              className={`erp-period-btn ${reportPeriod === "week" ? "active" : ""}`}
              onClick={() => setReportPeriod("week")}
            >
              Week
            </button>
            <button
              className={`erp-period-btn ${reportPeriod === "month" ? "active" : ""}`}
              onClick={() => setReportPeriod("month")}
            >
              Month
            </button>
          </div>
        </div>

        <div className="erp-weekly__grid">
          <div>
            <span>Income</span>
            <strong className="text-green">
              {salesReport.income.toLocaleString("en-US")} so'm
            </strong>
          </div>
          <div>
            <span>Sales</span>
            <strong className="text-red">
              {salesReport.sales.toLocaleString("en-US")} so'm
            </strong>
          </div>
          <div>
            <span>Sold Items</span>
            <strong>{salesReport.soldQty}</strong>
          </div>
          <div>
            <span>Transactions</span>
            <strong>{salesReport.count}</strong>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="erp-filters">
        <div className="erp-store-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="erp-category-filter">
          <Filter size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {selectedIds.length > 0 && (
          <button className="erp-btn erp-btn--danger" onClick={askDeleteSelected}>
            <Trash2 size={16} /> Delete Selected ({selectedIds.length})
          </button>
        )}

        {products.length > 0 && (
          <button className="erp-btn erp-btn--ghost" onClick={askDeleteAll}>
            <Trash2 size={16} /> Delete All
          </button>
        )}
      </div>

      {/* PRODUCTS TABLE */}
      <section className="erp-card">
        <div className="erp-card__head">
          <h2>Products in Stock</h2>
        </div>
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button className="erp-checkbox-btn" onClick={toggleSelectAll}>
                    {selectedIds.length === filteredProducts.length &&
                    filteredProducts.length > 0 ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Received</th>
                <th>Sold</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Stock Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="erp-empty">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className={selectedIds.includes(p.id) ? "erp-row-selected" : ""}
                  >
                    <td>
                      <button
                        className="erp-checkbox-btn"
                        onClick={() => toggleSelect(p.id)}
                      >
                        {selectedIds.includes(p.id) ? (
                          <CheckSquare size={18} className="checked" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="erp-table__name">{p.name}</td>
                    <td>
                      <span className="erp-category-badge">
                        {p.category || "Other"}
                      </span>
                    </td>
                    <td>{p.total_in || 0}</td>
                    <td>{p.total_out || 0}</td>
                    <td>
                      <span
                        className={`erp-badge ${
                          p.stock <= 5 ? "erp-badge--warning" : "erp-badge--success"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td>{p.unit}</td>
                    <td>{Number(p.price).toLocaleString("en-US")} so'm</td>
                    <td>
                      {(p.stock * (p.price || 0)).toLocaleString("en-US")} so'm
                    </td>
                    <td>
                      <div className="erp-actions">
                        <button
                          className="erp-action-btn erp-action-btn--edit"
                          onClick={() => openEditModal(p)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="erp-action-btn erp-action-btn--delete"
                          onClick={() => askDeleteOne(p)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="erp-card">
        <div className="erp-card__head">
          <h2>Recent Transactions</h2>
        </div>
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Buyer / Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="erp-empty">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {new Date(t.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <span
                        className={`erp-type ${
                          t.type === "in" ? "erp-type--in" : "erp-type--out"
                        }`}
                      >
                        {t.type === "in" ? "+ Stock In" : "− Sale"}
                      </span>
                    </td>
                    <td>{t.products?.name}</td>
                    <td>
                      {t.quantity} {t.products?.unit}
                    </td>
                    <td>{Number(t.unit_price).toLocaleString("en-US")} so'm</td>
                    <td
                      className={
                        t.type === "in" ? "erp-money--in" : "erp-money--out"
                      }
                    >
                      {Number(t.total_amount).toLocaleString("en-US")} so'm
                    </td>
                    <td>
                      {t.person_name && (
                        <div className="erp-person">{t.person_name}</div>
                      )}
                      {t.note && <div className="erp-note">{t.note}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== MODALS ==================== */}
      {modal && (
        <div className="erp-modal-backdrop" onClick={() => setModal(null)}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3>
                {modal === "product" && "Add New Product"}
                {modal === "edit" && "Edit Product"}
                {modal === "in" && "Stock In (+)"}
                {modal === "out" && "Make Sale (−)"}
              </h3>
              <button
                className="erp-modal__close"
                onClick={() => setModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            {(modal === "product" || modal === "edit") && (
              <form
                onSubmit={modal === "edit" ? submitEdit : submitProduct}
                className="erp-form"
              >
                <div className="erp-field">
                  <label>Product Name *</label>
                  <input
                    required
                    autoFocus
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    placeholder="e.g. Family Friends"
                  />
                </div>

                <div className="erp-field">
                  <label>Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="erp-field-row">
                  <div className="erp-field">
                    <label>Price (so'm) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                      placeholder="50000"
                    />
                  </div>

                  {modal === "product" && (
                    <div className="erp-field">
                      <label>Initial Quantity *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.stock}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            stock: e.target.value,
                          })
                        }
                        placeholder="10"
                      />
                    </div>
                  )}
                </div>

                <div className="erp-field">
                  <label>Unit</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) =>
                      setProductForm({ ...productForm, unit: e.target.value })
                    }
                  >
                    <option value="pcs">pcs</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                    <option value="liter">liter</option>
                    <option value="kg">kg</option>
                  </select>
                </div>

                <div className="erp-form-actions">
                  <button
                    type="button"
                    className="erp-btn erp-btn--ghost"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn erp-btn--primary">
                    {modal === "edit" ? "Save Changes" : "Add Product"}
                  </button>
                </div>
              </form>
            )}

            {(modal === "in" || modal === "out") && (
              <form
                onSubmit={(e) => submitMove(e, modal)}
                className="erp-form"
              >
                <div className="erp-field">
                  <label>Product *</label>
                  <select
                    required
                    value={moveForm.product_id}
                    onChange={(e) => {
                      const prod = products.find(
                        (p) => p.id === e.target.value
                      );
                      setMoveForm({
                        ...moveForm,
                        product_id: e.target.value,
                        unit_price: prod?.price || "",
                      });
                    }}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — stock: {p.stock} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="erp-field-row">
                  <div className="erp-field">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={moveForm.quantity}
                      onChange={(e) =>
                        setMoveForm({ ...moveForm, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="erp-field">
                    <label>Unit Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={moveForm.unit_price}
                      onChange={(e) =>
                        setMoveForm({
                          ...moveForm,
                          unit_price: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {moveForm.quantity && moveForm.unit_price && (
                  <div className="erp-total-box">
                    Total:{" "}
                    <strong>{saleTotal.toLocaleString("en-US")} so'm</strong>
                  </div>
                )}

                {modal === "out" && (
                  <div className="erp-field">
                    <label>Buyer Name</label>
                    <input
                      value={moveForm.person_name}
                      onChange={(e) =>
                        setMoveForm({
                          ...moveForm,
                          person_name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div className="erp-field">
                  <label>Note</label>
                  <input
                    value={moveForm.note}
                    onChange={(e) =>
                      setMoveForm({ ...moveForm, note: e.target.value })
                    }
                    placeholder="Optional..."
                  />
                </div>

                <div className="erp-form-actions">
                  <button
                    type="button"
                    className="erp-btn erp-btn--ghost"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`erp-btn ${
                      modal === "in" ? "erp-btn--success" : "erp-btn--danger"
                    }`}
                  >
                    {modal === "in" ? "Confirm Stock In" : "Confirm Sale"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div
          className="erp-modal-backdrop"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="erp-modal erp-modal--confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="erp-confirm-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>{confirmModal.type === "error" ? "Error" : "Confirm"}</h3>
            <p>{confirmModal.message}</p>
            <div
              className="erp-form-actions"
              style={{ justifyContent: "center" }}
            >
              {confirmModal.type === "confirm" && (
                <button
                  className="erp-btn erp-btn--ghost"
                  onClick={() => setConfirmModal(null)}
                >
                  Cancel
                </button>
              )}
              <button
                className={`erp-btn ${
                  confirmModal.type === "error"
                    ? "erp-btn--primary"
                    : "erp-btn--danger"
                }`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.type === "error" ? "OK" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}