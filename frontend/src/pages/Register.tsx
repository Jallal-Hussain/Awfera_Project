import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { BASE_URL } from "../api/var";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post(`${BASE_URL}/auth/register`, {
        username,
        password,
      });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg p-8 border border-[rgb(var(--color-border))]">
      <h2 className="text-2xl font-bold text-center text-[rgb(var(--color-text))] mb-6">Register</h2>
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          className="p-2 rounded border border-[rgb(var(--color-border))] bg-transparent text-[rgb(var(--color-text))] placeholder-gray-500 dark:placeholder-gray-400"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="p-2 rounded border border-[rgb(var(--color-border))] bg-transparent text-[rgb(var(--color-text))] placeholder-gray-500 dark:placeholder-gray-400"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          className="bg-[rgb(var(--color-primary))] text-white dark:text-white rounded p-2 font-semibold hover:opacity-90 transition cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {error && <div className="text-red-500 dark:text-red-400 text-sm text-center">{error}</div>}
      </form>
    </div>
  );
}
