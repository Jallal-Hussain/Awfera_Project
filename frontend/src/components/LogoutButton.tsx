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
      className="font-medium lg:font-lg hover:opacity-80 transition-colors px-2 md:px-4 py-1 cursor-pointer"
    >
      Logout
    </button>
  );
}
