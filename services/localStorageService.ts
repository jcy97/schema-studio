import { AppNode, Relationship } from "@/types/appNode";

export interface LocalSchemaFile {
  id: string;
  name: string;
  nodes: AppNode[];
  relationships: Relationship[];
  metadata: {
    createdAt: string;
    lastModified: string;
    description?: string;
  };
  googleDriveId?: string; // 구글 드라이브에 동기화된 경우
}

export class LocalStorageService {
  private static readonly STORAGE_KEY = "schema_files";
  private static readonly CURRENT_FILE_KEY = "current_schema_file_id";

  // 모든 로컬 파일 목록 가져오기
  static getAllFiles(): LocalSchemaFile[] {
    try {
      const filesJson = localStorage.getItem(this.STORAGE_KEY);
      return filesJson ? JSON.parse(filesJson) : [];
    } catch (error) {
      console.error("로컬 파일 목록 로드 실패:", error);
      return [];
    }
  }

  // 파일 ID로 특정 파일 가져오기
  static getFile(fileId: string): LocalSchemaFile | null {
    const files = this.getAllFiles();
    return files.find((file) => file.id === fileId) || null;
  }

  // 새 파일 생성
  static createFile(
    name: string,
    nodes: AppNode[] = [],
    relationships: Relationship[] = [],
    description?: string
  ): LocalSchemaFile {
    const newFile: LocalSchemaFile = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      nodes,
      relationships,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        description,
      },
    };

    const files = this.getAllFiles();
    files.push(newFile);
    this.saveFiles(files);
    this.setCurrentFileId(newFile.id);

    return newFile;
  }

  // 파일 업데이트
  static updateFile(
    fileId: string,
    updates: Partial<Omit<LocalSchemaFile, "id">>
  ): LocalSchemaFile | null {
    const files = this.getAllFiles();
    const fileIndex = files.findIndex((file) => file.id === fileId);

    if (fileIndex === -1) return null;

    files[fileIndex] = {
      ...files[fileIndex],
      ...updates,
      metadata: {
        ...files[fileIndex].metadata,
        ...updates.metadata,
        lastModified: new Date().toISOString(),
      },
    };

    this.saveFiles(files);
    return files[fileIndex];
  }

  // 파일 삭제
  static deleteFile(fileId: string): boolean {
    const files = this.getAllFiles();
    const filteredFiles = files.filter((file) => file.id !== fileId);

    if (files.length === filteredFiles.length) return false;

    this.saveFiles(filteredFiles);

    // 현재 파일이 삭제된 경우 처리
    if (this.getCurrentFileId() === fileId) {
      this.setCurrentFileId(null);
    }

    return true;
  }

  // 구글 드라이브 ID 연결
  static linkGoogleDriveId(fileId: string, googleDriveId: string): boolean {
    const file = this.getFile(fileId);
    if (!file) return false;

    file.googleDriveId = googleDriveId;
    return !!this.updateFile(fileId, file);
  }

  // 현재 작업 중인 파일 ID 저장
  static setCurrentFileId(fileId: string | null): void {
    if (fileId) {
      localStorage.setItem(this.CURRENT_FILE_KEY, fileId);
    } else {
      localStorage.removeItem(this.CURRENT_FILE_KEY);
    }
  }

  // 현재 작업 중인 파일 ID 가져오기
  static getCurrentFileId(): string | null {
    return localStorage.getItem(this.CURRENT_FILE_KEY);
  }

  // 현재 작업 중인 파일 가져오기
  static getCurrentFile(): LocalSchemaFile | null {
    const currentFileId = this.getCurrentFileId();
    return currentFileId ? this.getFile(currentFileId) : null;
  }

  // 파일 목록 저장 (내부 메서드)
  private static saveFiles(files: LocalSchemaFile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error("로컬 파일 저장 실패:", error);
      throw new Error(
        "로컬 스토리지에 저장할 수 없습니다. 저장 공간이 부족할 수 있습니다."
      );
    }
  }

  // 파일 이름으로 검색
  static searchFiles(query: string): LocalSchemaFile[] {
    const files = this.getAllFiles();
    const lowerQuery = query.toLowerCase();

    return files.filter(
      (file) =>
        file.name.toLowerCase().includes(lowerQuery) ||
        file.metadata.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // 파일 복제
  static duplicateFile(
    fileId: string,
    newName?: string
  ): LocalSchemaFile | null {
    const originalFile = this.getFile(fileId);
    if (!originalFile) return null;

    return this.createFile(
      newName || `${originalFile.name} (복사본)`,
      originalFile.nodes,
      originalFile.relationships,
      originalFile.metadata.description
    );
  }

  // 스토리지 사용량 확인 (대략적인 추정)
  static getStorageUsage(): { used: number; percentage: number } {
    try {
      const totalStorage = 5 * 1024 * 1024; // 5MB (localStorage 일반적인 한계)
      const used = new Blob([JSON.stringify(localStorage)]).size;

      return {
        used,
        percentage: (used / totalStorage) * 100,
      };
    } catch (error) {
      return { used: 0, percentage: 0 };
    }
  }
}
