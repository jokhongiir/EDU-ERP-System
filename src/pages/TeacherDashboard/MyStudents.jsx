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
      <div className="students-loading">
        <FiLoader className="students-spinner" />
        <p>O'quvchilar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="students-page">
      {/* Header */}
      <header className="students-header">
        <div className="students-header-text">
          <h1 className="students-title">Mening O'quvchilarim</h1>
          <p className="students-subtitle">
            Barcha guruhlaringizdagi faol o'quvchilar ro'yxati
          </p>
        </div>

        <div className="students-stats">
          <div className="students-stat">
            <FiUsers />
            <span>{students.length} o'quvchi</span>
          </div>
          <div className="students-stat students-stat--paid">
            <FiCheckCircle />
            <span>{paidCount} to'langan</span>
          </div>
          <div className="students-stat students-stat--unpaid">
            <FiXCircle />
            <span>{unpaidCount} to'lanmagan</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="students-filters">
        <div className="students-search">
          <FiSearch className="students-search-icon" />
          <input
            type="text"
            placeholder="Ism yoki familiya bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="students-select"
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
        <div className="students-empty">
          <FiUsers size={48} />
          <h3>O'quvchilar topilmadi</h3>
          <p>
            {search || groupFilter
              ? "Filtr bo'yicha natija yo'q"
              : "Sizga hali o'quvchilar biriktirilmagan"}
          </p>
        </div>
      ) : (
        <div className="students-table-wrapper">
          <div className="students-table-scroll">
            <table className="students-table">
              <thead>
                <tr>
                  <th className="students-col-num">#</th>
                  <th>F.I.O</th>
                  <th>Guruh</th>
                  <th>Telefon</th>
                  <th>To'lov holati</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="students-num">{idx + 1}</td>
                    <td data-label="O'quvchi">
                      <div className="students-user">
                        <div className="students-avatar">
                          {s.first_name?.[0] || "?"}
                        </div>
                        <div className="students-user-info">
                          <span className="students-name">
                            {s.first_name} {s.last_name}
                          </span>
                          {s.parent_name && (
                            <span className="students-parent">
                              Ota-ona: {s.parent_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="Guruh">
                      <span className="students-badge students-badge--group">
                        <FiLayers />
                        {s.groups?.name || "—"}
                      </span>
                    </td>
                    <td data-label="Telefon">
                      <span className="students-phone">
                        <FiPhone />
                        {s.phone || s.parent_phone || "—"}
                      </span>
                    </td>
                    <td data-label="To'lov">
                      <span
                        className={`students-badge ${
                          s.paid
                            ? "students-badge--paid"
                            : "students-badge--unpaid"
                        }`}
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
      )}
    </div>
  );
}