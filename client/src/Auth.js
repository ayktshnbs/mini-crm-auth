import { useState } from "react";
import api from "./api";
import { useEffect } from "react";

export default function Auth({ onAuthed, initialError = "" }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(initialError);
 
  useEffect(() => setErr(initialError), [initialError]);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    try {
      const url = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login" ? { email, password } : { name, email, password };

      const res = await api.post(url, payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onAuthed();
    } catch (e) {
      setErr(e?.response?.data?.message || "Hata oluştu");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2">Mini CRM</h1>
        <p className="text-gray-600 mb-6">
          {mode === "login" ? "Giriş yap" : "Kayıt ol"}
        </p>

        {err && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded mb-4">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <input
              className="border p-2 rounded w-full"
              placeholder="İsim"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="border p-2 rounded w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 rounded w-full"
            placeholder="Şifre (min 6)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">
            {mode === "login" ? "Giriş" : "Kayıt Ol"}
          </button>
        </form>

        <button
          className="text-sm text-blue-600 mt-4"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </div>
    </div>
  );
}