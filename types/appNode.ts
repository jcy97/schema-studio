// React Flow의 Node 타입을 확장
import { Edge, Node } from "@xyflow/react";
// 컬럼 데이터 타입 정의
export enum DataType {
  INT = "int",
  FLOAT = "float",
  DECIMAL = "decimal",
  VARCHAR = "varchar",
  CHAR = "char",
  TEXT = "text",
  DATE = "date",
  DATETIME = "datetime",
  BOOLEAN = "boolean",
}

// 관계 타입 정의
export enum RelationshipType {
  ONE_TO_ONE = "ONE_TO_ONE",
  ONE_TO_MANY = "ONE_TO_MANY",
  MANY_TO_ONE = "MANY_TO_ONE",
  MANY_TO_MANY = "MANY_TO_MANY",
}

// 컬럼 제약조건 타입
export interface ColumnConstraint {
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNotNull?: boolean;
  defaultValue?: string | number | boolean | null;
  foreignKey?: {
    tableId: string;
    columnId: string;
  };
  check?: string; // CHECK 제약조건 표현식
}

// 컬럼 정의 인터페이스
export interface Column {
  id: string;
  logicalName: string; // 한글 이름
  physicalName: string; // 실제 컬럼;
  dataType: ColumnDataType;
  order: number; // 정렬순서
  typeOptions?: {
    length?: number; // varchar(255)와 같은 길이
    precision?: number; // decimal(10,2)의 10
    scale?: number; // decimal(10,2)의 2
  };
  constraints: ColumnConstraint;
  description?: string; // 컬럼 설명
}

// 인덱스 정의 인터페이스
export interface TableIndex {
  id: string;
  name: string;
  columns: string[]; // 컬럼 ID 목록
  isUnique: boolean;
}

// 테이블(노드) 데이터 인터페이스
export interface AppNodeData {
  id: string;
  logicalName: string; // 한글 테이블명
  physicalName: string; // 실제 테이블명
  color: string;
  columns: Column[];
  indices?: TableIndex[];
  description?: string; // 테이블 설명
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처
}

// 관계 정의 인터페이스
export interface Relationship {
  id: string;
  name: string; // 관계 이름
  type: RelationshipType;
  sourceTableId: string;
  sourceColumnIds: string[]; // 여러 컬럼으로 구성된 관계 지원
  targetTableId: string;
  targetColumnIds: string[];

  // N:M 관계를 위한 정보
  junctionTable?: {
    tableId: string;
    sourceColumnIds: string[];
    targetColumnIds: string[];
  };

  // 관계 옵션
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  description?: string;
}

// 전체 스키마 인터페이스
export interface ERDiagramSchema {
  nodes: AppNode[];
  relationships: Relationship[];
}

export type ColumnDataType = `${DataType}`;

export type AppNode = Node<AppNodeData>;

export interface RelationshipEdgeData extends Record<string, unknown> {
  relationship: Relationship;
}

export interface RelationshipEdge extends Edge {
  data?: RelationshipEdgeData;
}

export interface EdgeHandleInfo {
  sourceHandle: string | null;
  targetHandle: string | null;
}
