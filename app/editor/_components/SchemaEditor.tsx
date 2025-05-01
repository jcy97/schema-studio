"use client";
import { initialNodes } from "@/sample";
import { AppNode } from "@/types/appNode";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { DragEventHandler, useEffect } from "react";
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
  const { nodes, edges, onNodesChange, onEdgesChange } = useSchema();
  //복사 샘플
  // useEffect(() => {
  //   addNode({ ...initialNodes[0], id: "12312312312" });
  // }, []);

  return (
    <main className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        //자동 저장 구현을 원할경우 아래 체인지 함수에 뮤테이션 걸어주면 된다.
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
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
