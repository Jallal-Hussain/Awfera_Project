import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded bg-red-700 text-white font-semibold hover:opacity-90 transition cursor-pointer"
    >
      Logout
    </button>
  );
}
