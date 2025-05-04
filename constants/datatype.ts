// @/constants/DataTypes.ts
import { DataType, ColumnDataType } from "@/types/appNode";

// 열거형 자체를 export
export const DataTypes = DataType;

// 모든 데이터 타입 값을 배열로 가져오고 싶을 경우를 위한 헬퍼 함수/상수
export const ALL_DATA_TYPES: ColumnDataType[] = Object.values(DataType);
