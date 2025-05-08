// DBMS 타입 정의
export enum DBMSType {
  MYSQL = "MySQL",
  POSTGRESQL = "PostgreSQL",
  ORACLE = "Oracle",
  SQLSERVER = "SQL Server",
  SQLITE = "SQLite",
}

// DBMS별 옵션 인터페이스
export interface DBMSOptions {
  version?: string;
  charset?: string;
  collation?: string;
  schema?: string;
  identifierQuotes?: "single" | "double" | "backtick" | "brackets" | "none";
}

// SQL 생성 옵션 인터페이스
export interface SQLGenerationOptions {
  dbms: DBMSType;
  dbmsOptions?: DBMSOptions;
  // 추가 출력 옵션
  includeDropStatements?: boolean;
  includeComments?: boolean;
  includeSchemaPrefix?: boolean;
}
