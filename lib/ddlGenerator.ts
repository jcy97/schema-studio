import {
  AppNode,
  Column,
  Relationship,
  RelationshipType,
} from "@/types/appNode";
import {
  quoteIdentifier,
  convertDataType,
  getTableOptions,
  getForeignKeyConstraint,
  getDropTableStatement,
} from "./sqlUtils";
import { DBMSOptions, DBMSType, SQLGenerationOptions } from "./dbms";

/**
 * 테이블 생성 DDL 생성
 */
export function generateTableDDL(
  node: AppNode,
  options: SQLGenerationOptions
): string {
  const { dbms, dbmsOptions, includeDropStatements, includeComments } = options;
  let sql = "";

  // 드롭 구문 포함 여부
  if (includeDropStatements) {
    sql +=
      getDropTableStatement(node.data.physicalName, dbms, dbmsOptions) + "\n\n";
  }

  // 주석 포함 여부
  if (includeComments) {
    sql += `-- ${node.data.logicalName} 테이블\n`;
  }

  // 테이블명 따옴표 처리
  const quotedTableName = quoteIdentifier(
    node.data.physicalName,
    dbms,
    dbmsOptions
  );

  // CREATE TABLE 구문 시작
  sql += `CREATE TABLE ${quotedTableName} (\n`;

  // 컬럼 정의
  const columnDefinitions = node.data.columns.map((column) =>
    generateColumnDefinition(column, dbms, dbmsOptions)
  );

  // 기본키 제약조건
  const primaryKeyColumns = node.data.columns
    .filter((column) => column.constraints.isPrimaryKey)
    .map((column) => quoteIdentifier(column.physicalName, dbms, dbmsOptions));

  if (primaryKeyColumns.length > 0) {
    // 기본키 제약조건명
    const pkName = `PK_${node.data.physicalName}`;
    const quotedPkName = quoteIdentifier(pkName, dbms, dbmsOptions);

    // DBMS에 따라 다른 PRIMARY KEY 구문
    let pkDefinition = "";
    if (dbms === DBMSType.ORACLE || dbms === DBMSType.SQLSERVER) {
      pkDefinition = `  CONSTRAINT ${quotedPkName} PRIMARY KEY (${primaryKeyColumns.join(
        ", "
      )})`;
    } else {
      pkDefinition = `  PRIMARY KEY (${primaryKeyColumns.join(", ")})`;
    }

    columnDefinitions.push(pkDefinition);
  }

  // UNIQUE 제약조건
  node.data.columns
    .filter(
      (column) =>
        column.constraints.isUnique && !column.constraints.isPrimaryKey
    )
    .forEach((column) => {
      const uniqueName = `UQ_${node.data.physicalName}_${column.physicalName}`;
      const quotedUniqueName = quoteIdentifier(uniqueName, dbms, dbmsOptions);
      const quotedColumnName = quoteIdentifier(
        column.physicalName,
        dbms,
        dbmsOptions
      );

      if (dbms === DBMSType.ORACLE || dbms === DBMSType.SQLSERVER) {
        columnDefinitions.push(
          `  CONSTRAINT ${quotedUniqueName} UNIQUE (${quotedColumnName})`
        );
      } else {
        columnDefinitions.push(`  UNIQUE (${quotedColumnName})`);
      }
    });

  // CHECK 제약조건
  node.data.columns
    .filter((column) => column.constraints.check)
    .forEach((column) => {
      const checkName = `CK_${node.data.physicalName}_${column.physicalName}`;
      const quotedCheckName = quoteIdentifier(checkName, dbms, dbmsOptions);

      if (dbms === DBMSType.ORACLE || dbms === DBMSType.SQLSERVER) {
        columnDefinitions.push(
          `  CONSTRAINT ${quotedCheckName} CHECK (${column.constraints.check})`
        );
      } else {
        columnDefinitions.push(`  CHECK (${column.constraints.check})`);
      }
    });

  // 컬럼 정의 합치기
  sql += columnDefinitions.join(",\n");

  // 테이블 옵션 추가
  sql += "\n)" + getTableOptions(dbms, dbmsOptions) + ";\n";

  return sql;
}

/**
 * 컬럼 정의 DDL 생성
 */
function generateColumnDefinition(
  column: Column,
  dbms: DBMSType,
  dbmsOptions?: DBMSOptions
): string {
  // 컬럼명 따옴표 처리
  const quotedColumnName = quoteIdentifier(
    column.physicalName,
    dbms,
    dbmsOptions
  );

  // 데이터 타입 변환
  const dataType = convertDataType(column.dataType, column.typeOptions, dbms);

  // 기본 컬럼 정의
  let colDef = `  ${quotedColumnName} ${dataType}`;

  // NOT NULL
  if (column.constraints.isNotNull) {
    colDef += " NOT NULL";
  }

  // 기본값
  if (column.constraints.defaultValue !== undefined) {
    if (typeof column.constraints.defaultValue === "string") {
      // Oracle과 SQL Server는 문자열 리터럴에 작은따옴표 사용
      const quoteChar =
        dbms === DBMSType.ORACLE || dbms === DBMSType.SQLSERVER ? "'" : "'";
      colDef += ` DEFAULT ${quoteChar}${column.constraints.defaultValue}${quoteChar}`;
    } else {
      colDef += ` DEFAULT ${column.constraints.defaultValue}`;
    }
  }

  return colDef;
}

/**
 * 외래키 제약조건 DDL 생성
 */
export function generateForeignKeyDDL(
  relationship: Relationship,
  nodes: AppNode[],
  options: SQLGenerationOptions
): string {
  const { dbms, dbmsOptions, includeComments } = options;

  if (relationship.type === RelationshipType.MANY_TO_MANY) {
    return ""; // N:M 관계는 별도로 처리
  }

  const sourceNode = nodes.find(
    (node) => node.id === relationship.sourceTableId
  );
  const targetNode = nodes.find(
    (node) => node.id === relationship.targetTableId
  );

  if (!sourceNode || !targetNode) {
    return "";
  }

  const sourceColumns = relationship.sourceColumnIds
    .map((colId) => {
      const column = sourceNode.data.columns.find((col) => col.id === colId);
      return column?.physicalName || "";
    })
    .filter((name) => name);

  const targetColumns = relationship.targetColumnIds
    .map((colId) => {
      const column = targetNode.data.columns.find((col) => col.id === colId);
      return column?.physicalName || "";
    })
    .filter((name) => name);

  if (sourceColumns.length === 0 || targetColumns.length === 0) {
    return "";
  }

  let sql = "";

  // 주석 추가
  if (includeComments) {
    sql += `-- ${relationship.name} 관계의 외래키\n`;
  }

  // 외래키 제약조건명
  const constraintName = `FK_${targetNode.data.physicalName}_${sourceNode.data.physicalName}`;

  // 외래키 제약조건 추가
  sql += getForeignKeyConstraint(
    constraintName,
    targetNode.data.physicalName,
    targetColumns,
    sourceNode.data.physicalName,
    sourceColumns,
    relationship.onDelete,
    relationship.onUpdate,
    dbms,
    dbmsOptions
  );

  sql += "\n";

  return sql;
}

/**
 * 모든 테이블의 DDL 생성
 */
export function generateDDL(
  nodes: AppNode[],
  relationships: Relationship[],
  options: SQLGenerationOptions
): string {
  let sql = "";

  // 머리말 추가
  if (options.includeComments) {
    const dbmsName = options.dbms;
    const currentDate = new Date().toISOString().split("T")[0];

    sql += `-- DDL 생성: ${dbmsName}\n`;
    sql += `-- 생성일: ${currentDate}\n\n`;
  }

  // 테이블 생성 구문
  nodes.forEach((node) => {
    sql += generateTableDDL(node, options);
    sql += "\n";
  });

  // 외래키 제약조건
  relationships.forEach((rel) => {
    sql += generateForeignKeyDDL(rel, nodes, options);
  });

  return sql;
}

/**
 * 선택된 테이블의 DDL 생성
 */
export function generateDDLForSelectedNodes(
  selectedNodeIds: string[],
  nodes: AppNode[],
  relationships: Relationship[],
  options: SQLGenerationOptions
): string {
  // 선택된 노드만 필터링
  const filteredNodes = nodes.filter((node) =>
    selectedNodeIds.includes(node.id)
  );

  if (filteredNodes.length === 0) {
    return "/* 선택된 테이블이 없습니다. 좌측에서 테이블을 선택해주세요. */";
  }

  // 선택된 노드 간의 관계만 필터링
  const relevantRelationships = relationships.filter(
    (rel) =>
      selectedNodeIds.includes(rel.sourceTableId) &&
      selectedNodeIds.includes(rel.targetTableId)
  );

  return generateDDL(filteredNodes, relevantRelationships, options);
}
