import { AppNodeData, Column } from "@/types/appNode";
import { NodeProps } from "@xyflow/react";
import React, { memo, useState, useCallback } from "react";
import NodeCard from "./NodeCard";
import NodeHeader from "./NodeHeader";
import NodeList from "./NodeList";

const NodeComponent = memo((props: NodeProps) => {
  const nodeData = props.data as AppNodeData;
  const [columns, setColumns] = useState(nodeData.columns);

  const handleColumnsChange = useCallback((updatedColumns: Column[]) => {
    setColumns(updatedColumns);
    // 필요에 따라 여기서 부모 컴포넌트나 상태 관리 라이브러리에 변경 사항을 전달할 수 있습니다
    // 예: props.onNodeChange({ ...nodeData, columns: updatedColumns });
  }, []);

  return (
    <NodeCard nodeId={props.id} isSelected={!!props.selected}>
      <NodeHeader logicalName={nodeData.logicalName} color={nodeData.color} />
      <NodeList columns={columns} onColumnsChange={handleColumnsChange} />
    </NodeCard>
  );
});

export default NodeComponent;
