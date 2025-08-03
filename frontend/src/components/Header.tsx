import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication state on component mount and when localStorage changes
  const checkAuthState = () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    // Initial check
    checkAuthState();

    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        checkAuthState();
      }
    };

    // Listen for custom events (for programmatic token changes)
    const handleAuthChange = () => {
      checkAuthState();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChanged", handleAuthChange);

    // Cleanup listeners
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  return (
    <>
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm flex items-center justify-between px-4 py-2">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <img
            src="/avatar.png"
            alt="avatar"
            className="w-12 h-12 lg:w-16 lg:h-16 border-2 ml-5 lg:ml-10 border-secondary rounded-full object-cover"
          />
        </Link>
        <nav className="flex gap-1 md:gap-4 lg:gap-6 items-center">
          {!isAuthenticated && (
            <>
              <Link
                to="/auth/register"
                className="font-medium lg:font-lg hover:text-primary transition-colors px-2 md:px-4 py-1"
              >
                Register
              </Link>
              <Link
                to="/auth/login"
                className="font-medium lg:font-lg hover:text-primary transition-colors px-2 md:px-4 py-1"
              >
                Login
              </Link>
            </>
          )}
          {isAuthenticated && <LogoutButton onLogout={checkAuthState} />}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
