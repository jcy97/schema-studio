import { DBMSOptions, DBMSType } from "./dbms";

/**
 * 식별자(테이블명, 컬럼명)에 적절한 따옴표를 적용
 */
export function quoteIdentifier(
  identifier: string,
  dbms: DBMSType,
  options?: DBMSOptions
): string {
  const quote = getIdentifierQuote(dbms, options);
  if (!quote) return identifier;

  // 이미 따옴표가 적용된 경우 중복 방지
  if (
    (quote === "[" && identifier.startsWith("[") && identifier.endsWith("]")) ||
    (quote !== "[" &&
      identifier.startsWith(quote) &&
      identifier.endsWith(quote))
  ) {
    return identifier;
  }

  // SQL Server의 경우 닫는 괄호를 ']'로 처리
  if (quote === "[") {
    return `[${identifier}]`;
  }

  return `${quote}${identifier}${quote}`;
}
/**
 * DBMS별 식별자 따옴표 반환
 */
function getIdentifierQuote(dbms: DBMSType, options?: DBMSOptions): string {
  // 옵션에 명시적으로 지정된 경우 우선 적용
  if (options?.identifierQuotes) {
    switch (options.identifierQuotes) {
      case "single":
        return "'";
      case "double":
        return '"';
      case "backtick":
        return "`";
      case "brackets":
        return "[";
      case "none":
        return "";
    }
  }

  // DBMS 기본값
  switch (dbms) {
    case DBMSType.MYSQL:
      return "`";
    case DBMSType.POSTGRESQL:
    case DBMSType.ORACLE:
      return '"';
    case DBMSType.SQLSERVER:
      return "[";
    case DBMSType.SQLITE:
      return '"';
    default:
      return "";
  }
}

/**
 * DBMS별 테이블 생성 시 옵션 문자열 반환
 */
export function getTableOptions(dbms: DBMSType, options?: DBMSOptions): string {
  switch (dbms) {
    case DBMSType.MYSQL:
      return getMySQL_TableOptions(options);
    case DBMSType.POSTGRESQL:
      return "";
    case DBMSType.ORACLE:
      return "";
    case DBMSType.SQLSERVER:
      return "";
    case DBMSType.SQLITE:
      return "";
    default:
      return "";
  }
}

/**
 * MySQL 테이블 옵션 문자열 생성
 */
function getMySQL_TableOptions(options?: DBMSOptions): string {
  const opts: string[] = [];

  if (options?.charset) {
    opts.push(`DEFAULT CHARACTER SET=${options.charset}`);
  }

  if (options?.collation) {
    opts.push(`COLLATE=${options.collation}`);
  }

  return opts.length > 0 ? " " + opts.join(" ") : "";
}

/**
 * 데이터 타입 변환
 */
export function convertDataType(
  dataType: string,
  typeOptions: any,
  dbms: DBMSType
): string {
  // 기본 변환 로직
  const baseType = dataType.toUpperCase();

  switch (dbms) {
    case DBMSType.MYSQL:
      return getMySQLDataType(baseType, typeOptions);
    case DBMSType.POSTGRESQL:
      return getPostgreSQLDataType(baseType, typeOptions);
    case DBMSType.ORACLE:
      return getOracleDataType(baseType, typeOptions);
    case DBMSType.SQLSERVER:
      return getSQLServerDataType(baseType, typeOptions);
    case DBMSType.SQLITE:
      return getSQLiteDataType(baseType, typeOptions);
    default:
      return baseType;
  }
}

/**
 * MySQL 데이터 타입 변환
 */
function getMySQLDataType(baseType: string, typeOptions: any): string {
  switch (baseType) {
    case "INT":
    case "INTEGER":
      return "INT";
    case "FLOAT":
      return "FLOAT";
    case "DECIMAL":
      if (typeOptions?.precision && typeOptions?.scale) {
        return `DECIMAL(${typeOptions.precision}, ${typeOptions.scale})`;
      }
      return "DECIMAL(10,2)";
    case "VARCHAR":
      if (typeOptions?.length) {
        return `VARCHAR(${typeOptions.length})`;
      }
      return "VARCHAR(255)";
    case "TEXT":
      return "TEXT";
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "DATETIME";
    case "BOOLEAN":
      return "TINYINT(1)";
    default:
      return baseType;
  }
}

/**
 * PostgreSQL 데이터 타입 변환
 */
function getPostgreSQLDataType(baseType: string, typeOptions: any): string {
  switch (baseType) {
    case "INT":
    case "INTEGER":
      return "INTEGER";
    case "FLOAT":
      return "REAL";
    case "DECIMAL":
      if (typeOptions?.precision && typeOptions?.scale) {
        return `NUMERIC(${typeOptions.precision}, ${typeOptions.scale})`;
      }
      return "NUMERIC(10,2)";
    case "VARCHAR":
      if (typeOptions?.length) {
        return `VARCHAR(${typeOptions.length})`;
      }
      return "VARCHAR(255)";
    case "TEXT":
      return "TEXT";
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "TIMESTAMP";
    case "BOOLEAN":
      return "BOOLEAN";
    default:
      return baseType;
  }
}

/**
 * Oracle 데이터 타입 변환
 */
function getOracleDataType(baseType: string, typeOptions: any): string {
  switch (baseType) {
    case "INT":
    case "INTEGER":
      return "NUMBER(10)";
    case "FLOAT":
      return "FLOAT";
    case "DECIMAL":
      if (typeOptions?.precision && typeOptions?.scale) {
        return `NUMBER(${typeOptions.precision}, ${typeOptions.scale})`;
      }
      return "NUMBER(10,2)";
    case "VARCHAR":
      if (typeOptions?.length) {
        return `VARCHAR2(${typeOptions.length})`;
      }
      return "VARCHAR2(255)";
    case "TEXT":
      return "CLOB";
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "TIMESTAMP";
    case "BOOLEAN":
      return "NUMBER(1)";
    default:
      return baseType;
  }
}

/**
 * SQL Server 데이터 타입 변환
 */
function getSQLServerDataType(baseType: string, typeOptions: any): string {
  switch (baseType) {
    case "INT":
    case "INTEGER":
      return "INT";
    case "FLOAT":
      return "FLOAT";
    case "DECIMAL":
      if (typeOptions?.precision && typeOptions?.scale) {
        return `DECIMAL(${typeOptions.precision}, ${typeOptions.scale})`;
      }
      return "DECIMAL(10,2)";
    case "VARCHAR":
      if (typeOptions?.length) {
        return `VARCHAR(${typeOptions.length})`;
      }
      return "VARCHAR(255)";
    case "TEXT":
      return "TEXT";
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "DATETIME";
    case "BOOLEAN":
      return "BIT";
    default:
      return baseType;
  }
}

/**
 * SQLite 데이터 타입 변환
 */
function getSQLiteDataType(baseType: string, typeOptions: any): string {
  switch (baseType) {
    case "INT":
    case "INTEGER":
      return "INTEGER";
    case "FLOAT":
      return "REAL";
    case "DECIMAL":
      return "REAL";
    case "VARCHAR":
      if (typeOptions?.length) {
        return `TEXT`; // SQLite는 VARCHAR에 길이 제한이 없음
      }
      return "TEXT";
    case "TEXT":
      return "TEXT";
    case "DATE":
      return "TEXT"; // SQLite는 DATE 타입 없음
    case "DATETIME":
      return "TEXT"; // SQLite는 DATETIME 타입 없음
    case "BOOLEAN":
      return "INTEGER"; // 0 또는 1로 저장
    default:
      return baseType;
  }
}

/**
 * 외래 키 제약조건 추가 구문 생성
 */
export function getForeignKeyConstraint(
  constraintName: string,
  tableName: string,
  targetColumns: string[],
  referencedTable: string,
  referencedColumns: string[],
  onDelete?: string,
  onUpdate?: string,
  dbms: DBMSType = DBMSType.MYSQL,
  options?: DBMSOptions
): string {
  const quotedTable = quoteIdentifier(tableName, dbms, options);
  const quotedConstraint = quoteIdentifier(constraintName, dbms, options);
  const quotedRefTable = quoteIdentifier(referencedTable, dbms, options);

  const quotedTargetCols = targetColumns.map((col) =>
    quoteIdentifier(col, dbms, options)
  );
  const quotedRefCols = referencedColumns.map((col) =>
    quoteIdentifier(col, dbms, options)
  );

  let sql = `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${quotedConstraint}\n`;
  sql += `  FOREIGN KEY (${quotedTargetCols.join(", ")})\n`;
  sql += `  REFERENCES ${quotedRefTable} (${quotedRefCols.join(", ")})`;

  if (onDelete) {
    sql += `\n  ON DELETE ${onDelete}`;
  }

  if (onUpdate) {
    // Oracle과 SQLite는 ON UPDATE를 지원하지 않음
    if (dbms !== DBMSType.ORACLE && dbms !== DBMSType.SQLITE) {
      sql += `\n  ON UPDATE ${onUpdate}`;
    }
  }

  sql += ";";

  return sql;
}

/**
 * 테이블 Drop 구문 생성
 */
export function getDropTableStatement(
  tableName: string,
  dbms: DBMSType,
  options?: DBMSOptions
): string {
  const quotedTable = quoteIdentifier(tableName, dbms, options);

  switch (dbms) {
    case DBMSType.MYSQL:
    case DBMSType.POSTGRESQL:
    case DBMSType.SQLITE:
      return `DROP TABLE IF EXISTS ${quotedTable};`;
    case DBMSType.ORACLE:
      return `BEGIN\n  EXECUTE IMMEDIATE 'DROP TABLE ${quotedTable}';\nEXCEPTION\n  WHEN OTHERS THEN\n    IF SQLCODE != -942 THEN\n      RAISE;\n    END IF;\nEND;\n/`;
    case DBMSType.SQLSERVER:
      return `IF OBJECT_ID('${tableName}', 'U') IS NOT NULL\n  DROP TABLE ${quotedTable};`;
    default:
      return `DROP TABLE IF EXISTS ${quotedTable};`;
  }
}
