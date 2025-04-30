// React Flow의 Node 타입을 확장
import { Node } from "@xyflow/react";
// 컬럼 데이터 타입 정의
export type ColumnDataType =
  | "int"
  | "float"
  | "decimal"
  | "varchar"
  | "char"
  | "text"
  | "date"
  | "datetime"
  | "boolean";

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

export type AppNode = Node<AppNodeData>;
