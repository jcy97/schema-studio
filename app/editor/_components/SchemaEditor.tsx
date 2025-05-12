"use client";
import { AppNode, Relationship } from "@/types/appNode";
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  ReactFlow,
  ReactFlowProps,
  useReactFlow,
  NodeChange,
  NodeRemoveChange,
  ColorMode,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState } from "react";
import DeleteableEdge from "./edges/DeletableEdge";
import NodeComponent from "./nodes/NodeComponent";
import "@xyflow/react/dist/style.css";
import { useSchema } from "@/contexts/SchemaContext";
import { Plus, Save, Play, FilePlus2 } from "lucide-react"; // 아이콘 추가
import TooltipWrapper from "@/components/TooltipWrapper";
import GenerateSqlDialog from "./GenerateSqlDialog";
import SchemaFileDialog from "./SchemaFileDialog";
import { FileService, SchemaFile } from "@/services/fileService";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { CloudIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  // 테마 모드
  const { theme } = useTheme();
  // 스키마 컨텍스트에서 필요한 메서드와 상태 가져오기
  const schema = useSchema();
  const {
    nodes,
    edges,
    relationships,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    addNode,
    addEdge,
    removeNode,
    addRelationship,
  } = schema;

  // 파일 관리를 위한 상태
  const [isFileDialogOpen, setIsFileDialogOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    lastModified: string;
    googleDriveId?: string;
  } | null>(null);
  const [isFileDirty, setIsFileDirty] = useState<boolean>(false);

  const reactFlowInstance = useReactFlow();
  const { data: session, status } = useSession();

  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isSessionExpired = () => {
    if (!session || !session.expiresAt) {
      return true; // 세션 정보가 없으면 만료된 것으로 간주
    }

    // 현재 시간과 만료 시간 비교 (expiresAt은 UNIX 타임스탬프)
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= session.expiresAt;
  };

  useEffect(() => {
    // 로그인되어 있고 Google Drive 파일을 사용 중인데 세션이 만료된 경우
    if (
      status === "authenticated" &&
      currentFile?.googleDriveId &&
      isSessionExpired()
    ) {
      // 세션 만료 처리
      setIsFileDialogOpen(true);
      toast.error("Google 계정 세션이 만료되었습니다. 다시 로그인해주세요.");
    }
  }, [status, session, currentFile]);

  // 세션 상태 변화 감지
  useEffect(() => {
    // 구글 드라이브 ID가 있는 파일이 선택되어 있고, 세션이 없는 경우
    if (
      currentFile?.googleDriveId &&
      status === "unauthenticated" &&
      !isFileDialogOpen
    ) {
      // 세션이 끊어졌으므로 파일 다이얼로그 표시
      setIsFileDialogOpen(true);

      // 드라이브 관련 작업이 필요한 파일은 세션이 필요함을 알림
      toast.error(
        "Google 계정 세션이 만료되었습니다. 다시 로그인하거나 다른 파일을 선택해주세요."
      );
    }
  }, [status, currentFile, isFileDialogOpen]);

  // 컴포넌트 마운트 시 초기 파일 확인
  useEffect(() => {
    // 로컬스토리지에서 현재 파일 정보 확인
    const storedFile = localStorage.getItem("currentSchemaFile");

    if (storedFile) {
      try {
        const fileInfo = JSON.parse(storedFile);
        setCurrentFile(fileInfo);
      } catch (e) {
        console.error("저장된 파일 정보 로드 실패:", e);
        // 파일 정보가 손상된 경우 파일 다이얼로그 표시
        setIsFileDialogOpen(true);
      }
    } else {
      // 현재 관리 중인 파일이 없으면 다이얼로그 표시
      setIsFileDialogOpen(true);
    }
  }, []);

  // 노드, 엣지, 관계 변경 시 파일 상태 갱신
  useEffect(() => {
    if (currentFile) {
      setIsFileDirty(true);
    }
  }, [nodes, edges, relationships]);

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

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFileDirty]);

  // 자동 저장 타이머 설정
  useEffect(() => {
    if (autoSaveEnabled && currentFile && session?.accessToken && isFileDirty) {
      // 이전 타이머 취소
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // 10초 후에 자동 저장 (원하는 시간으로 조정 가능)
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 10000);

      setAutoSaveTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [
    nodes,
    edges,
    relationships,
    autoSaveEnabled,
    currentFile,
    session,
    isFileDirty,
  ]);

  // 자동 저장 토글 함수
  const toggleAutoSave = () => {
    if (!session) {
      alert("자동 저장을 사용하려면 Google 계정으로 로그인해야 합니다.");
      return;
    }

    setAutoSaveEnabled(!autoSaveEnabled);
  };

  // 자동 저장 함수
  const handleAutoSave = async () => {
    if (!currentFile || !session || !isFileDirty) return;

    try {
      await FileService.saveSchemaToGoogleDrive(
        currentFile.name,
        nodes,
        relationships,
        {
          name: currentFile.name,
          lastModified: new Date().toISOString(),
        },
        currentFile.googleDriveId
      );

      // 파일 상태 업데이트
      setCurrentFile({
        ...currentFile,
        lastModified: new Date().toISOString(),
      });

      setIsFileDirty(false);
      console.log("자동 저장 완료:", currentFile.name);
    } catch (error) {
      console.error("자동 저장 오류:", error);
    }
  };

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

  // 스키마 데이터 초기화 (새 파일 생성 시 사용)
  const resetSchemaData = () => {
    try {
      // 1. 각 노드를 제거하는 변경사항 생성
      if (nodes && nodes.length > 0) {
        const removeChanges: NodeRemoveChange[] = nodes.map((node) => ({
          type: "remove",
          id: node.id,
        }));

        // 변경사항 적용
        onNodesChange(removeChanges);
      }

      console.log("스키마 데이터 초기화 완료");
    } catch (error) {
      console.error("스키마 데이터 초기화 오류:", error);
    }
  };

  // Google Drive 파일 저장 처리
  const handleSave = async () => {
    if (!currentFile) {
      // 현재 관리 중인 파일이 없으면 새 파일 다이얼로그 표시
      setIsFileDialogOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      if (session) {
        // Google Drive에 저장
        const fileId = await FileService.saveSchemaToGoogleDrive(
          currentFile.name,
          nodes,
          relationships,
          {
            name: currentFile.name,
            lastModified: new Date().toISOString(),
          },
          currentFile.googleDriveId
        );

        // 파일 상태 업데이트
        setCurrentFile({
          ...currentFile,
          lastModified: new Date().toISOString(),
          googleDriveId: fileId,
        });

        setIsFileDirty(false);
        toast.success(`파일이 저장되었습니다.`);
      } else {
        // 로그인되지 않은 경우 로컬 저장으로 폴백
        FileService.saveSchemaToFile(currentFile.name, nodes, relationships, {
          name: currentFile.name,
          lastModified: new Date().toISOString(),
        });

        // 파일 상태 업데이트
        setCurrentFile({
          ...currentFile,
          lastModified: new Date().toISOString(),
        });

        setIsFileDirty(false);

        // 사용자에게 저장 안내 메시지 표시
        alert(
          `${currentFile.name}.scst 파일이 다운로드 되었습니다.\n다운로드 폴더를 확인해주세요.`
        );
      }
    } catch (error) {
      console.error("파일 저장 오류:", error);
      alert(
        `파일 저장 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Google Drive 파일 열기 처리
  const handleOpenGoogleDriveFile = async (fileId: string) => {
    if (!session?.accessToken) {
      alert("Google Drive 파일에 접근하려면 로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);

    try {
      // Google Drive에서 파일 로드
      const schemaFile = await FileService.loadSchemaFromGoogleDrive(fileId);

      // 파일 정보 업데이트
      const fileInfo = {
        name: schemaFile.metadata.name,
        lastModified: new Date().toISOString(),
        googleDriveId: fileId,
      };

      // 스키마 로드 (기존 코드와 동일)
      await handleOpenFile(schemaFile);

      // 파일 정보 업데이트
      setCurrentFile(fileInfo);

      console.log("Google Drive에서 파일 로드 완료:", schemaFile.metadata.name);
    } catch (error) {
      console.error("Google Drive 파일 로드 오류:", error);
      alert(
        `Google Drive 파일 로드 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 새 파일 생성 다이얼로그 표시
  const handleNewFile = () => {
    setIsFileDialogOpen(true);
  };

  // 새 파일 생성 처리
  const handleCreateFile = (fileName: string, description: string) => {
    // 기존 스키마 데이터 초기화
    resetSchemaData();

    // 빈 스키마 데이터로 새 파일 생성
    FileService.saveSchemaToFile(
      fileName,
      [], // 빈 노드 배열
      [], // 빈 관계 배열
      {
        name: fileName,
        description: description,
        createdAt: new Date().toISOString(),
      }
    );

    // 현재 파일 정보 업데이트
    setCurrentFile({
      name: fileName,
      lastModified: new Date().toISOString(),
    });

    setIsFileDirty(false);

    console.log("새 스키마 파일 생성:", fileName);
  };

  const handleCloseFileDialog = () => {
    // 현재 파일이 없는 상태에서는 다이얼로그를 닫지 않음
    if (!currentFile) {
      // 사용자에게 파일 선택이 필요하다는 메시지 표시
      toast.error("작업을 시작하려면 파일을 생성하거나 선택해야 합니다.");
      return;
    }

    setIsFileDialogOpen(false);
  };

  // 관계 추가 함수
  const addRelationships = (relationshipsToAdd: Relationship[]) => {
    if (!relationshipsToAdd || relationshipsToAdd.length === 0) return;

    // 각 관계를 개별적으로 추가
    relationshipsToAdd.forEach((rel) => {
      try {
        if (typeof addRelationship === "function") {
          addRelationship(rel);
        }
      } catch (err) {
        console.error("관계 추가 오류:", err);
      }
    });
  };

  // 기존 파일 열기 처리
  const handleOpenFile = (schemaFile: SchemaFile) => {
    try {
      console.log("로드할 파일 데이터:", schemaFile); // 디버깅용

      // 유효성 검사
      if (!Array.isArray(schemaFile.nodes)) {
        throw new Error("파일 형식 오류: 노드 배열이 없거나 유효하지 않습니다");
      }

      // 1. 기존 노드 모두 삭제
      resetSchemaData();

      // 2. 새 노드 추가
      // 위치 정보 및 타입 확인하고 기본값 추가
      const validNodes = schemaFile.nodes.map((node) => ({
        ...node,
        position: node.position || { x: 0, y: 0 },
        type: node.type || "SchemaNode",
      }));

      // 관계 정보 저장 (노드 추가 후 적용할 예정)
      const validRelationships = schemaFile.relationships || [];

      // 각 노드를 개별적으로 추가
      setTimeout(() => {
        if (validNodes && validNodes.length > 0) {
          // 각 노드에 대해 수동으로 addNode 호출
          validNodes.forEach((node) => {
            addNode(node);
          });

          console.log("노드 추가 완료:", validNodes.length);

          // 노드 추가 후 관계 추가
          setTimeout(() => {
            if (validRelationships.length > 0) {
              addRelationships(validRelationships);
              console.log("관계 추가 완료:", validRelationships.length);
            }

            // 화면 업데이트
            setTimeout(() => {
              reactFlowInstance.fitView();
            }, 200);
          }, 300);
        }
      }, 100);

      // 현재 파일 정보 업데이트
      setCurrentFile({
        name: schemaFile.metadata.name,
        lastModified: new Date().toISOString(),
      });

      setIsFileDirty(false);

      console.log("스키마 파일 로드 완료:", schemaFile.metadata.name);
    } catch (error) {
      console.error("스키마 파일 로드 오류:", error);
      alert(
        `스키마 파일 로드 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
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
          <div className="absolute top-4 left-28 bg-white/80 px-3 py-1 border rounded-md shadow-sm text-sm dark:bg-background dark:text-white">
            {currentFile.name}.scst {isFileDirty && "*"}
          </div>
        )}

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
              className={`w-10 h-10 bg-primary hover:bg-primary/80 text-white rounded-full flex items-center justify-center
              cursor-pointer shadow-md ${isFileDirty ? "animate-pulse" : ""}`}
              onClick={handleSave}
            >
              <Save size={20} />
            </div>
          </TooltipWrapper>
          {/* UI에 자동 저장 토글 버튼 추가 */}
          <TooltipWrapper
            content={autoSaveEnabled ? "자동 저장 끄기" : "자동 저장 켜기"}
          >
            <div
              className={`w-10 h-10 ${
                autoSaveEnabled ? "bg-green-500" : "bg-gray-400"
              } hover:opacity-80 text-white rounded-full flex items-center justify-center
    cursor-pointer shadow-md`}
              onClick={toggleAutoSave}
            >
              <CloudIcon size={20} />
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

      {/* 파일 다이얼로그 */}
      <SchemaFileDialog
        isOpen={isFileDialogOpen || !currentFile}
        onClose={handleCloseFileDialog}
        onCreateFile={handleCreateFile}
        onOpenFile={handleOpenFile}
        onOpenGoogleDriveFile={handleOpenGoogleDriveFile}
      />
    </main>
  );
}

export default SchemaEditor;
