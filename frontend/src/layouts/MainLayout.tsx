import { Outlet, Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]">
      <header className="flex items-center justify-between p-4 border-b border-[rgb(var(--color-border))]">
        <Link to="/" className="text-2xl font-bold">
          CAG Project
        </Link>
        <nav className="flex gap-4">
          <Link to="/register" className="hover:underline">
            Register
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <Outlet />
      </main>
      <footer className="p-4 text-center text-sm border-t border-[rgb(var(--color-border))]">
        © 2025 CAG Project
      </footer>
    </div>
  );
}
