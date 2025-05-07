"use client";
import { DataTypes } from "@/constants/datatype";
import { getRandomBgColor } from "@/lib/utils";
import { initialEdges, initialNodes, initialRelationships } from "@/sample";
import {
  AppNode,
  Column,
  Relationship,
  RelationshipType,
  RelationshipEdge,
  EdgeHandleInfo,
} from "@/types/appNode";
import {
  Connection,
  Edge,
  useEdgesState,
  useNodesState,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
} from "@xyflow/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

interface SchemaContextType {
  nodes: AppNode[];
  edges: Edge[];
  relationships: Relationship[];
  selectedColumnId: string | null;
  selectedRelationshipId: string | null;
  updateNode: (nodeId: string, data: Partial<AppNode["data"]>) => void;
  addNode: (node?: AppNode) => string;
  removeNode: (nodeId: string) => void;
  addColumn: (nodeId: string) => void;
  cloneNode: (nodeId: string) => void;
  removeColumn: (nodeId: string, columnId: string) => void;

  // 관계 관련 메서드
  updateRelationship: (
    relationshipId: string,
    data: Partial<Relationship>
  ) => void;
  addRelationship: (relationship?: Relationship) => string;
  removeRelationship: (relationshipId: string) => void;

  updateEdges: (edges: Edge[]) => void;
  addEdge: (connection: Connection) => void;
  removeEdge: (edgeId: string) => void;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onNodeSelect: (nodeId: string) => void;
  getSelectedNode: () => AppNode | undefined;
  onColumnSelect: (columnId: string) => void;
  getSelectedColumn: () => Column | null;

  // 관계 선택 관련 메서드
  onRelationshipSelect: (relationshipId: string) => void;
  getSelectedRelationship: () => Relationship | null;

  updateColumnOrders: (nodeId: string, updateColumns: Column[]) => void;

  // SQL 생성 관련 메서드
  generateSqlDDL: () => string;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export const SchemaProvider = ({ children }: { children: React.ReactNode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [relationships, setRelationships] = useState<Relationship[]>(
    initialRelationships || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<
    string | null
  >(null);

  // 초기화 여부를 추적하는 ref
  const initializedRef = useRef(false);

  // 최초 로딩 시에만 한 번 0번 컬럼 선택
  useEffect(() => {
    if (initializedRef.current) return;

    if (nodes.length > 0) {
      const firstNode = nodes[0];
      if (firstNode.data.columns && firstNode.data.columns.length > 0) {
        setSelectedColumnId(firstNode.data.columns[0].id);
        setSelectedNodeId(firstNode.id);
        initializedRef.current = true;
      }
    }
  }, [nodes]);

  useEffect(() => {
    if (initialRelationships && initialEdges.length > 0) {
      synchronizeEdgesWithRelationships();
    }
  }, []);

  // 관계 변경시 엣지 동기화
  useEffect(() => {
    synchronizeEdgesWithRelationships();
  }, [relationships]);

  const synchronizeEdgesWithRelationships = useCallback(() => {
    // 핸들 정보 유지를 위한 객체
    const existingEdgeHandles: Record<string, EdgeHandleInfo> = {};

    edges.forEach((edge) => {
      existingEdgeHandles[edge.id] = {
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
      };
    });

    const relationshipEdges = relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceTableId,
      target: rel.targetTableId,
      sourceHandle: existingEdgeHandles[rel.id]?.sourceHandle || null,
      targetHandle: existingEdgeHandles[rel.id]?.targetHandle || null,
      type: "deletableEdge",
      data: { relationship: rel },
    }));

    setEdges(relationshipEdges);
  }, [relationships, edges, setEdges]);

  const updateNode = (nodeId: string, data: Partial<AppNode["data"]>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Create new node object to change reference
          const newNode = {
            ...node,
            data: { ...node.data, ...data },
          };
          console.log("Node update:", nodeId, newNode.data);
          return newNode;
        }
        return node;
      })
    );
  };

  const addNode = (customNode?: AppNode) => {
    const newNodeId = customNode?.id || `node-${Date.now()}`;

    let nodeToAdd: AppNode;
    if (customNode) {
      nodeToAdd = customNode;
    } else {
      let newX = 100;
      let newY = 100;
      if (nodes.length > 0) {
        const rightmostNode = nodes.reduce((prev, current) => {
          return prev.position.x > current.position.x ? prev : current;
        });
        const bottommostNode = nodes.reduce((prev, current) => {
          return prev.position.y > current.position?.y ? prev : current;
        });
        newX = rightmostNode.position.x + 400;
        newY = bottommostNode.position.y;

        const estimatedViewportWidth = 1500;
        if (newX > estimatedViewportWidth) {
          newX = 100;
          newY = bottommostNode.position.y + 400;
        }
      }
      nodeToAdd = {
        id: newNodeId,
        type: "SchemaNode",
        position: { x: newX, y: newY },
        data: {
          id: newNodeId,
          logicalName: "새 스키마",
          physicalName: "NEW-TB",
          color: getRandomBgColor(),
          columns: [
            {
              id: `col-${Date.now()}`,
              logicalName: "ID",
              physicalName: "ID",
              dataType: DataTypes.INT,
              order: 0,
              constraints: {
                isPrimaryKey: true,
                isNotNull: true,
              },
            },
          ],
        },
      };
    }
    setNodes((nds) => [...nds, nodeToAdd]);

    setTimeout(() => {
      onNodeSelect(nodeToAdd.id);
    }, 50);

    return nodeToAdd.id;
  };

  const removeNode = (nodeId: string) => {
    // 노드 삭제 시 관련된 관계도 모두 삭제
    setRelationships((rels) =>
      rels.filter(
        (rel) =>
          rel.sourceTableId !== nodeId &&
          rel.targetTableId !== nodeId &&
          (!rel.junctionTable || rel.junctionTable.tableId !== nodeId)
      )
    );

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  };

  const cloneNode = (nodeId: string) => {
    const originNode = nodes.find((node) => node.id === nodeId);
    if (!originNode) {
      console.error("Node not found!");
      return;
    }
    const newNodeId = `node-${Date.now()}`;

    const clonedColumns = originNode.data.columns.map((column) => {
      return {
        ...column,
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
    });

    const offsetX = 300;
    const offsetY = 350;

    const clonedNode: AppNode = {
      ...originNode,
      id: newNodeId,
      position: {
        x: originNode.position.x + offsetX,
        y: originNode.position.y + offsetY,
      },
      selected: false,
      data: {
        ...originNode.data,
        id: newNodeId,
        columns: clonedColumns,
        logicalName: `${originNode.data.logicalName}-copy`,
        physicalName: `${originNode.data.physicalName}-copy`,
      },
    };

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    );

    setTimeout(() => {
      addNode(clonedNode);
      setTimeout(() => {
        onNodeSelect(newNodeId);
      }, 50);
    }, 0);
  };

  const addColumn = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const columns = [...(node.data.columns || [])];
          const newColumnId = `col-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;
          const newColumn: Column = {
            id: newColumnId,
            logicalName: "새 컬럼",
            physicalName: "NewColumn",
            dataType: DataTypes.INT,
            order: columns.length,
            constraints: {},
          };

          columns.push(newColumn);
          setSelectedColumnId(newColumnId);
          return {
            ...node,
            data: {
              ...node.data,
              columns,
            },
          };
        }
        return node;
      })
    );
  };

  const removeColumn = (nodeId: string, columnId: string) => {
    // 해당 컬럼을 참조하는 관계도 함께 삭제
    setRelationships((rels) =>
      rels.filter((rel) => {
        // 소스나 타겟 컬럼에 포함되어 있는지 확인
        const isSourceColumn = rel.sourceColumnIds.includes(columnId);
        const isTargetColumn = rel.targetColumnIds.includes(columnId);

        // 중간 테이블의 컬럼인지 확인
        const isJunctionSourceColumn =
          rel.junctionTable?.sourceColumnIds.includes(columnId);
        const isJunctionTargetColumn =
          rel.junctionTable?.targetColumnIds.includes(columnId);

        // 어느 쪽에도 포함되지 않은 관계만 유지
        return (
          !isSourceColumn &&
          !isTargetColumn &&
          !isJunctionSourceColumn &&
          !isJunctionTargetColumn
        );
      })
    );

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const filteredColumns = node.data.columns.filter(
            (column) => column.id !== columnId
          );
          if (selectedColumnId === columnId) {
            if (filteredColumns.length > 0) {
              setSelectedColumnId(filteredColumns[0].id);
            } else {
              setSelectedColumnId(null);
            }
          }
          return {
            ...node,
            data: {
              ...node.data,
              columns: filteredColumns,
            },
          };
        }
        return node;
      })
    );
  };

  // 관계 관련 메서드 추가
  const updateRelationship = (
    relationshipId: string,
    data: Partial<Relationship>
  ) => {
    setRelationships((rels) =>
      rels.map((rel) => {
        if (rel.id === relationshipId) {
          return { ...rel, ...data };
        }
        return rel;
      })
    );
  };

  const addRelationship = (customRelationship?: Relationship) => {
    const newRelationshipId = customRelationship?.id || `rel-${Date.now()}`;

    if (customRelationship) {
      setRelationships((rels) => [
        ...rels,
        { ...customRelationship, id: newRelationshipId },
      ]);
    } else {
      // 기본 관계 생성 (선택된 노드가 있을 경우 소스로 설정)
      const sourceNodeId =
        selectedNodeId || (nodes.length > 0 ? nodes[0].id : "");

      if (!sourceNodeId) {
        console.error("관계 생성을 위한 소스 노드가 없습니다.");
        return newRelationshipId;
      }

      // 기본 타겟 노드 (소스 노드가 아닌 첫 번째 노드)
      const targetNodeId =
        nodes.find((node) => node.id !== sourceNodeId)?.id || "";

      if (!targetNodeId) {
        console.error("관계 생성을 위한 타겟 노드가 없습니다.");
        return newRelationshipId;
      }

      // 소스 노드의 PK 컬럼 찾기
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      const sourceColumn =
        sourceNode?.data.columns.find((col) => col.constraints.isPrimaryKey) ||
        sourceNode?.data.columns[0];

      // 타겟 노드의 FK 컬럼 (또는 첫 번째 컬럼)
      const targetNode = nodes.find((node) => node.id === targetNodeId);
      const targetColumn =
        targetNode?.data.columns.find((col) => col.constraints.foreignKey) ||
        targetNode?.data.columns[0];

      if (!sourceColumn || !targetColumn) {
        console.error("관계 생성을 위한 컬럼을 찾을 수 없습니다.");
        return newRelationshipId;
      }

      const newRelationship: Relationship = {
        id: newRelationshipId,
        name: `${sourceNode?.data.logicalName}-${targetNode?.data.logicalName}`,
        type: RelationshipType.ONE_TO_MANY, // 기본값
        sourceTableId: sourceNodeId,
        sourceColumnIds: [sourceColumn.id],
        targetTableId: targetNodeId,
        targetColumnIds: [targetColumn.id],
        onDelete: "CASCADE", // 기본값
        description: `${sourceNode?.data.logicalName}과(와) ${targetNode?.data.logicalName} 간의 관계`,
      };

      setRelationships((rels) => [...rels, newRelationship]);
      setSelectedRelationshipId(newRelationshipId);
    }

    return newRelationshipId;
  };

  const removeRelationship = (relationshipId: string) => {
    setRelationships((rels) => rels.filter((rel) => rel.id !== relationshipId));

    // 선택된 관계가 삭제된 경우, 다른 관계 선택
    if (selectedRelationshipId === relationshipId) {
      const remainingRelationships = relationships.filter(
        (rel) => rel.id !== relationshipId
      );
      if (remainingRelationships.length > 0) {
        setSelectedRelationshipId(remainingRelationships[0].id);
      } else {
        setSelectedRelationshipId(null);
      }
    }
  };

  const updateEdges = (newEdges: Edge[]) => {
    setEdges(newEdges);
  };

  const addEdge = (connection: Connection) => {
    // 엣지 추가 시 관계도 함께 생성
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) {
      console.error("엣지 생성 실패: 노드를 찾을 수 없습니다.");
      return;
    }

    // 소스 노드의 PK 컬럼 (또는 첫 번째 컬럼)
    const sourceColumn =
      sourceNode.data.columns.find((col) => col.constraints.isPrimaryKey) ||
      sourceNode.data.columns[0];

    // 타겟 노드에 FK 컬럼 추가 또는 기존 FK 컬럼 사용
    let targetColumnId = "";
    let isNewColumn = false;

    const existingFkColumn = targetNode.data.columns.find(
      (col) => col.constraints.foreignKey?.tableId === sourceNode.id
    );

    if (existingFkColumn) {
      targetColumnId = existingFkColumn.id;
    } else {
      // 새 FK 컬럼 추가
      const newColumnId = `col-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const fkColumnName = `${sourceNode.data.physicalName
        .toLowerCase()
        .replace(/-/g, "_")}_id`;

      const newFkColumn: Column = {
        id: newColumnId,
        logicalName: `${sourceNode.data.logicalName} ID`,
        physicalName: fkColumnName,
        dataType: sourceColumn.dataType,
        order: targetNode.data.columns.length,
        constraints: {
          isNotNull: true,
          foreignKey: {
            tableId: sourceNode.id,
            columnId: sourceColumn.id,
          },
        },
      };

      updateNode(targetNode.id, {
        columns: [...targetNode.data.columns, newFkColumn],
      });

      targetColumnId = newColumnId;
      isNewColumn = true;
    }

    // 관계 생성
    const relationshipId = `rel-${Date.now()}`;
    const newRelationship: Relationship = {
      id: relationshipId,
      name: `${sourceNode.data.logicalName}-${targetNode.data.logicalName}`,
      type: RelationshipType.ONE_TO_MANY,
      sourceTableId: sourceNode.id,
      sourceColumnIds: [sourceColumn.id],
      targetTableId: targetNode.id,
      targetColumnIds: [targetColumnId],
      onDelete: "CASCADE",
      description: `${sourceNode.data.logicalName}과(와) ${targetNode.data.logicalName} 간의 관계`,
    };

    setRelationships((rels) => [...rels, newRelationship]);

    // 엣지 생성 (관계가 자동으로 엣지로 변환됨)
    const newEdge: Edge = {
      id: relationshipId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "deletableEdge",
      data: { relationship: newRelationship },
    };
    setEdges((eds) => [...eds, newEdge]);
  };

  const removeEdge = (edgeId: string) => {
    // 관련 관계도 함께 삭제
    // 기본 엣지 ID와 관계 ID가 같은 경우
    const directRelationship = relationships.find((rel) => rel.id === edgeId);

    // N:M 관계의 경우 엣지 ID가 rel-id-source 또는 rel-id-target 형태
    const manyToManyBaseId = edgeId.replace(/-source$|-target$/, "");
    const manyToManyRelationship = relationships.find(
      (rel) => rel.id === manyToManyBaseId
    );

    if (directRelationship) {
      removeRelationship(directRelationship.id);
    } else if (manyToManyRelationship) {
      removeRelationship(manyToManyRelationship.id);
    }

    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  };

  const onNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);

    // 이미 선택된 컬럼이 없는 경우에만 첫 번째 컬럼을 자동 선택
    const selectedNode = nodes.find((node) => node.id === nodeId);
    const currentSelectedColumn = getSelectedColumn();

    // 현재 선택된 컬럼이 없거나, 선택된 컬럼이 다른 노드에 속해 있는 경우에만 첫 번째 컬럼 선택
    if (!currentSelectedColumn || getSelectedNode()?.id !== nodeId) {
      if (
        selectedNode &&
        selectedNode.data.columns &&
        selectedNode.data.columns.length > 0
      ) {
        setSelectedColumnId(selectedNode.data.columns[0].id);
      } else {
        setSelectedColumnId(null);
      }
    }
  };

  const onRelationshipSelect = (relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
  };

  const onColumnSelect = (columnId: string) => {
    console.log("Column selected:", columnId); // 디버깅용 로그 추가
    setSelectedColumnId(columnId);
  };

  const getSelectedNode = useCallback(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const getSelectedColumn = useCallback((): Column | null => {
    const selectedNode = getSelectedNode();
    if (!selectedNode || !selectedColumnId) return null;

    const selectedColumn = selectedNode.data.columns?.find(
      (column) => column.id === selectedColumnId
    );

    return selectedColumn || null;
  }, [selectedColumnId, getSelectedNode]);

  const getSelectedRelationship = useCallback((): Relationship | null => {
    if (!selectedRelationshipId) return null;
    return (
      relationships.find((rel) => rel.id === selectedRelationshipId) || null
    );
  }, [selectedRelationshipId, relationships]);

  const updateColumnOrders = (nodeId: string, updatedColumns: Column[]) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              columns: updatedColumns,
            },
          };
        }
        return node;
      })
    );
  };

  // SQL DDL 생성 함수
  const generateSqlDDL = useCallback(() => {
    let sql = "";

    // 테이블 생성 SQL
    nodes.forEach((node) => {
      sql += `-- ${node.data.logicalName} 테이블\n`;
      sql += `CREATE TABLE ${node.data.physicalName} (\n`;

      // 컬럼 정의
      const columnDefinitions = node.data.columns.map((column) => {
        let colDef = `  ${
          column.physicalName
        } ${column.dataType.toUpperCase()}`;

        // 데이터 타입 옵션 (길이, 정밀도 등)
        if (column.typeOptions) {
          if (column.dataType === "varchar" || column.dataType === "char") {
            colDef += `(${column.typeOptions.length || 255})`;
          } else if (column.dataType === "decimal") {
            colDef += `(${column.typeOptions.precision || 10}, ${
              column.typeOptions.scale || 2
            })`;
          }
        }

        // NOT NULL
        if (column.constraints.isNotNull) {
          colDef += " NOT NULL";
        }

        // 기본값
        if (column.constraints.defaultValue !== undefined) {
          if (typeof column.constraints.defaultValue === "string") {
            colDef += ` DEFAULT '${column.constraints.defaultValue}'`;
          } else {
            colDef += ` DEFAULT ${column.constraints.defaultValue}`;
          }
        }

        return colDef;
      });

      // 기본키 제약조건
      const primaryKeyColumns = node.data.columns
        .filter((column) => column.constraints.isPrimaryKey)
        .map((column) => column.physicalName);

      if (primaryKeyColumns.length > 0) {
        columnDefinitions.push(
          `  PRIMARY KEY (${primaryKeyColumns.join(", ")})`
        );
      }

      // UNIQUE 제약조건
      node.data.columns
        .filter(
          (column) =>
            column.constraints.isUnique && !column.constraints.isPrimaryKey
        )
        .forEach((column) => {
          columnDefinitions.push(`  UNIQUE (${column.physicalName})`);
        });

      // CHECK 제약조건
      node.data.columns
        .filter((column) => column.constraints.check)
        .forEach((column) => {
          columnDefinitions.push(`  CHECK (${column.constraints.check})`);
        });

      sql += columnDefinitions.join(",\n");
      sql += "\n);\n\n";
    });

    // 외래키 제약조건 (관계 기반)
    relationships.forEach((rel) => {
      if (rel.type === RelationshipType.MANY_TO_MANY) {
        return; // N:M 관계는 중간 테이블에 외래키가 정의됨
      }

      const sourceNode = nodes.find((node) => node.id === rel.sourceTableId);
      const targetNode = nodes.find((node) => node.id === rel.targetTableId);

      if (!sourceNode || !targetNode) return;

      const sourceColumns = rel.sourceColumnIds
        .map((colId) => {
          const column = sourceNode.data.columns.find(
            (col) => col.id === colId
          );
          return column?.physicalName || "";
        })
        .filter((name) => name);

      const targetColumns = rel.targetColumnIds
        .map((colId) => {
          const column = targetNode.data.columns.find(
            (col) => col.id === colId
          );
          return column?.physicalName || "";
        })
        .filter((name) => name);

      if (sourceColumns.length === 0 || targetColumns.length === 0) return;

      const constraintName = `FK_${targetNode.data.physicalName}_${sourceNode.data.physicalName}`;

      sql += `-- ${rel.name} 관계의 외래키\n`;
      sql += `ALTER TABLE ${targetNode.data.physicalName} ADD CONSTRAINT ${constraintName}\n`;
      sql += `  FOREIGN KEY (${targetColumns.join(", ")})\n`;
      sql += `  REFERENCES ${
        sourceNode.data.physicalName
      } (${sourceColumns.join(", ")})`;

      // ON DELETE, ON UPDATE 규칙
      if (rel.onDelete) {
        sql += `\n  ON DELETE ${rel.onDelete}`;
      }

      if (rel.onUpdate) {
        sql += `\n  ON UPDATE ${rel.onUpdate}`;
      }

      sql += ";\n\n";
    });

    return sql;
  }, [nodes, relationships]);

  const value: SchemaContextType = {
    nodes,
    edges,
    relationships,
    selectedColumnId,
    selectedRelationshipId,
    updateNode,
    addNode,
    removeNode,
    cloneNode,
    addColumn,
    removeColumn,
    updateRelationship,
    addRelationship,
    removeRelationship,
    updateEdges,
    addEdge,
    removeEdge,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    getSelectedNode,
    onColumnSelect,
    getSelectedColumn,
    onRelationshipSelect,
    getSelectedRelationship,
    updateColumnOrders,
    generateSqlDDL,
  };

  return (
    <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
  );
};

export const useSchema = () => {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error("useSchema must be used within a SchemaProvider");
  }
  return context;
};
