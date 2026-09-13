import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiSearch,
  FiUsers,
  FiLoader,
  FiPhone,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import "./MyStudents.css";

export default function MyStudents() {
  const { teacher } = useOutletContext();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacher?.id) return;
      setLoading(true);

      try {
        const { data: groups, error: gErr } = await supabase
          .from("groups")
          .select("id, name")
          .eq("teacher_id", teacher.id);

        if (gErr) throw gErr;

        const groupIds = groups?.map((g) => g.id) || [];
        if (groupIds.length === 0) {
          setStudents([]);
          return;
        }

        const { data, error } = await supabase
          .from("students")
          .select("*, groups(id, name)")
          .in("group_id", groupIds)
          .eq("is_archived", false)
          .order("first_name");

        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        console.error(err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [teacher]);

  const groupOptions = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (s.groups?.id) map.set(s.groups.id, s.groups.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const matchSearch = fullName.includes(search.toLowerCase());
      const matchGroup = groupFilter
        ? String(s.group_id) === String(groupFilter)
        : true;
      return matchSearch && matchGroup;
    });
  }, [students, search, groupFilter]);

  const paidCount = students.filter((s) => s.paid).length;
  const unpaidCount = students.length - paidCount;

  if (loading) {
    return (
      <div className="ms-loading">
        <FiLoader className="ms-spin" />
        <p>O'quvchilar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="ms-page">
      {/* Header */}
      <div className="ms-header">
        <div>
          <h1 className="ms-title">Mening O'quvchilarim</h1>
          <p className="ms-subtitle">
            Barcha guruhlaringizdagi faol o'quvchilar ro'yxati
          </p>
        </div>
        <div className="ms-stats">
          <div className="ms-stat-chip">
            <FiUsers /> {students.length} o'quvchi
          </div>
          <div className="ms-stat-chip paid">
            <FiCheckCircle /> {paidCount} to'langan
          </div>
          <div className="ms-stat-chip unpaid">
            <FiXCircle /> {unpaidCount} to'lanmagan
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ms-filters">
        <div className="ms-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Ism yoki familiya bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="ms-select"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">Barcha guruhlar</option>
          {groupOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="ms-empty">
          <FiUsers size={44} />
          <h3>O'quvchilar topilmadi</h3>
          <p>
            {search || groupFilter
              ? "Filtr bo'yicha natija yo'q"
              : "Sizga hali o'quvchilar biriktirilmagan"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="ms-table-card ms-desktop-only">
            <div className="ms-table-scroll">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th className="ms-th-num">#</th>
                    <th>F.I.O</th>
                    <th>Guruh</th>
                    <th>Telefon</th>
                    <th>To'lov holati</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="ms-num">{idx + 1}</td>
                      <td>
                        <div className="ms-user">
                          <div className="ms-avatar">
                            {s.first_name?.[0] || "?"}
                          </div>
                          <div className="ms-user-info">
                            <span className="ms-name">
                              {s.first_name} {s.last_name}
                            </span>
                            {s.parent_name && (
                              <span className="ms-parent">
                                Ota-ona: {s.parent_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ms-group-tag">
                          <FiLayers /> {s.groups?.name || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="ms-phone">
                          <FiPhone /> {s.phone || s.parent_phone || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ms-pill ${s.paid ? "paid" : "unpaid"}`}
                        >
                          {s.paid ? "To'langan" : "To'lanmagan"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="ms-cards ms-mobile-only">
            {filtered.map((s, idx) => (
              <div key={s.id} className="ms-card">
                <div className="ms-card-top">
                  <div className="ms-user">
                    <div className="ms-avatar">
                      {s.first_name?.[0] || "?"}
                    </div>
                    <div className="ms-user-info">
                      <span className="ms-name">
                        {s.first_name} {s.last_name}
                      </span>
                      {s.parent_name && (
                        <span className="ms-parent">
                          Ota-ona: {s.parent_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="ms-card-num">#{idx + 1}</span>
                </div>

                <div className="ms-card-body">
                  <div className="ms-card-row">
                    <span className="ms-card-label">
                      <FiLayers /> Guruh
                    </span>
                    <span className="ms-group-tag">
                      {s.groups?.name || "—"}
                    </span>
                  </div>
                  <div className="ms-card-row">
                    <span className="ms-card-label">
                      <FiPhone /> Telefon
                    </span>
                    <span className="ms-phone-text">
                      {s.phone || s.parent_phone || "—"}
                    </span>
                  </div>
                  <div className="ms-card-row">
                    <span className="ms-card-label">To'lov</span>
                    <span
                      className={`ms-pill ${s.paid ? "paid" : "unpaid"}`}
                    >
                      {s.paid ? "To'langan" : "To'lanmagan"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}