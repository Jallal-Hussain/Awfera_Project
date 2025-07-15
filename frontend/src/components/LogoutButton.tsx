import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
}
