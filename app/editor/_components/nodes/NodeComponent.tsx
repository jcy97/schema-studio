import { AppNodeData } from "@/types/appNode";
import { NodeProps } from "@xyflow/react";
import React, { memo } from "react";
import NodeCard from "./NodeCard";
import NodeHeader from "./NodeHeader";

const NodeComponent = memo((props: NodeProps) => {
  const nodeData = props.data as AppNodeData;
  return (
    <NodeCard nodeId={props.id} isSelected={!!props.selected}>
      <NodeHeader logicalName={nodeData.logicalName} color={nodeData.color} />
    </NodeCard>
  );
});

export default NodeComponent;
