import { useEffect, useState } from "react";
import Auth from "./Auth";
import api, { setOnUnauthorized } from "./api";

function App() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [authMsg, setAuthMsg] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    setOnUnauthorized(() => {
      setLeads([]);
      setAuthMsg("Oturum süren doldu. Lütfen tekrar giriş yap.");
      setAuthed(false);
    });
  }, []);
  async function fetchLeads() {
    const res = await api.get("/leads");
    setLeads(res.data);
  }

  // ✅ Auth olunca leads çek (token var)
  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed]);

  async function addLead(e) {
    e.preventDefault();
    await api.post("/leads", { name, email });
    setName("");
    setEmail("");
    fetchLeads();
  }

  async function deleteLead(id) {
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

  if (!authed)
    return (
      <Auth
        onAuthed={() => {
          setAuthMsg("");
          setAuthed(true);
        }}
        initialError={authMsg}
      />
    );

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Mini CRM Dashboard
          </h1>
          <div className="text-sm text-gray-600 flex items-center gap-4">
            {user?.name && (
              <span className="font-medium">
                {user.name} ({user.email})
              </span>
            )}

            <button
              onClick={logout}
              className="text-sm text-gray-600 underline"
            >
              Çıkış
            </button>
          </div>
        </div>

        <form onSubmit={addLead} className="flex gap-4 mb-6">
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
            {leads.map((lead) => (
              <tr key={lead._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{lead._id.slice(-6)}</td>
                <td className="p-2">{lead.name}</td>
                <td className="p-2">{lead.email}</td>

                <td className="p-2">
                  <select
                    className="border rounded p-1"
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

            {leads.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  Henüz lead yok.
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
