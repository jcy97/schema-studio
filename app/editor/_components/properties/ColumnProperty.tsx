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
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

function ColumnProperty() {
  const {
    getSelectedColumn,
    getSelectedNode,
    updateNode,
    nodes,
    relationships,
    updateRelationship,
  } = useSchema();
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

  // 관계 정보 가져오기
  const getForeignKeyInfo = () => {
    if (!selectedColumn.constraints?.foreignKey) return null;
    const { tableId, columnId } = selectedColumn.constraints.foreignKey;

    const referencedTable = nodes.find((node) => node.id === tableId);
    if (!referencedTable)
      return {
        tableName: "테이블을 찾을 수 없음",
        columnName: "컬럼을 찾을 수 없음",
      };

    const referencedColumn = referencedTable.data.columns.find(
      (col) => col.id === columnId
    );
    if (!referencedColumn)
      return {
        tableName: referencedTable.data.logicalName,
        physicalTableName: referencedTable.data.physicalName,
        columnName: "컬럼을 찾을 수 없음",
      };
    return {
      tableName: referencedTable.data.logicalName,
      physicalName: referencedTable.data.physicalName,
      columnName: referencedColumn.logicalName,
      physicalColumnName: referencedColumn.physicalName,
    };
  };

  //관계 찾기
  const findRelatedRelationship = () => {
    if (!selectedColumn.constraints?.foreignKey) return null;

    // 현재 선택된 컬럼이 타겟 컬럼인 관계 찾기
    return relationships.find(
      (rel) =>
        rel.targetTableId === selectedNode.id &&
        rel.targetColumnIds.includes(selectedColumn.id)
    );
  };
  //관계 설명 업데이트
  const handleRelationshipDescriptionChange = (description: string) => {
    const relationship = findRelatedRelationship();
    if (relationship) {
      updateRelationship(relationship.id, { description });
    }
  };

  //관계 정보 렌더링
  const renderForeignKeyInfo = () => {
    if (!selectedColumn.constraints?.foreignKey) return null;
    const fkInfo = getForeignKeyInfo();
    if (!fkInfo) return null;

    const relationship = findRelatedRelationship();
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-2">
            <Link className="w-4 h-4 text-purple-600 mr-2" />
            <h4 className="text-sm font-semibold text-purple-600">
              외래키 참조 정보
            </h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">참조 테이블</span>{" "}
              {fkInfo.tableName}
              <span className="text-xs text-gray-500 ml-l">
                ({fkInfo.physicalTableName})
              </span>
            </div>
            <div>
              <span className="font-semibold">참조 컬럼</span>{" "}
              {fkInfo.columnName}
              <span className="text-xs text-gray-500 ml-l">
                ({fkInfo.physicalColumnName})
              </span>
            </div>
            {relationship && (
              <div className="mt-3">
                <Label
                  htmlFor="relationshipDescription"
                  className="font-semibold"
                >
                  관계 설명
                </Label>
                <Textarea
                  id="relationshipDescription"
                  value={relationship.description || ""}
                  onChange={(e) =>
                    handleRelationshipDescriptionChange(e.target.value)
                  }
                  placeholder="이 관계에 대한 설명을 입력하세요"
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
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
          disabled={!!selectedColumn.constraints?.foreignKey}
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

      {/* 외래키 참조 정보 */}
      {renderForeignKeyInfo()}
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
          disabled={!!selectedColumn.constraints?.foreignKey}
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
