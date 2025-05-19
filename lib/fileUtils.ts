import { FileService, SchemaFile } from "@/services/fileService";
import { AppNode, Relationship } from "@/types/appNode";

export interface FileInfo {
  name: string;
  lastModified: string;
  googleDriveId?: string;
}

// 로컬 저장소에 파일 정보 저장
export const saveSchemaToStorage = (fileInfo: FileInfo) => {
  localStorage.setItem("currentSchemaFile", JSON.stringify(fileInfo));
};

// 로컬 저장소에서 파일 정보 로드
export const loadSchemaFromStorage = (): FileInfo | null => {
  const storedFile = localStorage.getItem("currentSchemaFile");
  if (storedFile) {
    try {
      return JSON.parse(storedFile);
    } catch (e) {
      console.error("저장된 파일 정보 로드 실패:", e);
      return null;
    }
  }
  return null;
};

// Google Drive에 스키마 저장
export const saveFileToGoogle = async (
  fileName: string,
  nodes: AppNode[],
  relationships: Relationship[],
  fileId?: string
): Promise<string> => {
  return await FileService.saveSchemaToGoogleDrive(
    fileName,
    nodes,
    relationships,
    {
      name: fileName,
      lastModified: new Date().toISOString(),
    },
    fileId
  );
};

// 로컬로 스키마 파일 저장
export const saveFileLocally = (
  fileName: string,
  nodes: AppNode[],
  relationships: Relationship[],
  metadata = {}
): void => {
  FileService.saveSchemaToFile(fileName, nodes, relationships, {
    name: fileName,
    lastModified: new Date().toISOString(),
    ...metadata,
  });
};

// 파일 정보 업데이트 헬퍼
export const updateFileInfo = (
  currentFile: FileInfo | null,
  updates: Partial<FileInfo>
): FileInfo => {
  const updatedFile = {
    ...(currentFile || { name: "", lastModified: "" }),
    ...updates,
    lastModified: new Date().toISOString(),
  };

  saveSchemaToStorage(updatedFile);
  return updatedFile;
};
