import { useNavigate } from "react-router-dom";

type LogoutButtonProps = {
  onLogout?: () => void; // Optional callback to notify parent components
};

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");

    // Notify other components about auth state change
    window.dispatchEvent(new CustomEvent("authStateChanged"));

    // Call optional callback
    if (onLogout) {
      onLogout();
    }

    navigate("/auth/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="font-medium lg:font-lg hover:text-primary transition-colors px-2 md:px-4 py-1 cursor-pointer"
    >
      Logout
    </button>
  );
}
