import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FilePlusIcon, X } from "lucide-react";
import { SchemaFile } from "@/services/fileService";
import { useSession, signIn } from "next-auth/react";
import { CloudIcon, Loader2 } from "lucide-react";
import { GoogleDriveService } from "@/services/googleDriveService";
import { formatDate } from "@/lib/utils";

interface SchemaFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string, description: string) => void;
  onOpenFile: (schemaFile: SchemaFile) => void;
  onOpenGoogleDriveFile: (fileId: string) => Promise<void>;
}

const SchemaFileDialog: React.FC<SchemaFileDialogProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  onOpenFile,
  onOpenGoogleDriveFile,
}) => {
  const [activeTab, setActiveTab] = useState<string>("new");
  const [fileName, setFileName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // 구글 드라이브 처리
  const { data: session } = useSession();
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] =
    useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  // 다이얼로그가 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  // 다이얼로그가 열릴 때 Google Drive 파일 로드
  useEffect(() => {
    if (isOpen && session?.accessToken && activeTab === "open") {
      loadDriveFiles();
    }
  }, [isOpen, activeTab, session]);

  // Google Drive 파일 로드 함수
  const loadDriveFiles = async () => {
    if (!session) return;

    setIsLoadingDriveFiles(true);
    try {
      const files = await GoogleDriveService.listSchemaFiles();
      setDriveFiles(files);
    } catch (err) {
      setError(
        `Google Drive 파일 로드 오류: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Google Drive 파일 열기 핸들러
  const handleOpenGoogleDriveFile = async (fileId: string) => {
    try {
      await onOpenGoogleDriveFile(fileId);
      onClose();
    } catch (err) {
      setError(
        `Google Drive 파일 열기 오류: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleCreateFile = () => {
    if (!fileName.trim()) {
      setError("파일 이름을 입력해주세요");
      return;
    }

    try {
      onCreateFile(fileName, description);
      onClose();
    } catch (err) {
      setError(
        `파일 생성 오류: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <CustomDialogHeader
          icon={FilePlusIcon}
          title="스키마 파일 관리"
          subTitle="스키마를 Google Drive에 저장하고 관리합니다."
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="new">새 파일</TabsTrigger>
            <TabsTrigger value="open">불러오기</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {!session ? (
              <div className="text-center py-6">
                <CloudIcon className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium mb-3">
                  Google Drive에 파일을 저장하려면 로그인하세요
                </p>
                <Button onClick={() => signIn("google")}>
                  Google 계정으로 로그인
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="filename">파일 이름</Label>
                  <Input
                    id="filename"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="스키마 이름을 입력하세요"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    확장자(.scst)는 자동으로 추가됩니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">설명 (선택사항)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="스키마에 대한 설명을 입력하세요"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    <X size={16} className="mr-2" />
                    취소
                  </Button>
                  <Button
                    onClick={handleCreateFile}
                    disabled={!fileName.trim()}
                  >
                    <FilePlusIcon size={16} className="mr-2" />
                    Google Drive에 새 파일 생성
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            {!session ? (
              <div className="text-center py-6">
                <CloudIcon className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium mb-3">
                  Google Drive에 저장된 파일에 접근하려면 로그인하세요
                </p>
                <Button onClick={() => signIn("google")}>
                  Google 계정으로 로그인
                </Button>
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  {isLoadingDriveFiles ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">Google Drive 파일 로드 중...</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>저장된 .scst 파일이 없습니다</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => handleOpenGoogleDriveFile(file.id)}
                        >
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground">
                                {file.description}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(file.modifiedTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    취소
                  </Button>
                  <Button
                    onClick={() => loadDriveFiles()}
                    disabled={isLoadingDriveFiles}
                  >
                    새로고침
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaFileDialog;
