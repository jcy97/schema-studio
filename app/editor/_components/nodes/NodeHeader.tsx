"use client";
import { cn, getRandomBgColor } from "@/lib/utils";
import React, { useEffect, useState } from "react";

function NodeHeader({
  logicalName,
  color = "",
}: {
  logicalName: string;
  color: string;
}) {
  const bgColorClass = React.useMemo(() => {
    return color || getRandomBgColor();
  }, [color]);

  console.log("적용되는 클래스:", bgColorClass);

  return (
    <div
      className={`w-full rounded-t-sm text-sm font-bold flex justify-center items-center p-2 ${bgColorClass}`}
    >
      {logicalName}
    </div>
  );
}

export default NodeHeader;
