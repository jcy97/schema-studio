import { Column } from "@/types/appNode";
import React from "react";
import {
  Key,
  Hash,
  BarChart2,
  Type,
  AlignLeft,
  Calendar,
  Clock,
  ToggleRight,
  Database,
  GripVertical,
  Trash2,
  Link,
} from "lucide-react";
import TooltipWrapper from "@/components/TooltipWrapper";

function NodeItem({
  item,
  index,
  onGripMouseDown,
  isSelected,
  onItemClick,
  onRemove,
}: {
  item: Column;
  index: number;
  onGripMouseDown: (e: React.MouseEvent, index: number) => void;
  isSelected: boolean;
  onItemClick: (index: number) => void;
  onRemove: (columnId: string) => void;
}) {
  // 컬럼 유형에 따른 아이콘 렌더링 함수
  const renderColumnIcon = (): JSX.Element => {
    // Primary Key인 경우 Key 아이콘 반환
    if (item.constraints.isPrimaryKey) {
      return <Key className="w-4 h-4 text-yellow-600 mr-2" />;
    }
    // Foreign Key인 경우 Key 아이콘 반환
    if (item.constraints.foreignKey) {
      return <Link className="w-4 h-4 text-purple-600 mr-2" />;
    }

    // Primary Key가 아닌 경우 데이터 타입에 따라 아이콘 반환
    switch (item.dataType) {
      case "int":
        return <Hash className="w-4 h-4 text-blue-600 mr-2" />;
      case "float":
      case "decimal":
        return <BarChart2 className="w-4 h-4 text-indigo-600 mr-2" />;
      case "varchar":
      case "char":
        return <Type className="w-4 h-4 text-green-600 mr-2" />;
      case "text":
        return <AlignLeft className="w-4 h-4 text-teal-600 mr-2" />;
      case "date":
        return <Calendar className="w-4 h-4 text-orange-600 mr-2" />;
      case "datetime":
        return <Clock className="w-4 h-4 text-amber-600 mr-2" />;
      case "boolean":
        return <ToggleRight className="w-4 h-4 text-purple-600 mr-2" />;
      default:
        return <Database className="w-4 h-4 text-gray-600 mr-2" />;
    }
  };

  //FK 또는 PK 표시 뱃지
  const renderConstraintBadge = () => {
    if (item.constraints.isPrimaryKey) {
      return (
        <span className="text-xs font-semibold text-yellow-600 ml-1">PK</span>
      );
    }
    if (item.constraints.foreignKey) {
      return (
        <span className="text-xs font-semibold text-purple-600 ml-1">FK</span>
      );
    }
    return null;
  };
  return (
    <div
      className={`flex items-center p-2 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
      data-index={index}
      onClick={() => onItemClick(index)}
    >
      {renderColumnIcon()}
      <p className="font-medium dark:text-gray-700">{item.logicalName}</p>
      {renderConstraintBadge()}
      <span className="text-xs text-gray-500 dark:text-gray-700 ml-2">
        ({item.physicalName})
      </span>
      {/* nodrag를 통해 노드 드래그 이벤트 비활성화 */}
      <div
        className="ml-auto cursor-grab nodrag"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onGripMouseDown(e, index);
        }}
      >
        <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-700" />
      </div>
      <div className="nodrag">
        <TooltipWrapper content={"컬럼을 삭제합니다."}>
          <Trash2
            className="w-4 h-4 text-gray-400 hover:text-destructive dark:text-gray-700 dark:hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          />
        </TooltipWrapper>
      </div>
    </div>
  );
}

export default NodeItem;
