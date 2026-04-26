import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Payments.css";

import {
  FiSearch,
  FiX,
  FiCheckCircle,
  FiDollarSign,
  FiEdit2,
  FiSave,
  FiUser,
} from "react-icons/fi";

export default function Payments({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState(null);

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("*, courses(name), teachers(name), groups(name)")
      .eq("branch_id", branchId);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ================= OPEN EDIT =================
  const openEdit = (student) => {
    setEditData({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      monthly_fee: student.monthly_fee || 0,
      paid: student.paid || false,
      payment_date: student.payment_date || "",
      next_payment_date: student.next_payment_date || "",
    });

    setEditOpen(true);
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!editData?.id) return;

    setSaving(true);

    const { error } = await supabase
      .from("students")
      .update({
        monthly_fee: Number(editData.monthly_fee),
        paid: Boolean(editData.paid),
        payment_date: editData.payment_date,
        next_payment_date: editData.next_payment_date,
      })
      .eq("id", editData.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditOpen(false);
    fetchData();
  };

  // ================= SEARCH =================
  const filtered = useMemo(() => {
    return students.filter((s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [students, search]);

  // ================= STATUS =================
  const getStatus = (s) => {
    if (s.paid) return "paid";
    if (s.monthly_fee > 0) return "unpaid";
    return "partial";
  };

  // ================= UI =================
  return (
    <div className="payments">

      {/* HEADER */}
      <div className="payments__header">
        <div>
          <h2>{activeBranch?.name || "Branch"} • Payments</h2>
          <p className="payments__sub">Manage student payments</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="payments__search">
        <FiSearch />
        <input
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="payments__empty">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="payments__empty">
          <FiUser size={40} />
          <p>No payments found</p>
        </div>
      ) : (
        <table className="payments__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Course</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Next Payment</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>

                <td>
                  {s.first_name} {s.last_name}
                </td>

                <td>{s.courses?.name || "-"}</td>

                <td>
                  <FiDollarSign /> {s.monthly_fee || 0}
                </td>

                <td>
                  <span className={`status ${getStatus(s)}`}>
                    {s.paid ? (
                      <>
                        <FiCheckCircle /> Paid
                      </>
                    ) : (
                      "Unpaid"
                    )}
                  </span>
                </td>

                <td>{s.next_payment_date || "-"}</td>

                <td>
                  <div className="payments__actions">
                    <button onClick={() => openEdit(s)}>
                      <FiEdit2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editOpen && editData && (
        <div className="modal">
          <div className="modal__box">

            <div className="modal__header">
              <h3>Edit Payment</h3>
              <button onClick={() => setEditOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal__form">

              <div className="form__group">
                <label>Monthly Fee</label>
                <input
                  name="monthly_fee"
                  value={editData.monthly_fee}
                  onChange={handleChange}
                />
              </div>

              <div className="form__group">
                <label>Payment Date</label>
                <input
                  type="date"
                  name="payment_date"
                  value={editData.payment_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form__group">
                <label>Next Payment</label>
                <input
                  type="date"
                  name="next_payment_date"
                  value={editData.next_payment_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form__group">
                <label>
                  <input
                    type="checkbox"
                    name="paid"
                    checked={editData.paid}
                    onChange={handleChange}
                  />
                  Mark as Paid
                </label>
              </div>

            </div>

            <div className="modal__actions">
              <button onClick={handleSave} disabled={saving}>
                <FiSave />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}