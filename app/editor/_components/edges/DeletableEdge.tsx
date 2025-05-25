"use client";

import { Button } from "@/components/ui/button";
import { useSchema } from "@/contexts/SchemaContext";
import { Relationship, RelationshipType } from "@/types/appNode";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";
import { useEffect } from "react";

interface ExtendedEdgeProps extends EdgeProps {
  data?: {
    relationship?: Relationship;
  };
}

export default function DeleteableEdge(props: ExtendedEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const { setEdges } = useReactFlow();
  const { removeRelationship, nodes, updateNode } = useSchema();

  // 전역 마커 정의
  useEffect(() => {
    const existingMarkers = document.getElementById("er-diagram-markers");
    if (existingMarkers) return;

    // SVG defs 요소 생성
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.id = "er-diagram-markers";
    newSvg.style.position = "absolute";
    newSvg.style.width = "0";
    newSvg.style.height = "0";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    // 까마귀발 마커 (Many) - 크기 축소
    const crowFootMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    crowFootMarker.setAttribute("id", "crow-foot-marker");
    crowFootMarker.setAttribute("markerWidth", "12");
    crowFootMarker.setAttribute("markerHeight", "12");
    crowFootMarker.setAttribute("refX", "10");
    crowFootMarker.setAttribute("refY", "6");
    crowFootMarker.setAttribute("orient", "auto");

    const crowFootPath1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    crowFootPath1.setAttribute("d", "M 3 3 L 8 6 L 3 9");
    crowFootPath1.setAttribute("fill", "none");
    crowFootPath1.setAttribute("stroke", "#374151");
    crowFootPath1.setAttribute("stroke-width", "1.2");

    const crowFootPath2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    crowFootPath2.setAttribute("d", "M 8 6 L 12 6");
    crowFootPath2.setAttribute("fill", "none");
    crowFootPath2.setAttribute("stroke", "#374151");
    crowFootPath2.setAttribute("stroke-width", "1.2");

    crowFootMarker.appendChild(crowFootPath1);
    crowFootMarker.appendChild(crowFootPath2);

    // 일반 선 마커 (One) - 크기 축소
    const oneMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    oneMarker.setAttribute("id", "one-marker");
    oneMarker.setAttribute("markerWidth", "12");
    oneMarker.setAttribute("markerHeight", "12");
    oneMarker.setAttribute("refX", "10");
    oneMarker.setAttribute("refY", "6");
    oneMarker.setAttribute("orient", "auto");

    const onePath1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    onePath1.setAttribute("d", "M 8 3 L 8 9");
    onePath1.setAttribute("fill", "none");
    onePath1.setAttribute("stroke", "#374151");
    onePath1.setAttribute("stroke-width", "1.5");

    const onePath2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    onePath2.setAttribute("d", "M 8 6 L 12 6");
    onePath2.setAttribute("fill", "none");
    onePath2.setAttribute("stroke", "#374151");
    onePath2.setAttribute("stroke-width", "1.2");

    oneMarker.appendChild(onePath1);
    oneMarker.appendChild(onePath2);

    defs.appendChild(crowFootMarker);
    defs.appendChild(oneMarker);
    newSvg.appendChild(defs);
    document.body.appendChild(newSvg);
  }, []);

  const handleRemoveEdge = () => {
    const relationshipId = props.id.replace(/-source$|-target$/, "");
    const relationship = props.data?.relationship;

    if (relationship) {
      const targetTable = nodes.find(
        (node) => node.id === relationship.targetTableId
      );
      if (targetTable) {
        const fkColumnIds = relationship.targetColumnIds || [];

        if (fkColumnIds.length > 0) {
          const updatedColumns = targetTable.data.columns.filter(
            (column) => !fkColumnIds.includes(column.id)
          );

          updateNode(targetTable.id, {
            columns: updatedColumns,
          });
        }
      }

      removeRelationship(relationshipId);
    } else {
      setEdges((edges) => edges.filter((edge) => edge.id !== props.id));
    }
  };

  // 바커 표기법 마커 설정
  const getMarkerConfig = () => {
    const relationship = props.data?.relationship;
    if (!relationship) return {};

    switch (relationship.type) {
      case RelationshipType.ONE_TO_MANY:
        // A(source/부모)에서 B(target/자식)로: A는 일반선, B는 까마귀발
        return {
          markerStart: "url(#one-marker)", // source(A)에 일반선
          markerEnd: "url(#crow-foot-marker)", // target(B)에 까마귀발
        };
      case RelationshipType.MANY_TO_ONE:
        return {
          markerStart: "url(#crow-foot-marker)",
          markerEnd: "url(#one-marker)",
        };
      case RelationshipType.ONE_TO_ONE:
        return {
          markerStart: "url(#one-marker)",
          markerEnd: "url(#one-marker)",
        };
      case RelationshipType.MANY_TO_MANY:
        return {
          markerStart: "url(#crow-foot-marker)",
          markerEnd: "url(#crow-foot-marker)",
        };
      default:
        return {};
    }
  };

  const markerConfig = getMarkerConfig();
  const relationship = props.data?.relationship;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerConfig.markerEnd}
        markerStart={markerConfig.markerStart}
        style={{
          ...props.style,
          stroke: "#374151",
          strokeWidth: 2,
        }}
      />

      {/* 관계 타입 라벨 */}
      {relationship && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${
                labelY - 20
              }px)`,
              pointerEvents: "none",
              fontSize: "12px",
              fontWeight: "500",
              color: "#374151",
              backgroundColor: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {getRelationshipLabel(relationship.type)}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* 삭제 버튼 */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <Button
            variant={"outline"}
            size={"icon"}
            className="w-5 h-5 border cursor-pointer rounded-full text-xs leading-none hover:shadow-lg bg-white"
            onClick={handleRemoveEdge}
          >
            ×
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// 관계 타입 라벨 반환 함수
function getRelationshipLabel(type: RelationshipType): string {
  switch (type) {
    case RelationshipType.ONE_TO_ONE:
      return "1:1";
    case RelationshipType.ONE_TO_MANY:
      return "1:N";
    case RelationshipType.MANY_TO_ONE:
      return "N:1";
    case RelationshipType.MANY_TO_MANY:
      return "M:N";
    default:
      return "";
  }
}
