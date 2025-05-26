import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FilePlus,
  X,
  RefreshCw,
  FolderOpen,
  Cloud,
  Loader2,
  Trash2,
  Download,
  Upload,
  HardDrive,
  Search,
} from "lucide-react";
import {
  LocalStorageService,
  LocalSchemaFile,
} from "@/services/localStorageService";
import { GoogleDriveService } from "@/services/googleDriveService";
import { useSession, signIn } from "next-auth/react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SchemaFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string, description: string) => void;
  onOpenLocalFile: (fileId: string) => Promise<void>;
  onOpenGoogleDriveFile: (fileId: string) => Promise<void>;
  onDeleteFile: (fileId: string) => void;
}

const SchemaFileDialog: React.FC<SchemaFileDialogProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  onOpenLocalFile,
  onOpenGoogleDriveFile,
  onDeleteFile,
}) => {
  const [activeTab, setActiveTab] = useState<string>("local");
  const [fileName, setFileName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 로컬 파일 관련
  const [localFiles, setLocalFiles] = useState<LocalSchemaFile[]>([]);
  const [selectedLocalFile, setSelectedLocalFile] =
    useState<LocalSchemaFile | null>(null);

  // 구글 드라이브 관련
  const { data: session, status } = useSession();
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [selectedDriveFile, setSelectedDriveFile] = useState<any | null>(null);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] =
    useState<boolean>(false);
  const [isOpeningFile, setIsOpeningFile] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<boolean>(false);

  // 세션 만료 여부 확인
  const isSessionExpired = () => {
    if (!session || !session.expiresAt) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= session.expiresAt;
  };

  // 다이얼로그가 열릴 때마다 로컬 파일 목록 갱신
  useEffect(() => {
    if (isOpen) {
      loadLocalFiles();
      setFileName("");
      setDescription("");
      setSelectedLocalFile(null);
      setSelectedDriveFile(null);
      setSessionError(false);
    }
  }, [isOpen]);

  // 로컬 파일 로드
  const loadLocalFiles = () => {
    const files = searchQuery
      ? LocalStorageService.searchFiles(searchQuery)
      : LocalStorageService.getAllFiles();
    setLocalFiles(
      files.sort(
        (a, b) =>
          new Date(b.metadata.lastModified).getTime() -
          new Date(a.metadata.lastModified).getTime()
      )
    );
  };

  // 검색어 변경시 파일 목록 갱신
  useEffect(() => {
    if (activeTab === "local") {
      loadLocalFiles();
    }
  }, [searchQuery, activeTab]);

  // 구글 드라이브 파일 로드
  const loadDriveFiles = async () => {
    if (!session?.accessToken) {
      setSessionError(true);
      return;
    }

    // 세션 만료 확인
    if (isSessionExpired()) {
      setSessionError(true);
      toast.error("구글 계정 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }

    setIsLoadingDriveFiles(true);
    setSessionError(false);

    try {
      const files = await GoogleDriveService.listSchemaFiles();
      setDriveFiles(files);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 인증 관련 오류 감지
      if (
        errorMessage.includes("인증") ||
        errorMessage.includes("401") ||
        errorMessage.includes("unauthorized")
      ) {
        setSessionError(true);
        toast.error("구글 계정 인증이 필요합니다. 다시 로그인해주세요.");
      } else {
        toast.error(`구글 드라이브 파일 로드 실패: ${errorMessage}`);
      }
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // 구글 드라이브 탭 선택시 파일 로드
  useEffect(() => {
    if (activeTab === "google" && session?.accessToken && !isSessionExpired()) {
      loadDriveFiles();
    } else if (activeTab === "google" && (!session || isSessionExpired())) {
      setSessionError(true);
    }
  }, [activeTab, session]);

  // 새 파일 생성
  const handleCreateFile = () => {
    if (!fileName.trim()) {
      toast.error("파일 이름을 입력해주세요");
      return;
    }

    onCreateFile(fileName.trim(), description.trim());
  };

  // 로컬 파일 열기
  const handleOpenLocalFile = async () => {
    if (!selectedLocalFile) return;

    setIsOpeningFile(true);
    try {
      await onOpenLocalFile(selectedLocalFile.id);
    } finally {
      setIsOpeningFile(false);
    }
  };

  // 구글 드라이브 파일 열기
  const handleOpenGoogleDriveFile = async () => {
    if (!selectedDriveFile) return;

    setIsOpeningFile(true);
    try {
      await onOpenGoogleDriveFile(selectedDriveFile.id);
    } finally {
      setIsOpeningFile(false);
    }
  };

  // 로컬 파일 삭제
  const handleDeleteLocalFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      onDeleteFile(fileId);
      loadLocalFiles();
      if (selectedLocalFile?.id === fileId) {
        setSelectedLocalFile(null);
      }
    }
  };

  // 스토리지 사용량 표시
  const StorageIndicator = () => {
    const usage = LocalStorageService.getStorageUsage();
    return (
      <div className="mb-4 px-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>로컬 스토리지 사용량</span>
          <span>{(usage.used / 1024).toFixed(1)} KB / 5 MB</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(usage.percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <CustomDialogHeader
          icon={FilePlus}
          title="파일 관리"
          subTitle="로컬 또는 클라우드에서 스키마 파일을 관리합니다"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <FilePlus size={16} />새 파일
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <HardDrive size={16} />
              로컬 파일
            </TabsTrigger>
            <TabsTrigger value="google" className="flex items-center gap-2">
              <Cloud size={16} />
              구글 드라이브
            </TabsTrigger>
          </TabsList>

          {/* 새 파일 생성 탭 */}
          <TabsContent value="new" className="space-y-4">
            <div>
              <Label htmlFor="filename">파일 이름</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="스키마 이름을 입력하세요"
                className="mt-1"
              />
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                <X size={16} className="mr-2" />
                취소
              </Button>
              <Button onClick={handleCreateFile} disabled={!fileName.trim()}>
                <FilePlus size={16} className="mr-2" />
                파일 생성
              </Button>
            </div>
          </TabsContent>

          {/* 로컬 파일 탭 */}
          <TabsContent value="local" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="파일 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={loadLocalFiles}>
                <RefreshCw size={16} />
              </Button>
            </div>

            <StorageIndicator />

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {localFiles.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>저장된 로컬 파일이 없습니다</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {localFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedLocalFile?.id === file.id
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => setSelectedLocalFile(file)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{file.name}</p>
                                {file.googleDriveId && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Cloud size={12} className="mr-1" />
                                    동기화됨
                                  </Badge>
                                )}
                              </div>
                              {file.metadata.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {file.metadata.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  수정: {formatDate(file.metadata.lastModified)}
                                </span>
                                <span>노드: {file.nodes.length}개</span>
                                <span>관계: {file.relationships.length}개</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleDeleteLocalFile(e, file.id)}
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                <X size={16} className="mr-2" />
                취소
              </Button>
              <Button
                onClick={handleOpenLocalFile}
                disabled={!selectedLocalFile || isOpeningFile}
              >
                {isOpeningFile ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    열기...
                  </>
                ) : (
                  <>
                    <FolderOpen size={16} className="mr-2" />
                    열기
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* 구글 드라이브 탭 */}
          <TabsContent value="google" className="space-y-4">
            {!session || sessionError || isSessionExpired() ? (
              <div className="text-center py-12">
                <Cloud className="h-12 w-12 mb-3 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium mb-3">구글 드라이브 연결</p>
                <p className="text-sm text-muted-foreground mb-6">
                  구글 드라이브에서 파일을 불러오거나 동기화하려면 로그인하세요
                </p>
                <Button onClick={() => signIn("google")}>
                  <Cloud size={16} className="mr-2" />
                  Google 계정으로 로그인
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadDriveFiles}
                    disabled={isLoadingDriveFiles}
                  >
                    <RefreshCw
                      size={16}
                      className={isLoadingDriveFiles ? "animate-spin" : ""}
                    />
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      {isLoadingDriveFiles ? (
                        <div className="p-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">
                            구글 드라이브 파일 로드 중...
                          </p>
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>구글 드라이브에 저장된 파일이 없습니다</p>
                          <p className="text-xs mt-2">
                            새 파일을 만들어 구글 드라이브에 동기화해보세요
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {driveFiles.map((file) => (
                            <div
                              key={file.id}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                selectedDriveFile?.id === file.id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                              onClick={() => setSelectedDriveFile(file)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{file.name}</p>
                                  {file.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {file.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    수정: {formatDate(file.modifiedTime)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    <X size={16} className="mr-2" />
                    취소
                  </Button>
                  <Button
                    onClick={handleOpenGoogleDriveFile}
                    disabled={!selectedDriveFile || isOpeningFile}
                  >
                    {isOpeningFile ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        불러오는 중...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        불러오기
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
