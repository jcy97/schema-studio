import React from "react";

interface TitleHeaderProps {
  logicalName: string;
  physicalName: string;
}

function TitleHeader({ logicalName, physicalName }: TitleHeaderProps) {
  return (
    <div className="flex flex-col py-1">
      <p>{logicalName}</p>
      <p>{physicalName}</p>
    </div>
  );
}

export default TitleHeader;
