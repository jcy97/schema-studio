"use client";

import { Button } from "@/components/ui/button";
import { useSchema } from "@/contexts/SchemaContext";
import { Relationship } from "@/types/appNode";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";

interface ExtendedEdgeProps extends EdgeProps {
  data?: {
    relationship?: Relationship;
  };
}

export default function DeleteableEdge(props: ExtendedEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const { setEdges } = useReactFlow();

  const { removeRelationship, nodes, updateNode } = useSchema();

  const handleRemoveEdge = () => {
    const relationshipId = props.id.replace(/-source$|-target$/, "");

    const relationship = props.data?.relationship;

    if (relationship) {
      //FK 컬럼 삭제 처리
      const targetTable = nodes.find(
        (node) => node.id === relationship.targetTableId
      );
      if (targetTable) {
        const fkColumnIds = relationship.targetColumnIds || [];

        //FK 컬럼 제거
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

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={props.style}
      />
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
            className="w-5 h-5 border cursor-pointer rounded-full text-xs leading-none hober:shadow-lg"
            onClick={handleRemoveEdge}
          >
            x
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
