import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const expired = new URLSearchParams(location.search).get("expired");

  // const API_BASE_URL = import.meta.env.API_BASE_URL;
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`http://127.0.0.1:8001/api/v1/auth/login`, {
        username,
        password,
      });
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      {expired && (
        <div className="text-red-500 text-sm text-center mb-2">
          Session expired, please log in again.
        </div>
      )}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          className="p-2 rounded border border-[rgb(var(--color-border))] bg-transparent"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="p-2 rounded border border-[rgb(var(--color-border))] bg-transparent"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="bg-[rgb(var(--color-primary))] text-white rounded p-2 font-semibold hover:opacity-90 transition"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
      </form>
    </div>
  );
}
