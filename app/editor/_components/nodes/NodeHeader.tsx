"use client";
import { getRandomBgColor } from "@/lib/utils";
import { Copy, GripVertical, Sheet, Trash2 } from "lucide-react";
import React, { useRef, useState, KeyboardEvent } from "react";

interface NodeHeaderProps {
  logicalName: string;
  color?: string;
  onChange: (value: string) => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

function NodeHeader({
  logicalName,
  color = "",
  onChange,
  onDelete,
  onCopy,
}: NodeHeaderProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // 랜덤 색상을 useRef로 저장하여 리렌더링에도 유지
  const randomColorRef = useRef(color || getRandomBgColor());

  // 색상은 randomColorRef에서 가져옴
  const bgColorClass = randomColorRef.current;

  const handleInputClick = (): void => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
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
          value={logicalName}
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
          onClick={onDelete}
        />
        <Copy
          size={18}
          className="text-neutral-800 hover:text-neutral-100 duration-200"
          onClick={onCopy}
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
