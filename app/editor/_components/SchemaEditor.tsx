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
  useReactFlow,
} from "@xyflow/react";
import React, { useEffect } from "react";
import DeleteableEdge from "./edges/DeletableEdge";
import NodeComponent from "./nodes/NodeComponent";
import "@xyflow/react/dist/style.css";
import { useSchema } from "@/contexts/SchemaContext";
import { Plus } from "lucide-react";
import TooltipWrapper from "@/components/TooltipWrapper";

const nodeTypes = {
  SchemaNode: NodeComponent,
};

const edgeTypes = {
  default: DeleteableEdge,
};

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 1 };

function SchemaEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange, onNodeSelect, addNode } =
    useSchema();
  const reactFlowInstance = useReactFlow();

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

  const handleAddNode = () => {
    const newNodeId = addNode();

    setTimeout(() => {
      const addedNode = reactFlowInstance.getNode(newNodeId);
      if (!addedNode) return;

      reactFlowInstance.setCenter(
        addedNode.position.x + 150,
        addedNode.position.y + 150,
        { zoom: 1, duration: 500 }
      );
    }, 100);
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
        <TooltipWrapper content="새 스키마를 추가합니다.">
          <div
            className="absolute top-4 right-4 w-10 h-10 bg-primary hover:bg-primary/80 text-white rounded-full flex items-center justify-center
        cursor-pointer shadow-md z-10"
            onClick={handleAddNode}
          >
            <Plus size={24} />
          </div>
        </TooltipWrapper>
      </ReactFlow>
    </main>
  );
}

export default SchemaEditor;
