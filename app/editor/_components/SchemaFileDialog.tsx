import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FilePlusIcon, FolderOpen, X } from "lucide-react";
import { FileService, SchemaFileMetadata } from "@/services/fileService";
import { SchemaFile } from "@/services/fileService";

interface SchemaFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string, description: string) => void;
  onOpenFile: (schemaFile: SchemaFile) => void;
}

const SchemaFileDialog: React.FC<SchemaFileDialogProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  onOpenFile,
}) => {
  const [activeTab, setActiveTab] = useState<string>("new");
  const [fileName, setFileName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 다이얼로그가 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFile = files[0];

    // .scst 파일 확인
    if (!selectedFile.name.toLowerCase().endsWith(".scst")) {
      setError(".scst 확장자의 파일만 열 수 있습니다");
      return;
    }

    try {
      // 파일 내용 읽기
      const fileContent = await FileService.readFileAsText(selectedFile);

      // 파일 파싱
      const schemaFile = FileService.parseSchemaFile(fileContent);

      // 파일 로드 핸들러 호출
      onOpenFile(schemaFile);
      onClose();
    } catch (err) {
      setError(
        `파일 열기 오류: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const droppedFile = files[0];

    // .scst 파일 확인
    if (!droppedFile.name.toLowerCase().endsWith(".scst")) {
      setError(".scst 확장자의 파일만 열 수 있습니다");
      return;
    }

    try {
      // 파일 내용 읽기
      const fileContent = await FileService.readFileAsText(droppedFile);

      // 파일 파싱
      const schemaFile = FileService.parseSchemaFile(fileContent);

      // 파일 로드 핸들러 호출
      onOpenFile(schemaFile);
      onClose();
    } catch (err) {
      setError(
        `파일 열기 오류: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <CustomDialogHeader
          icon={FilePlusIcon}
          title="스키마 파일 관리"
          subTitle="스키마를 파일로 저장하고 관리합니다."
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="new">새 파일 만들기</TabsTrigger>
            <TabsTrigger value="open">불러오기</TabsTrigger>
          </TabsList>

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
              <Button onClick={handleCreateFile} disabled={!fileName.trim()}>
                <FilePlusIcon size={16} className="mr-2" />새 파일 생성
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            <div
              className="border-2 border-dashed rounded-md p-8 text-center"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".scst"
                className="hidden"
              />
              <FolderOpen className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                .scst 파일을 선택하세요
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                또는 파일을 여기에 끌어다 놓으세요
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                파일 찾아보기
              </Button>
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
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaFileDialog;
