import { useState, useEffect, useCallback } from "react";
import { AppNode, Relationship } from "@/types/appNode";
import { FileService, SchemaFile } from "@/services/fileService";
import { toast } from "sonner";
import {
  FileInfo,
  loadSchemaFromStorage,
  saveSchemaToStorage,
  saveFileToGoogle,
  saveFileLocally,
} from "@/lib/fileUtils";

interface UseSchemaFileProps {
  nodes: AppNode[];
  relationships: Relationship[];
  resetSchemaData: () => void;
  onOpenFile: (schemaFile: SchemaFile) => Promise<void>;
  session: any;
}

export const useSchemaFile = ({
  nodes,
  relationships,
  resetSchemaData,
  onOpenFile,
  session,
}: UseSchemaFileProps) => {
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [isFileDirty, setIsFileDirty] = useState<boolean>(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 초기 파일 정보 로드
  useEffect(() => {
    const fileInfo = loadSchemaFromStorage();
    if (fileInfo) {
      setCurrentFile(fileInfo);
    } else {
      setIsFileDialogOpen(true);
    }
  }, []);

  // 컨텐츠 변경 감지
  useEffect(() => {
    if (currentFile) {
      setIsFileDirty(true);
    }
  }, [nodes, relationships, currentFile]);

  // 자동 저장 로직
  useEffect(() => {
    if (autoSaveEnabled && currentFile && session?.accessToken && isFileDirty) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => handleAutoSave(), 10000);
      setAutoSaveTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [
    nodes,
    relationships,
    autoSaveEnabled,
    currentFile,
    session,
    isFileDirty,
  ]);

  // 자동 저장 함수
  const handleAutoSave = async () => {
    if (!currentFile || !session || !isFileDirty) return;

    try {
      const fileId = await saveFileToGoogle(
        currentFile.name,
        nodes,
        relationships,
        currentFile.googleDriveId
      );

      const updatedFile = {
        ...currentFile,
        lastModified: new Date().toISOString(),
        googleDriveId: fileId,
      };

      setCurrentFile(updatedFile);
      saveSchemaToStorage(updatedFile);
      setIsFileDirty(false);
    } catch (error) {
      console.error("자동 저장 오류:", error);
    }
  };

  // 자동 저장 토글
  const toggleAutoSave = useCallback(() => {
    if (!session) {
      toast.error("자동 저장을 사용하려면 Google 계정으로 로그인해야 합니다.");
      return;
    }
    setAutoSaveEnabled((prev) => !prev);
  }, [session]);

  // 파일 저장 함수
  const saveFile = useCallback(async (): Promise<void> => {
    if (!currentFile) {
      setIsFileDialogOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      if (session) {
        // Google Drive 저장
        const fileId = await saveFileToGoogle(
          currentFile.name,
          nodes,
          relationships,
          currentFile.googleDriveId
        );

        const updatedFile = {
          ...currentFile,
          lastModified: new Date().toISOString(),
          googleDriveId: fileId,
        };

        setCurrentFile(updatedFile);
        saveSchemaToStorage(updatedFile);
        setIsFileDirty(false);

        toast.success("파일이 저장되었습니다.");
      } else {
        // 로컬 저장
        saveFileLocally(currentFile.name, nodes, relationships);

        const updatedFile = {
          ...currentFile,
          lastModified: new Date().toISOString(),
        };

        setCurrentFile(updatedFile);
        saveSchemaToStorage(updatedFile);
        setIsFileDirty(false);

        toast.success(`${currentFile.name}.scst 파일이 다운로드 되었습니다.`);
      }
    } catch (error) {
      const errorMessage = `파일 저장 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`;

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, session, nodes, relationships]);

  // 새 파일 생성
  const createFile = useCallback(
    (fileName: string, description: string) => {
      resetSchemaData();

      saveFileLocally(fileName, [], [], {
        description,
        createdAt: new Date().toISOString(),
      });

      const newFileInfo = {
        name: fileName,
        lastModified: new Date().toISOString(),
      };

      setCurrentFile(newFileInfo);
      saveSchemaToStorage(newFileInfo);
      setIsFileDirty(false);
      setIsFileDialogOpen(false);
    },
    [resetSchemaData]
  );

  // Google Drive 파일 열기
  const openGoogleDriveFile = useCallback(
    async (fileId: string): Promise<void> => {
      if (!session?.accessToken) {
        toast.error("Google Drive 파일에 접근하려면 로그인이 필요합니다.");
        return;
      }

      setIsLoading(true);

      try {
        const schemaFile = await FileService.loadSchemaFromGoogleDrive(fileId);

        const fileInfo = {
          name: schemaFile.metadata.name,
          lastModified: new Date().toISOString(),
          googleDriveId: fileId,
        };

        setCurrentFile(fileInfo);
        saveSchemaToStorage(fileInfo);

        await onOpenFile(schemaFile);
        setIsFileDialogOpen(false);
      } catch (error) {
        const errorMessage = `Google Drive 파일 로드 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`;

        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [session, onOpenFile, setIsFileDialogOpen]
  );

  // 다이얼로그 관련 메서드
  const openFileDialog = useCallback(() => setIsFileDialogOpen(true), []);

  const closeFileDialog = useCallback(() => {
    if (isLoading) {
      setIsFileDialogOpen(false);
      return;
    }

    if (!currentFile) {
      toast.error("작업을 시작하려면 파일을 생성하거나 선택해야 합니다.");
      return;
    }

    setIsFileDialogOpen(false);
  }, [currentFile, isLoading]);

  return {
    currentFile,
    isFileDirty,
    isFileDialogOpen,
    isLoading,
    autoSaveEnabled,
    setIsLoading,
    setIsFileDialogOpen,
    createFile,
    saveFile,
    openGoogleDriveFile,
    openFileDialog,
    closeFileDialog,
    toggleAutoSave,
  };
};
