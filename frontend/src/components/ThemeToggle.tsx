import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
