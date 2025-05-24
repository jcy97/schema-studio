"use client";
import { AppNode, Relationship } from "@/types/appNode";
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  ReactFlowProps,
  useReactFlow,
  NodeRemoveChange,
  ColorMode,
  ReactFlow,
} from "@xyflow/react";
import React, { useCallback, useEffect } from "react";
import DeleteableEdge from "./edges/DeletableEdge";
import NodeComponent from "./nodes/NodeComponent";
import "@xyflow/react/dist/style.css";
import { useSchema } from "@/contexts/SchemaContext";
import {
  Plus,
  Save,
  FolderOpen,
  Cloud,
  Download,
  UploadCloud,
} from "lucide-react";
import TooltipWrapper from "@/components/TooltipWrapper";
import GenerateSqlDialog from "./GenerateSqlDialog";
import SchemaFileDialog from "./SchemaFileDialog";
import { SchemaFile } from "@/services/fileService";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useSchemaFile } from "@/hooks/useSchemaFile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// 상수 정의
const nodeTypes = { SchemaNode: NodeComponent };
const edgeTypes = { default: DeleteableEdge, deletableEdge: DeleteableEdge };
const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 1 };

function SchemaEditor() {
  // 테마 관련
  const { theme } = useTheme();
  const reactFlowInstance = useReactFlow();
  const { data: session, status } = useSession();

  // 스키마 컨텍스트
  const {
    nodes,
    edges,
    relationships,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    addNode,
    addEdge,
    addRelationship,
    resetSchemaData,
  } = useSchema();

  // 파일 열기 처리
  const handleOpenFile = useCallback(
    async (schemaFile: SchemaFile) => {
      try {
        if (!Array.isArray(schemaFile.nodes)) {
          throw new Error(
            "파일 형식 오류: 노드 배열이 없거나 유효하지 않습니다"
          );
        }

        // 기존 노드 삭제
        resetSchemaData();

        // 노드 및 관계 준비
        const validNodes = schemaFile.nodes.map((node) => ({
          ...node,
          position: node.position || { x: 0, y: 0 },
          type: node.type || "SchemaNode",
        }));
        const validRelationships = schemaFile.relationships || [];

        // 비동기 작업 순차 처리
        setTimeout(() => {
          // 노드 추가
          validNodes.forEach((node) => addNode(node));

          // 관계 추가
          setTimeout(() => {
            validRelationships.forEach((rel) => {
              if (typeof addRelationship === "function") {
                addRelationship(rel);
              }
            });

            // 화면 업데이트
            setTimeout(() => reactFlowInstance.fitView(), 200);
          }, 300);
        }, 100);

        return Promise.resolve();
      } catch (error) {
        console.error("스키마 파일 로드 오류:", error);
        return Promise.reject(error);
      }
    },
    [resetSchemaData, addNode, addRelationship, reactFlowInstance]
  );

  // 파일 관리 훅 사용
  const {
    currentFile,
    isFileDirty,
    isFileDialogOpen,
    isLoading,
    autoSaveEnabled,
    createFile,
    saveFile,
    syncToGoogleDrive,
    openLocalFile,
    openGoogleDriveFile,
    deleteFile,
    exportFile,
    openFileDialog,
    closeFileDialog,
    toggleAutoSave,
  } = useSchemaFile({
    nodes,
    relationships,
    resetSchemaData,
    onOpenFile: handleOpenFile,
    session,
  });

  // 초기 로드: 파일이 없으면 다이얼로그 표시
  useEffect(() => {
    if (!currentFile && !isFileDialogOpen && nodes.length === 0) {
      openFileDialog();
    }
  }, [currentFile, isFileDialogOpen, nodes.length, openFileDialog]);

  // 창 닫기 전 저장 확인
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFileDirty) {
        const message =
          "저장되지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFileDirty]);

  // 노드 선택 처리
  const onNodeSelectionChange = useCallback(
    (data: ReactFlowProps<AppNode, any>) => {
      if (!data.nodes) return;
      const selectedNode = data.nodes.find((node) => node.selected === true);
      if (selectedNode) {
        onNodeSelect(selectedNode.id);
      }
    },
    [onNodeSelect]
  );

  // 노드 추가
  const handleAddNode = useCallback(() => {
    const newNodeId = addNode();
    setTimeout(() => {
      const addedNode = reactFlowInstance.getNode(newNodeId);
      if (addedNode) {
        reactFlowInstance.setCenter(
          addedNode.position.x + 150,
          addedNode.position.y + 150,
          { zoom: 1, duration: 500 }
        );
      }
    }, 100);
  }, [addNode, reactFlowInstance]);

  // 엣지 연결
  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection);
    },
    [addEdge]
  );

  return (
    <main className="w-full h-full">
      {(isLoading || status === "loading") && <LoadingOverlay />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onSelectionChange={onNodeSelectionChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={snapGrid}
        colorMode={theme as ColorMode}
        fitViewOptions={fitViewOptions}
        fitView
      >
        <Controls position="top-left" fitViewOptions={fitViewOptions} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* 파일 상태 표시 */}
        {currentFile && (
          <div className="absolute top-4 left-28 bg-white/80 dark:bg-background/80 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2 text-sm">
            <span className="font-medium">{currentFile.name}.scst</span>
            {isFileDirty && <span className="text-red-500">*</span>}
            {currentFile.googleDriveId && (
              <Badge variant="secondary" className="text-xs">
                <Cloud size={12} className="mr-1" />
                동기화
              </Badge>
            )}
          </div>
        )}

        {/* 액션 버튼 그룹 */}
        <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
          {/* 파일 메뉴 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full shadow-md"
              >
                <FolderOpen size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={openFileDialog}>
                <FolderOpen size={16} className="mr-2" />
                파일 열기/생성
              </DropdownMenuItem>
              <DropdownMenuItem onClick={saveFile} disabled={!isFileDirty}>
                <Save size={16} className="mr-2" />
                저장 {isFileDirty && "*"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportFile}>
                <Download size={16} className="mr-2" />
                파일 내보내기
              </DropdownMenuItem>
              {currentFile && !currentFile.googleDriveId && session && (
                <DropdownMenuItem onClick={syncToGoogleDrive}>
                  <UploadCloud size={16} className="mr-2" />
                  구글 드라이브에 동기화
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 자동 저장 토글 */}
          <TooltipWrapper
            content={autoSaveEnabled ? "자동 저장 켜짐" : "자동 저장 꺼짐"}
          >
            <Button
              variant={autoSaveEnabled ? "default" : "secondary"}
              size="icon"
              className="rounded-full shadow-md"
              onClick={toggleAutoSave}
            >
              <Cloud
                size={20}
                className={autoSaveEnabled ? "animate-pulse" : ""}
              />
            </Button>
          </TooltipWrapper>

          {/* SQL 생성 버튼 */}
          <TooltipWrapper content="SQL 생성">
            <div>
              <GenerateSqlDialog />
            </div>
          </TooltipWrapper>

          {/* 새 스키마 추가 버튼 */}
          <TooltipWrapper content="새 테이블 추가">
            <Button
              variant="default"
              size="icon"
              className="rounded-full shadow-md"
              onClick={handleAddNode}
            >
              <Plus size={20} />
            </Button>
          </TooltipWrapper>
        </div>
      </ReactFlow>

      {/* 파일 다이얼로그 */}
      <SchemaFileDialog
        isOpen={isFileDialogOpen}
        onClose={closeFileDialog}
        onCreateFile={createFile}
        onOpenLocalFile={openLocalFile}
        onOpenGoogleDriveFile={openGoogleDriveFile}
        onDeleteFile={deleteFile}
      />
    </main>
  );
}

export default SchemaEditor;
