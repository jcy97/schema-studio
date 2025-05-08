// components/FileManager.tsx
import React, { useEffect, useState } from "react";
import { useSchema } from "@/contexts/SchemaContext";
import {
  FileService,
  SchemaFileMetadata,
  SchemaFile,
} from "@/services/fileService";
import { useNodesState } from "@xyflow/react";
import NewFileDialog from "./NewFileDialog";

interface FileInfo {
  name: string;
  lastModified: string;
  description?: string;
}

/**
 * 파일 관리 컴포넌트
 * Editor 컴포넌트 내부에서 사용
 */
const FileManager: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [isFileDirty, setIsFileDirty] = useState<boolean>(false);

  // SchemaContext에서 필요한 메서드와 상태 가져오기
  const schema = useSchema();

  // useSchema를 통해 필요한 상태들을 추출
  const { nodes, relationships, setNodes, setRelationships } = schema as any; // 타입 캐스팅 (실제로는 인터페이스 확장이 필요)

  // 컴포넌트 마운트 시 초기 파일 다이얼로그 표시
  useEffect(() => {
    const lastFileInfo = localStorage.getItem("lastSchemaFile");

    if (lastFileInfo) {
      try {
        const fileInfo = JSON.parse(lastFileInfo) as FileInfo;
        setCurrentFile(fileInfo);
      } catch (e) {
        console.error("저장된 파일 정보 로드 실패:", e);
        showNewFileDialog();
      }
    } else {
      // 저장된 파일 정보가 없으면 다이얼로그 표시
      showNewFileDialog();
    }
  }, []);

  // 노드나 관계 변경 시 파일 상태 갱신
  useEffect(() => {
    if (currentFile) {
      setIsFileDirty(true);
    }
  }, [nodes, relationships]);

  // 새 파일 다이얼로그 표시
  const showNewFileDialog = () => {
    setIsDialogOpen(true);
  };

  // 파일 생성 완료 처리
  const handleFileCreated = (
    fileName: string,
    metadata: Partial<SchemaFileMetadata>
  ) => {
    setCurrentFile({
      name: fileName,
      lastModified: new Date().toISOString(),
      description: metadata.description,
    });
    setIsFileDirty(false);
  };

  // 파일 로드 완료 처리 - loadSchemaFromFile 대신 직접 구현
  const handleFileLoaded = (fileName: string, fileData: SchemaFile) => {
    try {
      // 스키마 데이터 검증
      if (!Array.isArray(fileData.nodes)) {
        throw new Error("유효하지 않은 스키마 파일: 노드 데이터가 없습니다");
      }

      // 노드와 관계 상태 업데이트
      // 실제 구현에서는 ReactFlow의 상태 관리 훅 사용 필요
      if (typeof setNodes === "function") {
        setNodes(fileData.nodes);
      } else {
        console.error("setNodes 함수를 사용할 수 없습니다.");
      }

      if (typeof setRelationships === "function") {
        setRelationships(fileData.relationships || []);
      } else {
        console.error("setRelationships 함수를 사용할 수 없습니다.");
      }

      // 현재 파일 정보 업데이트
      setCurrentFile({
        name: fileName,
        lastModified: new Date().toISOString(),
        description: fileData.metadata?.description,
      });

      setIsFileDirty(false);

      // 로컬 스토리지에 마지막 파일 정보 저장
      localStorage.setItem(
        "lastSchemaFile",
        JSON.stringify({
          name: fileName,
          lastModified: new Date().toISOString(),
          description: fileData.metadata?.description,
        })
      );

      console.log("스키마 파일 로드 완료:", fileName);
    } catch (error) {
      console.error("스키마 파일 로드 오류:", error);
      alert(
        `스키마 파일 로드 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // 파일 저장
  const saveCurrentFile = () => {
    if (!currentFile) return;

    FileService.saveSchemaToFile(currentFile.name, nodes, relationships, {
      name: currentFile.name,
      description: currentFile.description,
    });

    setCurrentFile({
      ...currentFile,
      lastModified: new Date().toISOString(),
    });

    setIsFileDirty(false);
  };

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

  // 주기적 자동 저장 (5분마다)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentFile && isFileDirty) {
        saveCurrentFile();
        console.log("자동 저장 완료:", currentFile.name);
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(autoSaveInterval);
  }, [currentFile, isFileDirty, nodes, relationships]);

  return (
    <>
      <NewFileDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onFileCreated={handleFileCreated}
        onFileLoaded={handleFileLoaded}
      />
    </>
  );
};

export default FileManager;
