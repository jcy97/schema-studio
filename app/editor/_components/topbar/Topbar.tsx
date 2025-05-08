"use client";
import Logo from "@/components/Logo";
import React from "react";
import { Github, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

function Topbar() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex justify-between items-center px-4 py-1">
      <div className="flex-1">
        <Logo />
      </div>
      <div className="flex-2 flex justify-end items-center">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-2"
          aria-label={
            theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
          }
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <a
          href="https://github.com/jcy97/schema-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors text-sm gap-1"
        >
          <Github size={24} />
          <span className="mr-2">v1.0 - MIT</span>
        </a>
      </div>
    </header>
  );
}

export default Topbar;
