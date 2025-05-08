// services/fileService.ts
import { getRandomBgColor } from "@/lib/utils";
import { AppNode, Relationship, RelationshipType } from "@/types/appNode";
import { Edge } from "@xyflow/react";

export interface SchemaFileMetadata {
  name: string;
  description?: string;
  createdAt: string;
  lastModified: string;
  version: string;
}

export interface SchemaFile {
  metadata: SchemaFileMetadata;
  nodes: AppNode[];
  relationships: Relationship[];
  edges?: Edge[]; // 선택적 - 엣지는 관계에서 자동 생성됨
}

/**
 * .scst 파일 관련 기능을 제공하는 서비스
 */
export class FileService {
  /**
   * 현재 관리 중인 파일이 있는지 확인
   */
  static hasCurrentFile(): boolean {
    return localStorage.getItem("currentSchemaFile") !== null;
  }

  /**
   * 스키마 데이터를 .scst 파일 형식으로 변환
   */
  static createSchemaFileContent(
    nodes: AppNode[],
    relationships: Relationship[],
    metadata: Partial<SchemaFileMetadata>
  ): SchemaFile {
    const now = new Date().toISOString();

    const fileMetadata: SchemaFileMetadata = {
      name: metadata.name || "새 스키마",
      description: metadata.description || "",
      createdAt: metadata.createdAt || now,
      lastModified: now,
      version: "1.0",
    };

    // 깊은 복사를 통해 객체 참조 문제 방지
    const cleanedNodes = nodes ? JSON.parse(JSON.stringify(nodes)) : [];
    const cleanedRelationships = relationships
      ? JSON.parse(JSON.stringify(relationships))
      : [];

    return {
      metadata: fileMetadata,
      nodes: cleanedNodes,
      relationships: cleanedRelationships,
    };
  }

  /**
   * .scst 파일 데이터 저장하기
   */
  static saveSchemaToFile(
    fileName: string,
    nodes: AppNode[],
    relationships: Relationship[],
    metadata: Partial<SchemaFileMetadata> = {}
  ): void {
    const schemaFile = this.createSchemaFileContent(
      nodes,
      relationships,
      metadata
    );
    const fileContent = JSON.stringify(schemaFile, null, 2);

    // 브라우저에서 파일 다운로드
    const blob = new Blob([fileContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.scst`;
    a.click();

    // 메모리 정리
    URL.revokeObjectURL(url);

    // 로컬스토리지에 현재 파일 정보 저장
    const fileInfo = {
      name: fileName,
      lastModified: new Date().toISOString(),
      description: metadata.description,
    };

    localStorage.setItem("currentSchemaFile", JSON.stringify(fileInfo));
  }

  /**
   * 파일 데이터로부터 스키마 파싱
   */
  static parseSchemaFile(fileContent: string): SchemaFile {
    try {
      const parsed = JSON.parse(fileContent) as SchemaFile;

      // 필수 필드 검증 및 기본값 설정
      if (!parsed.metadata) {
        parsed.metadata = {
          name: "불러온 스키마",
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: "1.0",
        };
      }

      if (!Array.isArray(parsed.nodes)) {
        parsed.nodes = [];
      }

      if (!Array.isArray(parsed.relationships)) {
        parsed.relationships = [];
      }

      // 노드와 관계 ID 필드 확인 (필수 필드)
      parsed.nodes.forEach((node) => {
        if (!node.id) {
          node.id = `node-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;
        }

        // 노드 데이터 필드 확인
        if (!node.data) {
          node.data = {
            id: node.id,
            logicalName: "복원된 스키마",
            physicalName: "RESTORED-TB",
            columns: [],
            color: getRandomBgColor(),
          };
        }

        // 컬럼 ID 확인
        if (Array.isArray(node.data.columns)) {
          node.data.columns.forEach((column) => {
            if (!column.id) {
              column.id = `col-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`;
            }

            if (!column.constraints) {
              column.constraints = {};
            }
          });
        }
      });

      // 관계 ID 필드 확인
      parsed.relationships.forEach((rel) => {
        if (!rel.id) {
          rel.id = `rel-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;
        }

        // 관계 필수 필드 확인
        if (!rel.type) {
          rel.type = RelationshipType.ONE_TO_MANY;
        }

        if (!Array.isArray(rel.sourceColumnIds)) {
          rel.sourceColumnIds = [];
        }

        if (!Array.isArray(rel.targetColumnIds)) {
          rel.targetColumnIds = [];
        }
      });

      return parsed;
    } catch (error) {
      console.error("Schema file parsing error:", error);
      throw new Error("스키마 파일 파싱 중 오류가 발생했습니다.");
    }
  }

  /**
   * 파일 객체에서 텍스트 콘텐츠 읽기
   */
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("파일 읽기에 실패했습니다."));
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  }
}
