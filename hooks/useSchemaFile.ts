import { useState, useEffect, useCallback } from "react";
import { AppNode, Relationship } from "@/types/appNode";
import { FileService, SchemaFile } from "@/services/fileService";
import {
  LocalStorageService,
  LocalSchemaFile,
} from "@/services/localStorageService";
import { toast } from "sonner";
import { FileInfo, saveFileToGoogle } from "@/lib/fileUtils";

interface UseSchemaFileProps {
  nodes: AppNode[];
  relationships: Relationship[];
  resetSchemaData: () => void;
  onOpenFile: (schemaFile: SchemaFile) => Promise<void>;
  session: any;
}

export enum StorageMode {
  LOCAL = "local",
  GOOGLE_DRIVE = "google_drive",
}

export const useSchemaFile = ({
  nodes,
  relationships,
  resetSchemaData,
  onOpenFile,
  session,
}: UseSchemaFileProps) => {
  const [currentFile, setCurrentFile] = useState<LocalSchemaFile | null>(null);
  const [isFileDirty, setIsFileDirty] = useState<boolean>(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storageMode, setStorageMode] = useState<StorageMode>(
    StorageMode.LOCAL
  );

  // 초기 파일 로드
  useEffect(() => {
    const currentFileId = LocalStorageService.getCurrentFileId();
    if (currentFileId) {
      const file = LocalStorageService.getFile(currentFileId);
      if (file) {
        setCurrentFile(file);
        // 파일의 데이터를 에디터에 로드
        const schemaFile: SchemaFile = {
          nodes: file.nodes,
          relationships: file.relationships,
          metadata: {
            name: file.name,
            ...file.metadata,
          },
        };
        onOpenFile(schemaFile);
      }
    } else {
      // 현재 파일이 없으면 다이얼로그 표시
      setIsFileDialogOpen(true);
    }
  }, []);

  // 컨텐츠 변경 감지
  useEffect(() => {
    if (currentFile && (nodes.length > 0 || relationships.length > 0)) {
      setIsFileDirty(true);
    }
  }, [nodes, relationships]);

  // 자동 저장 로직
  useEffect(() => {
    if (autoSaveEnabled && currentFile && isFileDirty) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => handleAutoSave(), 5000); // 5초로 단축
      setAutoSaveTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [nodes, relationships, autoSaveEnabled, currentFile, isFileDirty]);

  // 자동 저장 함수
  const handleAutoSave = async () => {
    if (!currentFile || !isFileDirty) return;

    try {
      // 로컬 스토리지에 자동 저장
      const updatedFile = LocalStorageService.updateFile(currentFile.id, {
        nodes,
        relationships,
      });

      if (!updatedFile) {
        console.error("로컬 자동 저장 실패");
        return;
      }

      // 구글 드라이브에도 연결되어 있고 세션이 유효하면 동기화
      if (currentFile.googleDriveId && session?.accessToken) {
        // 세션 만료 확인
        if (session.expiresAt) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (currentTime >= session.expiresAt) {
            console.log("자동 저장: 세션 만료로 구글 드라이브 동기화 건너뜀");
            setIsFileDirty(false);
            return;
          }
        }

        try {
          await saveFileToGoogle(
            currentFile.name,
            nodes,
            relationships,
            currentFile.googleDriveId
          );
          console.log("자동 저장: 구글 드라이브 동기화 완료");
        } catch (error) {
          console.error("자동 저장: 구글 드라이브 동기화 실패", error);
          // 인증 오류가 아닌 경우에만 사용자에게 알림
          if (
            error instanceof Error &&
            !error.message.includes("401") &&
            !error.message.includes("인증")
          ) {
            toast.warning(
              "자동 저장: 로컬에만 저장됨 (구글 드라이브 동기화 실패)"
            );
          }
        }
      }

      setIsFileDirty(false);
    } catch (error) {
      console.error("자동 저장 오류:", error);
    }
  };

  // 자동 저장 토글
  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled((prev) => !prev);
    toast.info(
      autoSaveEnabled
        ? "자동 저장이 비활성화되었습니다"
        : "자동 저장이 활성화되었습니다"
    );
  }, [autoSaveEnabled]);

  // 파일 저장
  const saveFile = useCallback(async (): Promise<void> => {
    if (!currentFile) {
      setIsFileDialogOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      // 먼저 로컬 스토리지에 저장
      const updatedFile = LocalStorageService.updateFile(currentFile.id, {
        nodes,
        relationships,
      });

      if (!updatedFile) {
        throw new Error("로컬 저장 실패");
      }

      setCurrentFile(updatedFile);
      setIsFileDirty(false);

      // 구글 드라이브와 연결된 파일이고 세션이 유효한 경우
      if (currentFile.googleDriveId && session?.accessToken) {
        // 세션 만료 확인
        if (session.expiresAt) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (currentTime >= session.expiresAt) {
            toast.warning(
              "로컬에 저장되었습니다. 구글 드라이브 동기화는 재로그인이 필요합니다."
            );
            return;
          }
        }

        try {
          // 구글 드라이브에도 저장
          await saveFileToGoogle(
            currentFile.name,
            nodes,
            relationships,
            currentFile.googleDriveId
          );
          toast.success("파일이 저장되고 구글 드라이브에 동기화되었습니다");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // 인증 오류인 경우
          if (
            errorMessage.includes("401") ||
            errorMessage.includes("인증") ||
            errorMessage.includes("unauthorized")
          ) {
            toast.warning(
              "로컬에 저장되었습니다. 구글 드라이브 동기화는 재로그인이 필요합니다."
            );
          } else {
            toast.warning(
              `로컬에 저장되었지만 구글 드라이브 동기화 실패: ${errorMessage}`
            );
          }
        }
      } else if (currentFile.googleDriveId && !session?.accessToken) {
        // 구글 드라이브 파일이지만 세션이 없는 경우
        toast.warning(
          "로컬에 저장되었습니다. 구글 드라이브에 동기화하려면 로그인이 필요합니다."
        );
      } else {
        // 로컬 전용 파일인 경우
        toast.success("파일이 저장되었습니다");
      }
    } catch (error) {
      toast.error(
        `파일 저장 오류: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, session, nodes, relationships]);

  // 구글 드라이브에 저장/동기화
  const syncToGoogleDrive = useCallback(async (): Promise<void> => {
    if (!currentFile) return;
    if (!session?.accessToken) {
      toast.error("구글 드라이브에 저장하려면 로그인이 필요합니다");
      return;
    }

    // 세션 만료 확인
    if (session.expiresAt) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime >= session.expiresAt) {
        toast.error("구글 계정 세션이 만료되었습니다. 다시 로그인해주세요.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const fileId = await saveFileToGoogle(
        currentFile.name,
        nodes,
        relationships,
        currentFile.googleDriveId
      );

      // 구글 드라이브 ID 연결
      LocalStorageService.linkGoogleDriveId(currentFile.id, fileId);

      const updatedFile = LocalStorageService.getFile(currentFile.id);
      if (updatedFile) {
        setCurrentFile(updatedFile);
      }

      toast.success("구글 드라이브에 동기화되었습니다");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 인증 오류인 경우 특별 처리
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("인증") ||
        errorMessage.includes("unauthorized")
      ) {
        toast.error("구글 계정 인증이 필요합니다. 다시 로그인해주세요.");
      } else {
        toast.error(`구글 드라이브 동기화 오류: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, session, nodes, relationships]);

  // 새 파일 생성
  const createFile = useCallback(
    (fileName: string, description: string) => {
      resetSchemaData();

      const newFile = LocalStorageService.createFile(
        fileName,
        [],
        [],
        description
      );
      setCurrentFile(newFile);
      setIsFileDirty(false);
      setIsFileDialogOpen(false);

      toast.success(`새 파일 '${fileName}'이 생성되었습니다`);
    },
    [resetSchemaData]
  );

  // 로컬 파일 열기
  const openLocalFile = useCallback(
    async (fileId: string): Promise<void> => {
      const file = LocalStorageService.getFile(fileId);
      if (!file) {
        toast.error("파일을 찾을 수 없습니다");
        return;
      }

      const schemaFile: SchemaFile = {
        nodes: file.nodes,
        relationships: file.relationships,
        metadata: {
          name: file.name,
          ...file.metadata,
        },
      };

      await onOpenFile(schemaFile);
      setCurrentFile(file);
      LocalStorageService.setCurrentFileId(file.id);
      setIsFileDialogOpen(false);
      setIsFileDirty(false);
    },
    [onOpenFile]
  );

  // Google Drive 파일 열기
  const openGoogleDriveFile = useCallback(
    async (fileId: string): Promise<void> => {
      if (!session?.accessToken) {
        toast.error("Google Drive 파일에 접근하려면 로그인이 필요합니다");
        return;
      }

      setIsLoading(true);

      try {
        const schemaFile = await FileService.loadSchemaFromGoogleDrive(fileId);

        // 로컬에 복사본 생성 (기존 로컬 파일이 있는지 확인)
        const existingFiles = LocalStorageService.getAllFiles();
        const existingFile = existingFiles.find(
          (f) => f.googleDriveId === fileId
        );

        let localFile: LocalSchemaFile | null;

        if (existingFile) {
          // 기존 파일 업데이트
          localFile = LocalStorageService.updateFile(existingFile.id, {
            nodes: schemaFile.nodes,
            relationships: schemaFile.relationships,
            metadata: {
              ...existingFile.metadata,
              ...schemaFile.metadata,
              lastModified: new Date().toISOString(),
            },
          });
        } else {
          // 새 로컬 파일 생성
          localFile = LocalStorageService.createFile(
            schemaFile.metadata.name,
            schemaFile.nodes,
            schemaFile.relationships,
            schemaFile.metadata.description
          );

          // 구글 드라이브 ID 연결
          if (localFile) {
            LocalStorageService.linkGoogleDriveId(localFile.id, fileId);
            localFile = LocalStorageService.getFile(localFile.id);
          }
        }

        if (localFile) {
          setCurrentFile(localFile);
        }

        await onOpenFile(schemaFile);
        setIsFileDialogOpen(false);
        setIsFileDirty(false);

        toast.success("구글 드라이브에서 파일을 불러왔습니다");
      } catch (error) {
        toast.error(
          `파일 로드 오류: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [session, onOpenFile]
  );

  // 파일 삭제
  const deleteFile = useCallback(
    (fileId: string) => {
      const success = LocalStorageService.deleteFile(fileId);
      if (success) {
        if (currentFile?.id === fileId) {
          setCurrentFile(null);
          resetSchemaData();
        }
        toast.success("파일이 삭제되었습니다");
      } else {
        toast.error("파일 삭제에 실패했습니다");
      }
    },
    [currentFile, resetSchemaData]
  );

  // 파일 내보내기 (다운로드)
  const exportFile = useCallback(() => {
    if (!currentFile) return;

    const dataStr = JSON.stringify(
      {
        name: currentFile.name,
        nodes,
        relationships,
        metadata: currentFile.metadata,
      },
      null,
      2
    );

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentFile.name}.scst`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("파일이 다운로드되었습니다");
  }, [currentFile, nodes, relationships]);

  // 다이얼로그 관련
  const openFileDialog = useCallback(() => setIsFileDialogOpen(true), []);
  const closeFileDialog = useCallback(() => {
    if (!currentFile) {
      toast.error("작업을 시작하려면 파일을 생성하거나 선택해야 합니다");
      return;
    }
    setIsFileDialogOpen(false);
  }, [currentFile]);

  return {
    currentFile,
    isFileDirty,
    isFileDialogOpen,
    isLoading,
    autoSaveEnabled,
    storageMode,
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
  };
};
