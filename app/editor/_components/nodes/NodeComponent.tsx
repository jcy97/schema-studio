import { AppNodeData, Column } from "@/types/appNode";
import { NodeProps } from "@xyflow/react";
import React, { memo, useState, useCallback, useEffect } from "react";
import NodeCard from "./NodeCard";
import NodeHeader from "./NodeHeader";
import NodeList from "./NodeList";
import { useSchema } from "@/contexts/SchemaContext";

const NodeComponent = memo((props: NodeProps) => {
  // props.data를 초기값으로 사용하여 상태 초기화
  const [nodeData, setNodeData] = useState<AppNodeData>(
    props.data as AppNodeData
  );

  // 스키마 컨텍스트에서 nodes 가져오기
  const { nodes } = useSchema();

  // nodes가 변경될 때마다 nodeData 업데이트
  useEffect(() => {
    console.log("node changes");

    // 현재 노드 ID에 해당하는 노드 찾기
    const currentNode = nodes.find((node) => node.id === props.id);
    console.log(currentNode);
    // 해당 노드가 존재하고 데이터가 있으면 상태 업데이트
    if (currentNode?.data) {
      setNodeData(currentNode.data);
    }
  }, [nodes, props.id]); // nodes나 props.id가 변경될 때 이펙트 실행

  return (
    <NodeCard nodeId={props.id} isSelected={!!props.selected}>
      <NodeHeader logicalName={nodeData.logicalName} color={nodeData.color} />
      <NodeList
        columns={nodeData.columns}
        onColumnsChange={(columns) => {
          // 여기에 컬럼 변경 로직 구현
        }}
      />
    </NodeCard>
  );
});

export default NodeComponent;
