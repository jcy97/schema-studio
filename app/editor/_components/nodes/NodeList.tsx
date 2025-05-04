import { Column } from "@/types/appNode";
import React, { useState, useCallback, useEffect, useRef } from "react";
import NodeItem from "./NodeItem";
import { useSchema } from "@/contexts/SchemaContext";

function NodeList({
  columns,
  onColumnsChange,
}: {
  columns: Column[];
  onColumnsChange?: (updatedColumns: Column[]) => void;
}) {
  // 내부 상태로 컬럼 관리
  const [localColumns, setLocalColumns] = useState<Column[]>(
    [...columns].sort((a, b) => a.order - b.order)
  );

  // Schema 컨텍스트에서 상태와 함수 가져오기
  const {
    selectedColumnId,
    onColumnSelect,
    updateColumnOrders,
    getSelectedNode,
    removeColumn,
  } = useSchema();

  // 선택된 노드 가져오기
  const selectedNode = getSelectedNode();
  const nodeId = selectedNode?.id || "";

  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 아이템의 인덱스 찾기
  const getSelectedIndex = useCallback((): number | null => {
    if (!selectedColumnId) return null;
    const index = localColumns.findIndex((col) => col.id === selectedColumnId);
    return index !== -1 ? index : null;
  }, [localColumns, selectedColumnId]);

  // 아이템 클릭 이벤트 처리 함수
  const handleItemClick = useCallback(
    (index: number) => {
      const column = localColumns[index];
      console.log("Clicking column:", column.id, column.logicalName); // 디버깅 로그
      onColumnSelect(column.id);
    },
    [localColumns, onColumnSelect]
  );

  // columns prop이 변경되면 localColumns 업데이트
  useEffect(() => {
    setLocalColumns([...columns].sort((a, b) => a.order - b.order));
  }, [columns]);

  // 그립 핸들에서 마우스 다운 이벤트 처리
  const handleGripMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); // reactFlow의 이벤트 전파 방지
      setIsDragging(true);
      setDraggedIndex(index);

      // 드래그하는 동안 텍스트 선택 방지
      document.body.style.userSelect = "none";

      // 배경색 변경으로 현재 드래그 중인 아이템 표시
      const items = listRef.current?.querySelectorAll(".flex");
      if (items && items[index]) {
        (items[index] as HTMLElement).style.backgroundColor = "#f3f4f6";
      }
    },
    []
  );

  // 마우스 이동 이벤트 처리
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || draggedIndex === null || !listRef.current) return;

      // 마우스 위치에 있는 요소 찾기
      const itemElements = listRef.current.querySelectorAll(".flex");
      const mouseY = e.clientY;

      let overIndex: number | null = null;

      // 마우스가 어떤 아이템 위에 있는지 확인
      itemElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (mouseY >= rect.top && mouseY <= rect.bottom) {
          overIndex = index;
        }
      });

      if (overIndex !== null && overIndex !== draggedIndex) {
        setDragOverIndex(overIndex);

        // 드래그 오버 효과 적용
        itemElements.forEach((element, index) => {
          const el = element as HTMLElement;
          if (index === overIndex) {
            el.style.borderTop = "2px solid #4f46e5";
          } else {
            el.style.borderTop = "";
          }
        });
      }
    },
    [isDragging, draggedIndex]
  );

  // 마우스 업 이벤트 처리
  const handleMouseUp = useCallback(() => {
    if (!isDragging || draggedIndex === null || dragOverIndex === null) {
      // 드래그 취소 시 스타일 초기화
      if (listRef.current) {
        const items = listRef.current.querySelectorAll(".flex");
        items.forEach((item) => {
          (item as HTMLElement).style.backgroundColor = "";
          (item as HTMLElement).style.borderTop = "";
        });
      }

      setIsDragging(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
      document.body.style.userSelect = "";
      return;
    }

    // 아이템 순서 변경
    if (draggedIndex !== dragOverIndex) {
      const updatedColumns = [...localColumns];
      const [draggedItem] = updatedColumns.splice(draggedIndex, 1);
      updatedColumns.splice(dragOverIndex, 0, draggedItem);

      // order 값 업데이트
      const columnsWithUpdatedOrder = updatedColumns.map((col, index) => ({
        ...col,
        order: index,
      }));

      // 로컬 상태 업데이트
      setLocalColumns(columnsWithUpdatedOrder);

      // 컨텍스트를 통해 전역 상태 업데이트
      if (nodeId) {
        updateColumnOrders(nodeId, columnsWithUpdatedOrder);
      }

      // 상위 컴포넌트에 변경 사항 전달 (필요한 경우)
      if (onColumnsChange) {
        onColumnsChange(columnsWithUpdatedOrder);
      }
    }

    // 스타일 초기화
    if (listRef.current) {
      const items = listRef.current.querySelectorAll(".flex");
      items.forEach((item) => {
        (item as HTMLElement).style.backgroundColor = "";
        (item as HTMLElement).style.borderTop = "";
      });
    }

    // 상태 초기화
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
    document.body.style.userSelect = "";
  }, [
    isDragging,
    draggedIndex,
    dragOverIndex,
    localColumns,
    onColumnsChange,
    nodeId,
    updateColumnOrders,
  ]);

  // 마우스 이벤트 리스너 설정/제거
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 현재 선택된 인덱스 계산
  const selectedIndex = getSelectedIndex();

  const handleItemRemove = (columnId: string) => {
    removeColumn(nodeId, columnId);
  };

  return (
    <div className="bg-white w-full h-full" ref={listRef}>
      {localColumns.map((column, index) => (
        <NodeItem
          key={column.id}
          item={column}
          index={index}
          onGripMouseDown={handleGripMouseDown}
          isSelected={selectedIndex === index}
          onItemClick={handleItemClick}
          onRemove={handleItemRemove}
        />
      ))}
    </div>
  );
}

export default NodeList;
