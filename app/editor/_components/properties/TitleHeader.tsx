import React from "react";
import PropertyInput from "./PropertyInput";

interface TitleHeaderProps {
  logicalName: string;
  physicalName: string;
  onLogicalNameChange: (value: string | number) => void;
  onPhysicalNameChange: (value: string | number) => void;
}

function TitleHeader({
  logicalName,
  physicalName,
  onLogicalNameChange,
  onPhysicalNameChange,
}: TitleHeaderProps) {
  return (
    <div className="flex flex-col">
      <div className="py-2">
        <p className="text-lg font-bold">스키마 기본 정보</p>
      </div>
      <PropertyInput
        title="논리명"
        value={logicalName}
        type="text"
        onChange={onLogicalNameChange}
      />
      <PropertyInput
        title="물리명"
        value={physicalName}
        type="text"
        onChange={onPhysicalNameChange}
      />
    </div>
  );
}

export default TitleHeader;
