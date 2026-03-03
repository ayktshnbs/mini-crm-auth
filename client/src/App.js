import { useEffect, useMemo, useState } from "react";
import Auth from "./Auth";
import api, { setOnUnauthorized } from "./api";

const PAGE_SIZE = 8;

function App() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // UI controls
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | New | Contacted | Won | Lost
  const [page, setPage] = useState(1);

  // auth/session
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [authMsg, setAuthMsg] = useState("");

  // loading + animation
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    setMounted(true);

    setOnUnauthorized(() => {
      setLeads([]);
      setAuthMsg("Oturum süren doldu. Lütfen tekrar giriş yap.");
      setAuthed(false);
    });
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await api.get("/leads");
      setLeads(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed]);

  async function addLead(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await api.post("/leads", { name, email });
    setName("");
    setEmail("");
    setPage(1);
    fetchLeads();
  }

  async function deleteLead(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?",
    );
    if (!confirmDelete) return;

    await api.delete(`/leads/${id}`);
    fetchLeads();
  }

  async function updateStatus(id, status) {
    await api.put(`/leads/${id}`, { status });
    fetchLeads();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLeads([]);
    setAuthed(false);
  }

  function getStatusColor(status) {
    switch (status) {
      case "Won":
        return "bg-green-50 text-green-700 border-green-200";
      case "Lost":
        return "bg-red-50 text-red-700 border-red-200";
      case "Contacted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  // Filtered leads
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return leads.filter((l) => {
      const matchesQuery =
        !s || `${l.name} ${l.email}`.toLowerCase().includes(s);
      const status = l.status || "New";
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [leads, q, statusFilter]);

  // Pagination derived
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxButtons + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safePage, totalPages]);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  if (!authed) {
    return (
      <Auth
        onAuthed={() => {
          setAuthMsg("");
          setAuthed(true);
        }}
        initialError={authMsg}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold">
              CRM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  Mini CRM
                </h1>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border">
                  {filtered.length} leads
                </span>
              </div>
              <p className="text-xs text-gray-500">
                JWT Auth • Multi-tenant • Protected API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {user?.name && (
              <span className="hidden sm:inline">
                <span className="font-medium text-gray-800">{user.name}</span>{" "}
                <span className="text-gray-500">({user.email})</span>
              </span>
            )}
            <button
              onClick={logout}
              className="underline hover:text-gray-900 transition"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`max-w-5xl mx-auto p-6 transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-white shadow-xl rounded-2xl p-6">
          {/* Add lead */}
          <form
            onSubmit={addLead}
            className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4"
          >
            <input
              className="border p-2 rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="İsim"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border p-2 rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black transition">
              Ekle
            </button>
          </form>

          {/* Search + Filter row */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
            <input
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Search by name or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="border p-2 rounded w-full md:w-56 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {loading && (
            <div className="mb-4 text-gray-500 text-sm">Loading leads...</div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b text-gray-700">
                  <th className="p-2">ID</th>
                  <th className="p-2">İsim</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((lead) => {
                  const s = lead.status || "New";
                  return (
                    <tr
                      key={lead._id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-2 text-gray-600">
                        {lead._id.slice(-6)}
                      </td>
                      <td className="p-2">{lead.name}</td>
                      <td className="p-2">{lead.email}</td>

                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {/* pill */}
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                              s,
                            )}`}
                          >
                            {s}
                          </span>

                          {/* select */}
                          <select
                            className="border rounded p-1 bg-white text-sm"
                            value={s}
                            onChange={(e) =>
                              updateStatus(lead._id, e.target.value)
                            }
                          >
                            <option>New</option>
                            <option>Contacted</option>
                            <option>Won</option>
                            <option>Lost</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-2">
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                          onClick={() => deleteLead(lead._id)}
                          type="button"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-6 text-gray-500">
                      {q.trim() || statusFilter !== "All"
                        ? "No matching leads found."
                        : "No leads yet. Create your first lead to get started 🚀"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="text-gray-600">
              Page <span className="font-medium">{safePage}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="border px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
                type="button"
                title="First"
              >
                «
              </button>

              <button
                className="border px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                Prev
              </button>

              {/* left dots */}
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    className={`border px-3 py-1 rounded hover:bg-gray-50 transition`}
                    onClick={() => setPage(1)}
                    type="button"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="px-1 text-gray-400">…</span>
                  )}
                </>
              )}

              {/* page numbers */}
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  className={`border px-3 py-1 rounded transition ${
                    n === safePage
                      ? "bg-gray-900 text-white border-gray-900"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setPage(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}

              {/* right dots */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-gray-400">…</span>
                  )}
                  <button
                    className="border px-3 py-1 rounded hover:bg-gray-50 transition"
                    onClick={() => setPage(totalPages)}
                    type="button"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                className="border px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next
              </button>

              <button
                className="border px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                type="button"
                title="Last"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
