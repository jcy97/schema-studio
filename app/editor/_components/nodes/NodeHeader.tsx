"use client";
import { getRandomBgColor } from "@/lib/utils";
import { Copy, GripVertical, Sheet, Trash2 } from "lucide-react";
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";

interface NodeHeaderProps {
  logicalName: string;
  color: string;
}

function NodeHeader({
  logicalName,
  color = "",
}: NodeHeaderProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(logicalName);
  const inputRef = useRef<HTMLInputElement>(null);

  const bgColorClass = React.useMemo(() => {
    return color || getRandomBgColor();
  }, [color]);

  const handleInputClick = (): void => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 0);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };

  const handleInputBlur = (): void => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`w-full rounded-t-sm flex justify-between items-center p-2 ${bgColorClass}`}
    >
      <div className="flex justify-start items-center gap-2">
        <Sheet size={18} className="text-neutral-800" />
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          readOnly={!isEditing}
          className="text-sm font-bold text-neutral-800 bg-transparent outline-none border-none"
        />
      </div>
      <div className="flex justify-end gap-2 items-center">
        <Trash2
          size={18}
          className="text-neutral-800 hover:text-destructive duration-200"
        />
        <Copy
          size={18}
          className="text-neutral-800 hover:text-neutral-100 duration-200"
        />
        <GripVertical
          size={18}
          className="text-neutral-800 hover:text-neutral-100 duration-200"
        />
      </div>
    </div>
  );
}

export default NodeHeader;
