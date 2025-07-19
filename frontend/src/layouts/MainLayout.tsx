import { Outlet, Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import LogoutButton from "../components/LogoutButton";

export default function MainLayout() {
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 dark:border-gray-400">
        <Link to="/" className="text-lg md:text-xl font-bold">
          CAG Project - Awfera
        </Link>
        <nav className="flex gap-4 items-center">
          {!token && (
            <>
              <Link to="/auth/register" className="hover:underline">
                Register
              </Link>
              <Link to="/auth/login" className="hover:underline">
                Login
              </Link>
            </>
          )}
          {token && <LogoutButton />}
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <Outlet />
      </main>
      <footer className="flex items-center justify-around px-8 py-4 text-center text-sm border-t border-gray-700 dark:border-gray-400">
        <span>© {new Date().getFullYear()} CAG Project</span>
        <span>developed by <Link to="https://jallalhussain/vercel.app" className="underline hover:text-blue-500">Jallal Hussain</Link> all rights reserved</span>
      </footer>
    </div>
  );
}
