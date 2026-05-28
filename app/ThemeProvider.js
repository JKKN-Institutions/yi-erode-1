"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if there is a saved theme
    const savedTheme = localStorage.getItem("app-theme");
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add("light");
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  if (!mounted) {
    // Prevent hydration mismatch by rendering invisible or default children on server
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
