import Logo from "@/components/Logo";
import React from "react";
import { Github, Play, Save } from "lucide-react";

function Topbar() {
  return (
    <header className="flex justify-between items-center px-4 py-1">
      <div className="flex-1">
        <Logo />
      </div>
      <div className="flex-2 flex justify-end">
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
