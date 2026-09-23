import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const read = () => {
  try {
    return localStorage.getItem("theme") === "dark";
  } catch {
    return false;
  }
};

// Moon / sun button that switches between light and dark mode (light is the default).
export default function ThemeToggle({ className = "" }) {
  const [dark, setDark] = useState(read);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-navy transition-colors hover:bg-sky-50 ${className}`}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
