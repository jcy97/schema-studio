import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FilePlusIcon, X, RefreshCw, FolderOpen } from "lucide-react";
import { SchemaFile } from "@/services/fileService";
import { useSession, signIn } from "next-auth/react";
import { CloudIcon, Loader2 } from "lucide-react";
import { GoogleDriveService } from "@/services/googleDriveService";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

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
  const { data: session, status } = useSession();
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] =
    useState<boolean>(false);
  const [isOpeningFile, setIsOpeningFile] = useState<boolean>(false); // 파일 열기 로딩 상태
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null); // 선택된 파일 상태 추가

  const [sessionError, setSessionError] = useState<boolean>(false);

  // 세션 만료 여부 확인
  const isSessionExpired = () => {
    if (!session || !session.expiresAt) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= session.expiresAt;
  };

  // 세션 상태 확인 및 처리
  useEffect(() => {
    if (
      status === "authenticated" &&
      isSessionExpired() &&
      activeTab === "open" &&
      isOpen
    ) {
      setSessionError(true);
      setError("Google 계정 세션이 만료되었습니다. 다시 로그인해주세요.");
    }
  }, [status, session, activeTab, isOpen]);

  useEffect(() => {
    // 세션 오류 상태 확인 및 처리
    if (status === "unauthenticated" && activeTab === "open" && isOpen) {
      setSessionError(true);
      // 사용자가 사용하던 파일이 Google Drive 파일이었는지 확인
      if (localStorage.getItem("currentSchemaFile")) {
        try {
          const fileInfo = JSON.parse(
            localStorage.getItem("currentSchemaFile") || "{}"
          );
          if (fileInfo.googleDriveId) {
            setError(
              "Google 계정 세션이 만료되었습니다. 다시 로그인하여 파일에 접근하거나 새 파일을 만들어주세요."
            );
          } else {
            setError("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
          }
        } catch {
          setError("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }
      } else {
        setError("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
      }
    }
  }, [status, activeTab, isOpen]);
  // 다이얼로그가 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setDescription("");
      setError(null);
      setSelectedFile(null); // 선택된 파일 초기화
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
    if (!session) {
      setSessionError(true);
      setError("세션이 없습니다. 로그인이 필요합니다.");
      return;
    }

    setIsLoadingDriveFiles(true);
    setSelectedFile(null); // 파일 로드 시 선택 초기화

    try {
      const files = await GoogleDriveService.listSchemaFiles();
      setDriveFiles(files);
      // 파일 로드 성공 시 세션 오류 상태 초기화
      setSessionError(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // 인증 관련 오류 감지
      if (errorMessage.includes("인증") || errorMessage.includes("로그인")) {
        setSessionError(true);
        // 세션 오류 시 특별 UI 표시를 위한 상태 설정
      }

      setError(`Google Drive 파일 로드 오류: ${errorMessage}`);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Google Drive 파일 열기 핸들러
  const handleOpenGoogleDriveFile = async (fileId: string) => {
    if (!fileId) return;

    setIsOpeningFile(true); // 파일 열기 로딩 상태 활성화
    setError(null);

    try {
      await onOpenGoogleDriveFile(fileId);
      onClose();
    } catch (err) {
      setError(
        `Google Drive 파일 열기 오류: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsOpeningFile(false); // 로딩 상태 비활성화
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

  // 세션 오류 시 처리되는 컴포넌트
  const renderSessionErrorMessage = () => (
    <div className="text-center py-6 bg-red-50 rounded-md">
      <CloudIcon className="h-10 w-10 mb-2 mx-auto text-red-500" />
      <p className="text-sm font-medium mb-3 text-red-600">
        {error || "인증 세션이 만료되었습니다. 다시 로그인해주세요."}
      </p>
      <Button onClick={() => signIn("google")}>
        Google 계정으로 다시 로그인
      </Button>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isSessionExpired()) {
          // 닫기 동작을 무시하고 경고 메시지 표시
          toast.error("계속하려면 로그인하거나 파일을 선택해야 합니다.");
          return;
        }
        !open && onClose();
      }}
    >
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
            ) : sessionError ? (
              renderSessionErrorMessage()
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
            ) : sessionError ? (
              renderSessionErrorMessage()
            ) : (
              <>
                <div className="relative border rounded-md">
                  {/* 새로고침 버튼을 우측 상단에 배치 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 p-1 h-8 w-8"
                    onClick={() => loadDriveFiles()}
                    disabled={isLoadingDriveFiles || isOpeningFile}
                  >
                    <RefreshCw
                      size={16}
                      className={isLoadingDriveFiles ? "animate-spin" : ""}
                    />
                  </Button>

                  {/* 파일 목록 상단에 안내 문구 */}
                  {!isLoadingDriveFiles && driveFiles.length > 0 && (
                    <div className="p-2 bg-gray-50 border-b text-xs text-center text-muted-foreground">
                      파일을 선택한 후 하단의 '열기' 버튼을 클릭하세요
                    </div>
                  )}

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
                          className={`p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                            selectedFile?.id === file.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => setSelectedFile(file)}
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
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isOpeningFile}
                  >
                    <X size={16} className="mr-2" />
                    취소
                  </Button>
                  <Button
                    onClick={() => handleOpenGoogleDriveFile(selectedFile?.id)}
                    disabled={
                      !selectedFile || isOpeningFile || isLoadingDriveFiles
                    }
                  >
                    {isOpeningFile ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        불러오는 중...
                      </>
                    ) : (
                      <>
                        <FolderOpen size={16} className="mr-2" />
                        열기
                      </>
                    )}
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
