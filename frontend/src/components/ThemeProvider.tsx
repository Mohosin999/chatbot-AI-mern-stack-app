import React from "react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white transition"
      >
        {theme === "light" ? "🌞 Light" : "🌙 Dark"}
      </button>

      {children}
    </div>
  );
};

export default ThemeProvider;
