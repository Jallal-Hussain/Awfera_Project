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
    <div className="w-full max-w-sm bg-background/80 rounded-xl shadow-lg p-8 border border-border">
      <h2 className="text-foreground text-2xl font-bold mb-6 text-center">
        Register
      </h2>
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          className="w-full p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full bg-[#00ABE4] hover:bg-[#00ABE4]/90 text-primary-foreground rounded-lg py-3 px-4 font-medium cursor-pointer transition-colors disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {error && (
          <div className="text-destructive text-sm text-center">{error}</div>
        )}
      </form>
    </div>
  );
}
