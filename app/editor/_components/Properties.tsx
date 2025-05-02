"use client";
import { useSchema } from "@/contexts/SchemaContext";
import React from "react";
import TitleHeader from "./properties/TitleHeader";
import EmptyPropertiesGuide from "./properties/EmptyPropertiesGuide";

function Properties() {
  const schema = useSchema();

  const selectedNode = schema.getSelectedNode();

  return (
    <div className="w-[340px] min-w-[340px] border-l-2 border-separate h-full p-2 px-4 overflow-auto bg-background">
      {selectedNode.data ? (
        <TitleHeader
          logicalName={selectedNode.data.logicalName}
          physicalName={selectedNode.data.physicalName}
        />
      ) : (
        <EmptyPropertiesGuide />
      )}
    </div>
  );
}

export default Properties;
