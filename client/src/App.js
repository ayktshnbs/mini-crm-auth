import { useEffect, useMemo, useState } from "react";
import Auth from "./Auth";
import api, { setOnUnauthorized } from "./api";

function App() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [authMsg, setAuthMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
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
    fetchLeads();
  }

  async function deleteLead(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
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
        return "text-green-600";
      case "Lost":
        return "text-red-600";
      case "Contacted":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      `${l.name} ${l.email}`.toLowerCase().includes(s)
    );
  }, [leads, q]);

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
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800">
              Mini CRM Dashboard
            </h1>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {leads.length} leads
            </span>
          </div>

          <div className="text-sm text-gray-600 flex items-center gap-4">
            {user?.name && (
              <span className="font-medium">
                {user.name} ({user.email})
              </span>
            )}

            <button onClick={logout} className="underline">
              Çıkış
            </button>
          </div>
        </div>

        <form onSubmit={addLead} className="flex gap-4 mb-4">
          <input
            className="border p-2 rounded w-1/3"
            placeholder="İsim"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border p-2 rounded w-1/3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Ekle
          </button>
        </form>

        <input
          className="border p-2 rounded w-full mb-4"
          placeholder="Search by name or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading && (
          <div className="mb-4 text-gray-500 text-sm">Loading leads...</div>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">ID</th>
              <th className="p-2">İsim</th>
              <th className="p-2">Email</th>
              <th className="p-2">Status</th>
              <th className="p-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{lead._id.slice(-6)}</td>
                <td className="p-2">{lead.name}</td>
                <td className="p-2">{lead.email}</td>

                <td className="p-2">
                  <select
                    className={`border rounded p-1 ${getStatusColor(
                      lead.status
                    )}`}
                    value={lead.status || "New"}
                    onChange={(e) => updateStatus(lead._id, e.target.value)}
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Won</option>
                    <option>Lost</option>
                  </select>
                </td>

                <td className="p-2">
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => deleteLead(lead._id)}
                    type="button"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-500">
                  {q.trim()
                    ? "No matching leads found."
                    : "No leads yet. Create your first lead to get started "}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;