import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Layers2Icon,
  Play,
  Copy,
  Check,
  RefreshCw,
  DatabaseIcon,
  DownloadIcon,
} from "lucide-react";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppNode } from "@/types/appNode";
import { Separator } from "@/components/ui/separator";
import { DBMSType, SQLGenerationOptions } from "@/lib/dbms";
import { useSchema } from "@/contexts/SchemaContext";

// 스키마 선택을 위한 리스트 컴포넌트 인터페이스 정의
interface SchemaListProps {
  nodes: AppNode[];
  selectedNodes: string[];
  toggleNodeSelection: (nodeId: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
}

// 스키마 선택을 위한 리스트 컴포넌트
const SchemaList: React.FC<SchemaListProps> = ({
  nodes,
  selectedNodes,
  toggleNodeSelection,
  toggleSelectAll,
  isAllSelected,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="font-medium text-sm mb-2 py-2 px-4 bg-muted/30 rounded-t-md flex justify-between items-center">
        <span>스키마 테이블 ({nodes.length})</span>
        <div className="flex items-center">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={toggleSelectAll}
            className="mr-2"
          />
          <label htmlFor="select-all" className="text-xs cursor-pointer">
            전체 선택
          </label>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1.5">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`node-${node.id}`}
                checked={selectedNodes.includes(node.id)}
                onCheckedChange={() => toggleNodeSelection(node.id)}
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.data.color }}
                  ></div>
                  <label
                    htmlFor={`node-${node.id}`}
                    className="text-sm font-medium cursor-pointer truncate"
                  >
                    {node.data.logicalName}
                  </label>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {node.data.physicalName} ({node.data.columns.length} 컬럼)
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// SQL 코드 표시 컴포넌트 인터페이스 정의
interface SqlPreviewProps {
  sql: string;
  copyToClipboard: () => void;
  copied: boolean;
  downloadSql: () => void;
}

// SQL 코드 표시 컴포넌트 (개선된 버전)
const SqlPreview: React.FC<SqlPreviewProps> = ({
  sql,
  copyToClipboard,
  copied,
  downloadSql,
}) => {
  // SQL 키워드 목록
  const SQL_KEYWORDS = [
    "SELECT",
    "FROM",
    "WHERE",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "TABLE",
    "INDEX",
    "VIEW",
    "TRIGGER",
    "PRIMARY",
    "KEY",
    "FOREIGN",
    "REFERENCES",
    "NOT",
    "NULL",
    "DEFAULT",
    "CASCADE",
    "UNIQUE",
    "CHECK",
    "CONSTRAINT",
    "INT",
    "INTEGER",
    "VARCHAR",
    "TEXT",
    "DATE",
    "DATETIME",
    "TIMESTAMP",
    "DECIMAL",
    "NUMERIC",
    "FLOAT",
    "REAL",
    "BOOLEAN",
    "BIT",
  ];

  // 키워드 강조 표시를 위한 함수 (JSX 요소 반환)
  const highlightLine = (line: string) => {
    // 주석 라인인 경우
    if (line.trim().startsWith("--")) {
      return <span className="text-green-400">{line}</span>;
    }

    // 키워드를 정규 표현식으로 찾기 위한 패턴
    const keywordPattern = new RegExp(
      `\\b(${SQL_KEYWORDS.join("|")})\\b`,
      "gi"
    );

    // 키워드를 찾아서 문자열을 분할
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    // 정규식 매치 반복
    while ((match = keywordPattern.exec(line)) !== null) {
      // 키워드 앞의 일반 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      // 키워드를 강조 표시하여 추가
      parts.push(
        <span key={`${match.index}-${match[0]}`} className="text-blue-400">
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // 마지막 키워드 이후의 텍스트 추가
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  return (
    <div className="flex flex-col h-full border rounded-md bg-zinc-950 overflow-hidden">
      <div className="flex justify-between items-center font-medium text-sm py-2 px-4 bg-zinc-900 border-b border-zinc-800">
        <span className="text-zinc-300">SQL 코드</span>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                  onClick={copyToClipboard}
                  disabled={!sql}
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "복사됨" : "클립보드에 복사"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                  onClick={downloadSql}
                  disabled={!sql}
                >
                  <DownloadIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>SQL 파일 다운로드</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {sql ? (
        <div
          className="overflow-auto h-full"
          style={{ maxHeight: "calc(70vh - 120px)" }}
        >
          <div className="p-4 font-mono text-sm">
            <div className="flex">
              {/* 행 번호 */}
              <div className="select-none text-right pr-4 mr-4 border-r border-zinc-700 text-zinc-500">
                {sql.split("\n").map((_, i) => (
                  <div key={`line-number-${i}`} className="leading-relaxed h-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* SQL 코드 */}
              <div className="flex-1 text-zinc-200">
                {sql.split("\n").map((line, i) => (
                  <div
                    key={`line-${i}`}
                    className="leading-relaxed h-6 whitespace-pre"
                  >
                    {highlightLine(line)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="text-zinc-500 italic">
            생성된 SQL이 여기에 표시됩니다.
            <br />
            좌측에서 테이블을 선택하고 생성 버튼을 클릭하세요.
          </div>
        </div>
      )}
    </div>
  );
};

// DBMS 설정 컴포넌트 인터페이스 정의
interface DbmsSettingsProps {
  options: SQLGenerationOptions;
  updateOptions: (options: Partial<SQLGenerationOptions>) => void;
}

// DBMS 설정 컴포넌트
const DbmsSettings: React.FC<DbmsSettingsProps> = ({
  options,
  updateOptions,
}) => {
  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex items-center space-x-2">
        <DatabaseIcon size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-medium">DBMS 설정</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dbms-select" className="text-xs">
            DBMS 타입
          </Label>
          <Select
            value={options.dbms}
            onValueChange={(value: string) =>
              updateOptions({ dbms: value as DBMSType })
            }
          >
            <SelectTrigger id="dbms-select">
              <SelectValue placeholder="DBMS 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DBMSType.MYSQL}>MySQL</SelectItem>
              <SelectItem value={DBMSType.POSTGRESQL}>PostgreSQL</SelectItem>
              <SelectItem value={DBMSType.ORACLE}>Oracle</SelectItem>
              <SelectItem value={DBMSType.SQLSERVER}>SQL Server</SelectItem>
              <SelectItem value={DBMSType.SQLITE}>SQLite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-medium">출력 옵션</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="include-drop"
              checked={options.includeDropStatements}
              onCheckedChange={(checked) =>
                updateOptions({ includeDropStatements: checked })
              }
            />
            <Label htmlFor="include-drop" className="text-xs cursor-pointer">
              DROP 구문 포함
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="include-comments"
              checked={options.includeComments}
              onCheckedChange={(checked) =>
                updateOptions({ includeComments: checked })
              }
            />
            <Label
              htmlFor="include-comments"
              className="text-xs cursor-pointer"
            >
              주석 포함
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 다이얼로그 컴포넌트
const GenerateSqlDialog: React.FC = () => {
  const { nodes, generateSqlDDLForSelectedNodes } = useSchema();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // SQL 생성 옵션
  const [sqlOptions, setSqlOptions] = useState<SQLGenerationOptions>({
    dbms: DBMSType.MYSQL,
    includeDropStatements: true,
    includeComments: true,
  });

  // 옵션 업데이트
  const updateOptions = (newOptions: Partial<SQLGenerationOptions>) => {
    setSqlOptions((prev) => ({
      ...prev,
      ...newOptions,
    }));
  };

  // 다이얼로그가 열릴 때마다 상태 초기화
  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setSelectedNodes([]);
      setGeneratedSql("");
      setCopied(false);
    }
  };

  // 노드 선택 토글
  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodes((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // 모든 노드 선택/해제
  const toggleSelectAll = () => {
    if (selectedNodes.length === nodes.length) {
      setSelectedNodes([]);
    } else {
      setSelectedNodes(nodes.map((node) => node.id));
    }
  };

  // 선택된 노드에 대한 SQL 생성
  const generateSql = () => {
    if (selectedNodes.length === 0) {
      setGeneratedSql(
        "/* 선택된 테이블이 없습니다. 좌측에서 테이블을 선택해주세요. */"
      );
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      try {
        // SchemaContext에 구현된 메서드 사용
        const sql = generateSqlDDLForSelectedNodes(selectedNodes, sqlOptions);
        setGeneratedSql(sql);
      } catch (error) {
        console.error("SQL 생성 오류:", error);
        setGeneratedSql(
          `/* SQL 생성 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          } */`
        );
      } finally {
        setIsGenerating(false);
      }
    }, 300); // 약간의 지연으로 로딩 상태 표시
  };

  // 클립보드에 복사
  const copyToClipboard = () => {
    if (!generatedSql) return;

    navigator.clipboard
      .writeText(generatedSql)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("클립보드 복사 실패:", err);
      });
  };

  // SQL 파일 다운로드
  const downloadSql = () => {
    if (!generatedSql) return;

    const blob = new Blob([generatedSql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    // 파일명 생성 (현재 날짜 포함)
    const date = new Date().toISOString().split("T")[0];
    const dbmsName = sqlOptions.dbms.toLowerCase();
    const fileName = `schema_${dbmsName}_${date}.sql`;

    a.href = url;
    a.download = fileName;
    a.click();

    // 메모리 정리
    URL.revokeObjectURL(url);
  };

  // 선택된 노드들에 대한 정보 표시
  const renderSelectionInfo = () => {
    return (
      <div className="text-sm text-muted-foreground">
        {selectedNodes.length === 0
          ? "0개 테이블 선택됨"
          : `${selectedNodes.length}개 테이블 선택됨`}
      </div>
    );
  };

  // 선택된 노드가 모두 선택되었는지 확인
  const isAllSelected =
    nodes.length > 0 && selectedNodes.length === nodes.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <div
          className="w-10 h-10 bg-primary hover:bg-primary/80 text-white rounded-full flex items-center justify-center
                    cursor-pointer shadow-md transition-colors"
        >
          <Play size={20} />
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-6xl p-0">
        <CustomDialogHeader
          icon={Layers2Icon}
          title="SQL 생성"
          subTitle="스키마를 SQL 구문으로 변환합니다."
        />

        <div className="grid grid-cols-12 gap-4 p-6 h-[70vh]">
          {/* 좌측: 스키마 선택 패널 */}
          <div className="col-span-3 h-full">
            <div className="border rounded-md h-full overflow-hidden">
              <SchemaList
                nodes={nodes}
                selectedNodes={selectedNodes}
                toggleNodeSelection={toggleNodeSelection}
                toggleSelectAll={toggleSelectAll}
                isAllSelected={isAllSelected}
              />
            </div>
          </div>

          {/* 중앙: 옵션 및 생성 버튼 */}
          <div className="col-span-3 flex flex-col space-y-4">
            <DbmsSettings options={sqlOptions} updateOptions={updateOptions} />

            <div className="flex-1"></div>

            <Button
              onClick={generateSql}
              className="w-full"
              disabled={isGenerating || selectedNodes.length === 0}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  SQL 생성
                  <Play size={16} className="ml-2" />
                </>
              )}
            </Button>

            {renderSelectionInfo()}
          </div>

          {/* 우측: SQL 프리뷰 */}
          <div className="col-span-6 h-full">
            <SqlPreview
              sql={generatedSql}
              copyToClipboard={copyToClipboard}
              copied={copied}
              downloadSql={downloadSql}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateSqlDialog;
