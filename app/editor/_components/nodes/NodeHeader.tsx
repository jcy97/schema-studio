"use client";
import TooltipWrapper from "@/components/TooltipWrapper";
import { getRandomBgColor } from "@/lib/utils";
import { Copy, Grid2X2Plus, GripVertical, Sheet, Trash2 } from "lucide-react";
import React, { useRef, useState, KeyboardEvent, useEffect } from "react";

interface NodeHeaderProps {
  logicalName: string;
  color?: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  onCopy?: () => void;
  onAddColumn?: () => void;
}

function NodeHeader({
  logicalName,
  color = "",
  onChange,
  onRemove,
  onCopy,
  onAddColumn,
}: NodeHeaderProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(logicalName);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // 랜덤 색상을 useRef로 저장하여 리렌더링에도 유지
  const randomColorRef = useRef(color || getRandomBgColor());

  useEffect(() => {
    setInputValue(logicalName);
  }, [logicalName]);

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
    setInputValue(e.target.value);
    if (!isComposing) {
      onChange(e.target.value);
    }
  };

  const handleCompositionStart = (): void => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ): void => {
    setIsComposing(false);
    const composedValue = e.currentTarget.value;
    onChange(composedValue);
  };

  const handleInputBlur = (): void => {
    setIsEditing(false);

    onChange(inputValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !isComposing) {
      setIsEditing(false);
      onChange(inputValue);
    }
  };

  return (
    <div
      className={`w-full rounded-t-sm flex justify-between items-center p-2 ${bgColorClass}`}
    >
      <div className="flex justify-start items-center gap-2">
        <Sheet size={18} className="text-neutral-800 dark:text-neutral-900" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          readOnly={!isEditing}
          className="text-sm font-bold text-neutral-800 dark:text-neutral-900 bg-transparent outline-none border-none"
        />
      </div>
      <div className="flex justify-end gap-2 items-center">
        <TooltipWrapper content={"컬럼을 추가합니다."}>
          <Grid2X2Plus
            size={18}
            className="text-neutral-800 dark:text-neutral-900 hover:text-neutral-100 dark:hover:text-neutral-200 duration-200"
            onClick={onAddColumn}
          />
        </TooltipWrapper>
        <TooltipWrapper content={"스키마를 삭제합니다."}>
          <Trash2
            size={18}
            className="text-neutral-800 dark:text-neutral-900 hover:text-destructive dark:hover:text-red-500 duration-200"
            onClick={onRemove}
          />
        </TooltipWrapper>
        <TooltipWrapper content={"스키마를 복제합니다."}>
          <Copy
            size={18}
            className="text-neutral-800 dark:text-neutral-900 hover:text-neutral-100 dark:hover:text-neutral-200 duration-200"
            onClick={onCopy}
          />
        </TooltipWrapper>

        <GripVertical
          size={18}
          className="text-neutral-800 dark:text-neutral-900 hover:text-neutral-100 dark:hover:text-neutral-200 duration-200"
        />
      </div>
    </div>
  );
}

export default NodeHeader;
