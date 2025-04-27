import { AppNodeData } from "@/types/appNode";
import { NodeProps } from "@xyflow/react";
import React, { memo } from "react";
import NodeCard from "./NodeCard";

const NodeComponent = memo((props: NodeProps) => {
  const nodeData = props.data as AppNodeData;
  return (
    <NodeCard nodeId={props.id} isSelected={!!props.selected}>
      {nodeData.logicalName}
    </NodeCard>
  );
});

export default NodeComponent;
