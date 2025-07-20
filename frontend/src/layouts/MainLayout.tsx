import { Outlet, Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import LogoutButton from "../components/LogoutButton";

export default function MainLayout() {
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen flex flex-col bg-[#E9F1FA] dark:bg-[#000F14] dark:text-[#E9F1FA] transition-colors duration-300 isolate relative">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-30 dark:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0, 0, 0, 0.05), 1px, transparent), linear-gradient(to bottom, rgba(0, 0, 0, 0.05), 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              "radial-gradient(to right, rgba(0, 0, 0, 0.1), 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-between p-4">
        <Link
          to="/"
          className="font-medium lg:font-bold hover:opacity-90 transition-opacity"
        >
          CAG Project - Awfera
        </Link>
        <nav className="flex gap-6 items-center">
          {!token && (
            <>
              <Link
                to="/auth/register"
                className="font-medium hover:opacity-80 transition-colors px-3 py-1"
              >
                Register
              </Link>
              <Link
                to="/auth/login"
                className="font-medium hover:opacity-80 transition-colors px-3 py-1"
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

      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center p-4">
        <Outlet />
      </main>

      {/* Enhanced Footer */}
      <footer className="absolute bottom-0 w-full py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm">
              © {new Date().getFullYear()} CAG Project-Awfera
            </span>
            <span className="hidden md:block text-sm">All rights reserved</span>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                developed by{" "}
                <Link
                  to="https://jallalhussain.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  Jallal Hussain
                </Link>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
