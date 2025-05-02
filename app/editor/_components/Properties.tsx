"use client";
import { useSchema } from "@/contexts/SchemaContext";
import React from "react";
import TitleHeader from "./properties/TitleHeader";
import EmptyPropertiesGuide from "./properties/EmptyPropertiesGuide";

function Properties() {
  const schema = useSchema();
  const selectedNode = schema.getSelectedNode();

  // 노드 속성 업데이트 핸들러 함수
  const handlePropertyChange = (
    propertyKey: string,
    value: string | number
  ) => {
    if (selectedNode) {
      // 타입 안전성을 위해 명시적으로 타입 체크
      schema.updateNode(selectedNode.id, { [propertyKey]: value });
    }
  };

  return (
    <div className="w-[340px] min-w-[340px] border-l-2 border-separate h-full p-2 px-4 overflow-auto bg-background">
      {selectedNode?.data ? (
        <>
          <TitleHeader
            logicalName={selectedNode.data.logicalName}
            physicalName={selectedNode.data.physicalName}
            onLogicalNameChange={(value) =>
              handlePropertyChange("logicalName", value as string)
            }
            onPhysicalNameChange={(value) =>
              handlePropertyChange("physicalName", value as string)
            }
          />
          {/* 여기에 다른 속성 섹션들 추가 가능 */}
        </>
      ) : (
        <EmptyPropertiesGuide />
      )}
    </div>
  );
}

export default Properties;
