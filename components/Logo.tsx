import Image from "next/image";
import React from "react";

function Logo() {
  return (
    <div className="p-2 text-xl font-extrabold flex items-center gap-2">
      <Image src="/logo.svg" alt="logo" width={40} height={40} />
      <div>
        <span className="bg-gradient-to-r from-purple-500 to-purple-800 bg-clip-text text-transparent">
          Schema
        </span>
        <span className="text-stone-700 dark:text-stone-300">Studio</span>
      </div>
    </div>
  );
}

export default Logo;
