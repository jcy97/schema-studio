"use client";
import { initialNodes } from "@/sample";
import { AppNode } from "@/types/appNode";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  ReactFlow,
  ReactFlowProps,
} from "@xyflow/react";
import React, { useEffect } from "react";
import DeleteableEdge from "./edges/DeletableEdge";
import NodeComponent from "./nodes/NodeComponent";
import "@xyflow/react/dist/style.css";
import { useSchema } from "@/contexts/SchemaContext";

const nodeTypes = {
  SchemaNode: NodeComponent,
};

const edgeTypes = {
  default: DeleteableEdge,
};

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 1 };

function SchemaEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange, onNodeSelect } =
    useSchema();
  //복사 샘플
  // useEffect(() => {
  //   addNode({ ...initialNodes[0], id: "12312312312" });
  // }, []);

  useEffect(() => {
    console.log("노드 상태 변경됨:", nodes);
    // 필요한 경우 여기서 후속 작업 수행
  }, [nodes]);

  //Selection 확인
  const onNodeSelectionChange = (data: ReactFlowProps<AppNode, Edge>) => {
    if (!data.nodes) return;
    const selectedNode = data.nodes.find((node) => node.selected === true);
    if (!selectedNode) return;
    onNodeSelect(selectedNode.id);
  };

  return (
    <main className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        //자동 저장 구현을 원할경우 아래 체인지 함수에 뮤테이션 걸어주면 된다.
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onSelectionChange={onNodeSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={snapGrid}
        fitViewOptions={fitViewOptions}
        fitView
      >
        <Controls position="top-left" fitViewOptions={fitViewOptions} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </main>
  );
}

export default SchemaEditor;
