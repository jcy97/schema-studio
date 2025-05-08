"use client";
import { AppNode } from "@/types/appNode";
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  ReactFlow,
  ReactFlowProps,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback } from "react";
import DeleteableEdge from "./edges/DeletableEdge";
import NodeComponent from "./nodes/NodeComponent";
import "@xyflow/react/dist/style.css";
import { useSchema } from "@/contexts/SchemaContext";
import { Plus, Save, Play, FilePlus2 } from "lucide-react"; // 아이콘 추가
import TooltipWrapper from "@/components/TooltipWrapper";
import GenerateSqlDialog from "./GenerateSqlDialog";

const nodeTypes = {
  SchemaNode: NodeComponent,
};

const edgeTypes = {
  default: DeleteableEdge,
  deletableEdge: DeleteableEdge,
};

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 1 };

function SchemaEditor() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    addNode,
    addEdge,
  } = useSchema();
  const reactFlowInstance = useReactFlow();

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

  const handleSave = () => {
    console.log("저장 기능 실행");
    // 저장 로직 추가
  };

  const handleNewFile = () => {
    console.log("새 파일 생성");
    // 새 파일 생성 로직 추가
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection);
    },
    [addEdge]
  );

  return (
    <main className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        //자동 저장 구현을 원할경우 아래 체인지 함수에 뮤테이션 걸어주면 된다.
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onSelectionChange={onNodeSelectionChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={snapGrid}
        fitViewOptions={fitViewOptions}
        fitView
      >
        <Controls position="top-left" fitViewOptions={fitViewOptions} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* 액션 버튼 그룹 */}
        <div className="absolute top-4 right-4 flex space-x-3 z-10">
          {/* 새 파일 생성 버튼 */}
          <TooltipWrapper content="새 파일을 생성합니다">
            <div
              className="w-10 h-10 bg-primary hover:bg-primary/80 text-white rounded-full flex items-center justify-center
              cursor-pointer shadow-md"
              onClick={handleNewFile}
            >
              <FilePlus2 size={20} />
            </div>
          </TooltipWrapper>

          {/* 저장 버튼 */}
          <TooltipWrapper content="현재 작업을 저장합니다">
            <div
              className="w-10 h-10 bg-primary hover:bg-primary/80 text-white rounded-full flex items-center justify-center
              cursor-pointer shadow-md"
              onClick={handleSave}
            >
              <Save size={20} />
            </div>
          </TooltipWrapper>
          <TooltipWrapper content="SQL을 생성합니다">
            <div>
              <GenerateSqlDialog />
            </div>
          </TooltipWrapper>

          {/* 새 스키마 추가 버튼 */}
          <TooltipWrapper content="새 스키마를 추가합니다">
            <div
              className="w-10 h-10 bg-primary hover:bg-primary/80 text-white rounded-full flex items-center justify-center
              cursor-pointer shadow-md"
              onClick={handleAddNode}
            >
              <Plus size={20} />
            </div>
          </TooltipWrapper>
        </div>
      </ReactFlow>
    </main>
  );
}

export default SchemaEditor;
