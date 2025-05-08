import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  title?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "sql",
  showLineNumbers = true,
  maxHeight = "100%",
  title,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 코드 라인을 나누고 라인 번호를 표시하는 함수
  const renderCodeWithLineNumbers = () => {
    const lines = code.split("\n");

    return (
      <div className="flex">
        {showLineNumbers && (
          <div className="select-none text-right pr-4 mr-4 border-r border-zinc-700 text-zinc-500">
            {lines.map((_, i) => (
              <div key={`line-number-${i}`} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1">
          {lines.map((line, i) => (
            <div key={`line-${i}`} className="leading-relaxed">
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // SQL 키워드 강조 표시하기 위한 함수 (간단한 구현)
  const highlightSql = () => {
    if (language !== "sql") return renderCodeWithLineNumbers();

    // 실제 프로덕션에서는 더 복잡한 Syntax Highlighter 라이브러리 사용 권장
    // 이 예제에서는 간단한 키워드 하이라이팅만 구현
    const lines = code.split("\n");

    // SQL 키워드 목록
    const keywords = [
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

    return (
      <div className="flex">
        {showLineNumbers && (
          <div className="select-none text-right pr-4 mr-4 border-r border-zinc-700 text-zinc-500">
            {lines.map((_, i) => (
              <div key={`line-number-${i}`} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1">
          {lines.map((line, i) => {
            // 이 단순한 구현에서는 주석 처리만 별도로 함
            if (line.trim().startsWith("--")) {
              return (
                <div
                  key={`line-${i}`}
                  className="leading-relaxed text-green-400"
                >
                  {line || " "}
                </div>
              );
            }

            // 키워드 강조
            let highlightedLine = line;
            keywords.forEach((keyword) => {
              // 정규식을 사용하여 단어 경계에 있는 키워드만 매칭 (대소문자 구분 없이)
              const regex = new RegExp(`\\b${keyword}\\b`, "gi");
              highlightedLine = highlightedLine.replace(regex, (match) => {
                return `<span class="text-blue-400">${match}</span>`;
              });
            });

            return (
              <div
                key={`line-${i}`}
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedLine || " " }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
      {title && (
        <div className="bg-zinc-900 px-4 py-2 flex justify-between items-center border-b border-zinc-800">
          <div className="text-sm font-medium text-zinc-300">{title}</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{copied ? "복사됨" : "클립보드에 복사"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <ScrollArea className="w-full" style={{ maxHeight }}>
        <div className="p-4 font-mono text-sm text-zinc-200 whitespace-pre">
          {highlightSql()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodeBlock;
