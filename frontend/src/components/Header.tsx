import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const token = localStorage.getItem("token");
  return (
    <>
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-background dark:bg-foreground backdrop-blur-sm flex items-center justify-between px-4 py-2">
        <Link
          to="/"
          className="hover:opacity-90 transition-opacity"
        >
          <img
            src="/avatar.png"
            alt="avatar"
            className="w-12 h-12 lg:w-16 lg:h-16 border-2 ml-5 lg:ml-10 border-secondary rounded-full object-cover"
          />
        </Link>
        <nav className="flex gap-1 md:gap-4 lg:gap-6 items-center">
          {!token && (
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
          {token && <LogoutButton />}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
