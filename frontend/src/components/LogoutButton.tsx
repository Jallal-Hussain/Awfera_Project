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
      className="px-4 py-2 rounded-lg text-destructive font-medium hover:bg-destructive/10 transition-colors cursor-pointer"
    >
      Logout
    </button>
  );
}
