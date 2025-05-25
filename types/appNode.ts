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
  check?: string;
}

// 컬럼 정의 인터페이스
export interface Column {
  id: string;
  logicalName: string;
  physicalName: string;
  dataType: ColumnDataType;
  order: number;
  typeOptions?: {
    length?: number;
    precision?: number;
    scale?: number;
  };
  constraints: ColumnConstraint;
  description?: string;
}

// 인덱스 정의 인터페이스
export interface TableIndex {
  id: string;
  name: string;
  columns: string[];
  isUnique: boolean;
}

// 테이블(노드) 데이터 인터페이스
export interface AppNodeData {
  id: string;
  logicalName: string;
  physicalName: string;
  color: string;
  columns: Column[];
  indices?: TableIndex[];
  description?: string;
  [key: string]: any;
}

// 관계 정의 인터페이스
export interface Relationship {
  id: string;
  name: string;
  type: RelationshipType;
  sourceTableId: string;
  sourceColumnIds: string[];
  targetTableId: string;
  targetColumnIds: string[];

  sourceHandle?: string;
  targetHandle?: string;

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
