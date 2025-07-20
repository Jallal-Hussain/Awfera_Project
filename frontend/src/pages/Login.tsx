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
    <div className="w-full absolute top-1/4 flex justify-center items-center p-4">
      <div className="w-full max-w-sm text-[#E9F1FA] bg-[#000F14] dark:text-[#000F14] dark:bg-[#E9F1FA] rounded-xl shadow-lg shadow-[#000F14]/30 dark:shadow-[#0078B4]/40 p-8">
        <h2 className="text-2xl font-medium mb-6 text-center">Login</h2>
        {expired && (
          <div className="text-red-500 dark:text-red-700 text-sm text-center mb-4">
            Session expired, please log in again.
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <input
              className="w-full p-3 rounded-lg border border-[#000F14] bg-[#E9F1FA] text-[#000F14] placeholder:text-[#1E3246]/70 focus:outline-none focus:ring-2 focus:ring-[#00ABE4] focus:border-transparent"
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              className="w-full p-3 rounded-lg border border-[#000F14] bg-[#E9F1FA] text-[#000F14] placeholder:text-[#1E3246]/70 focus:outline-none focus:ring-2 focus:ring-[#00ABE4] focus:border-transparent"
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full bg-[#00ABE4] hover:bg-[#00ABE4]/90 text-[#FFFFFF] rounded-lg py-3 px-4 font-medium cursor-pointer transition-colors disabled:bg-[#008CBE]/40"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <div className="text-red-500 dark:text-red-700 text-sm text-center mt-2">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
