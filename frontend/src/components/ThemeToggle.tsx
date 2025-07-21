import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    } else {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <button
      className="flex justify-center items-center w-9 h-9 lg:w-10 lg:h-10 p-2 rounded-full bg-foreground dark:bg-background text-background dark:text-foreground shadow-lg hover:bg-foreground/90 hover:dark:bg-background/80 transition-colors cursor-pointer"
      onClick={toggleDarkMode}
    >
      <i
        className={`bx bx-${darkMode ? "moon" : "sun"} text-lg lg:text-xl`}
      ></i>
    </button>
  );
}
