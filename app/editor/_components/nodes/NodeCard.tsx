import { cn } from "@/lib/utils";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React from "react";

function NodeCard({
  nodeId,
  isSelected,
  children,
}: {
  nodeId: string;
  isSelected: boolean;
  children: React.ReactNode;
}) {
  const { getNode, setCenter } = useReactFlow();

  // 핸들 스타일 - 모든 핸들에 공통으로 적용
  const handleStyle = {
    background: "#555",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  };

  return (
    <div
      onDoubleClick={() => {
        const node = getNode(nodeId);
        if (!node) return;
        const { position, measured } = node;
        if (!position || !measured) return;
        const { width, height } = measured;
        const x = position.x + width! / 2;
        const y = position.y + height! / 2;
        if (x === undefined || y === undefined) return;
        setCenter(x, y, {
          zoom: 1,
          duration: 500,
        });
      }}
      className={cn(
        "rounded-md cursor-pointer bg-background dark:bg-gray-800 border-2 border-separate w-[320px] h-[300px] text-xs gap-1 flex flex-col relative",
        isSelected
          ? "border-primary dark:border-blue-500"
          : "border-gray-200 dark:border-gray-700"
      )}
    >
      {/* 상단 핸들 - source와 target을 겹쳐서 배치 */}
      <Handle
        type="source"
        position={Position.Top}
        style={handleStyle}
        id={`${nodeId}-top-source`}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle}
        id={`${nodeId}-top-target`}
      />

      {/* 우측 핸들 */}
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
        id={`${nodeId}-right-source`}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={handleStyle}
        id={`${nodeId}-right-target`}
      />

      {/* 하단 핸들 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
        id={`${nodeId}-bottom-source`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={handleStyle}
        id={`${nodeId}-bottom-target`}
      />

      {/* 좌측 핸들 */}
      <Handle
        type="source"
        position={Position.Left}
        style={handleStyle}
        id={`${nodeId}-left-source`}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle}
        id={`${nodeId}-left-target`}
      />

      {children}
    </div>
  );
}

export default NodeCard;
