import { useSchema } from "@/contexts/SchemaContext";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ColumnDataType } from "@/types/appNode";
import { DataTypes } from "@/constants/datatype";

function ColumnProperty() {
  const { getSelectedColumn, getSelectedNode, updateNode } = useSchema();
  const selectedColumn = getSelectedColumn();
  const selectedNode = getSelectedNode();

  if (!selectedColumn || !selectedNode) {
    return <div className="p-4 text-gray-500">컬럼을 선택해주세요.</div>;
  }

  // 컬럼 속성 업데이트 핸들러
  const handleColumnChange = (propertyKey: string, value: any) => {
    if (selectedNode && selectedColumn) {
      // 노드의 columns 배열에서 선택된 컬럼을 찾아 업데이트
      const updatedColumns = selectedNode.data.columns?.map((column) =>
        column.id === selectedColumn.id
          ? { ...column, [propertyKey]: value }
          : column
      );

      // 업데이트된 columns 배열로 노드 업데이트
      updateNode(selectedNode.id, { columns: updatedColumns });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">컬럼 속성</h3>

      <div className="space-y-2">
        <Label htmlFor="logicalName">논리명</Label>
        <Input
          id="logicalName"
          value={selectedColumn.logicalName}
          onChange={(e) => handleColumnChange("logicalName", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="physicalName">물리명</Label>
        <Input
          id="physicalName"
          value={selectedColumn.physicalName}
          onChange={(e) => handleColumnChange("physicalName", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataType">데이터 타입</Label>
        <Select
          value={selectedColumn.dataType}
          onValueChange={(value) =>
            handleColumnChange("dataType", value as ColumnDataType)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="데이터 타입 선택" />
          </SelectTrigger>
          <SelectContent>
            {(Object.values(DataTypes) as string[]).map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <h4 className="font-medium">제약조건</h4>

      <div className="flex items-center justify-between">
        <Label htmlFor="isPrimaryKey">기본키 (PK)</Label>
        <Switch
          id="isPrimaryKey"
          checked={selectedColumn.constraints?.isPrimaryKey || false}
          onCheckedChange={(checked) =>
            handleColumnChange("constraints", {
              ...selectedColumn.constraints,
              isPrimaryKey: checked,
            })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isNotNull">Not Null</Label>
        <Switch
          id="isNotNull"
          checked={selectedColumn.constraints?.isNotNull || false}
          onCheckedChange={(checked) =>
            handleColumnChange("constraints", {
              ...selectedColumn.constraints,
              isNotNull: checked,
            })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isUnique">Unique</Label>
        <Switch
          id="isUnique"
          checked={selectedColumn.constraints?.isUnique || false}
          onCheckedChange={(checked) =>
            handleColumnChange("constraints", {
              ...selectedColumn.constraints,
              isUnique: checked,
            })
          }
        />
      </div>

      {/* 필요한 경우 기본값 등 추가 속성을 여기에 구현 */}
    </div>
  );
}

export default ColumnProperty;
