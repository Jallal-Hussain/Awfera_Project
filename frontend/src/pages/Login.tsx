import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { BASE_URL } from "../api/var";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const expired = new URLSearchParams(location.search).get("expired");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`${BASE_URL}/auth/login`, {
        username,
        password,
      });
      localStorage.setItem("token", res.data.access_token);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-background rounded-xl shadow-lg p-8 border border-border">
      <h2 className="text-foreground text-2xl font-bold mb-6 text-center">
        Login
      </h2>
      {expired && (
        <div className="text-destructive text-sm text-center mb-4">
          Session expired, please log in again.
        </div>
      )}
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <input
            className="w-full p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            className="w-full p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full bg-[#00ABE4] hover:bg-[#00ABE4]/90 text-primary-foreground rounded-lg py-3 px-4 font-medium cursor-pointer transition-colors disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && (
          <div className="text-destructive text-sm text-center mt-2">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
