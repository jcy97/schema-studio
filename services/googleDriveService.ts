export class GoogleDriveService {
  /**
   * .scst 파일 목록 가져오기
   */
  static async listSchemaFiles() {
    try {
      const response = await fetch("/api/drive/list-files");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "파일 목록을 가져오는 중 오류가 발생했습니다"
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Google Drive 파일 목록 조회 오류:", error);
      throw error;
    }
  }

  /**
   * 파일 내용 가져오기
   */
  static async getFileContent(fileId: string) {
    try {
      const response = await fetch(`/api/drive/get-file?fileId=${fileId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "파일을 읽는 중 오류가 발생했습니다");
      }
      return await response.json();
    } catch (error) {
      console.error("Google Drive 파일 읽기 오류:", error);
      throw error;
    }
  }

  /**
   * 파일 생성 또는 업데이트
   */
  static async saveFile(
    fileName: string,
    content: string,
    existingFileId?: string,
    description?: string
  ) {
    try {
      const response = await fetch("/api/drive/save-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          content,
          existingFileId,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "파일을 저장하는 중 오류가 발생했습니다"
        );
      }

      const data = await response.json();
      return data.fileId;
    } catch (error) {
      console.error("Google Drive 파일 저장 오류:", error);
      throw error;
    }
  }
}
