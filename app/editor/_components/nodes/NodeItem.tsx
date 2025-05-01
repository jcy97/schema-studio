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
} from "lucide-react";

function NodeItem({
  item,
  index,
  onGripMouseDown,
  isSelected,
  onItemClick,
}: {
  item: Column;
  index: number;
  onGripMouseDown: (e: React.MouseEvent, index: number) => void;
  isSelected: boolean;
  onItemClick: (index: number) => void;
}) {
  // 컬럼 유형에 따른 아이콘 렌더링 함수
  const renderColumnIcon = (): JSX.Element => {
    // Primary Key인 경우 Key 아이콘 반환
    if (item.constraints.isPrimaryKey) {
      return <Key className="w-4 h-4 text-yellow-600 mr-2" />;
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

  return (
    <div
      className={`flex items-center p-2 border-b border-gray-100  cursor-pointer ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
      data-index={index}
      onClick={() => onItemClick(index)}
    >
      {renderColumnIcon()}
      <p className="font-medium">{item.logicalName}</p>
      <span className="text-xs text-gray-500 ml-2">({item.physicalName})</span>
      {/* nodrag를 통해 노드 드래그 이벤트 비활성화 */}
      <div
        className="ml-auto cursor-grab nodrag"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onGripMouseDown(e, index);
        }}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

export default NodeItem;
