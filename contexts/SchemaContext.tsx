"use client";
import { DataTypes } from "@/constants/datatype";
import { SQLGenerationOptions } from "@/lib/dbms";
import { generateDDLForSelectedNodes } from "@/lib/ddlGenerator";
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
  NodeRemoveChange,
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

  onRelationshipSelect: (relationshipId: string) => void;
  getSelectedRelationship: () => Relationship | null;

  updateColumnOrders: (nodeId: string, updateColumns: Column[]) => void;

  generateSqlDDLForSelectedNodes: (
    selectedNodeIds: string[],
    options: SQLGenerationOptions
  ) => string;

  resetSchemaData: () => void;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export const SchemaProvider = ({ children }: { children: React.ReactNode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<
    string | null
  >(null);

  const initializedRef = useRef(false);

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

  useEffect(() => {
    synchronizeEdgesWithRelationships();
  }, [relationships]);

  const synchronizeEdgesWithRelationships = useCallback(() => {
    const relationshipEdges = relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceTableId,
      target: rel.targetTableId,
      sourceHandle: rel.sourceHandle || null,
      targetHandle: rel.targetHandle || null,
      type: "deletableEdge",
      data: { relationship: rel },
    }));

    setEdges(relationshipEdges);
  }, [relationships, setEdges]);

  const updateNode = (nodeId: string, data: Partial<AppNode["data"]>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const newNode = {
            ...node,
            data: { ...node.data, ...data },
          };
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

    const clonedColumns = originNode.data.columns
      .filter((column) => !column.constraints.foreignKey)
      .map((column) => {
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
    setRelationships((rels) =>
      rels.filter((rel) => {
        const isSourceColumn = rel.sourceColumnIds.includes(columnId);
        const isTargetColumn = rel.targetColumnIds.includes(columnId);

        const isJunctionSourceColumn =
          rel.junctionTable?.sourceColumnIds.includes(columnId);
        const isJunctionTargetColumn =
          rel.junctionTable?.targetColumnIds.includes(columnId);

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
    let newRelationshipId =
      customRelationship?.id ||
      `rel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (customRelationship?.id) {
      const idExists = relationships.some(
        (rel) => rel.id === customRelationship.id
      );
      if (idExists) {
        newRelationshipId = `rel-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      }
    }

    if (customRelationship) {
      setRelationships((rels) => [
        ...rels,
        { ...customRelationship, id: newRelationshipId },
      ]);
    } else {
      const sourceNodeId =
        selectedNodeId || (nodes.length > 0 ? nodes[0].id : "");

      if (!sourceNodeId) {
        console.error("관계 생성을 위한 소스 노드가 없습니다.");
        return newRelationshipId;
      }

      const targetNodeId =
        nodes.find((node) => node.id !== sourceNodeId)?.id || "";

      if (!targetNodeId) {
        console.error("관계 생성을 위한 타겟 노드가 없습니다.");
        return newRelationshipId;
      }

      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      const sourceColumn =
        sourceNode?.data.columns.find((col) => col.constraints.isPrimaryKey) ||
        sourceNode?.data.columns[0];

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
        type: RelationshipType.ONE_TO_MANY,
        sourceTableId: sourceNodeId,
        sourceColumnIds: [sourceColumn.id],
        targetTableId: targetNodeId,
        targetColumnIds: [targetColumn.id],
        onDelete: "CASCADE",
        description: `${sourceNode?.data.logicalName}과(와) ${targetNode?.data.logicalName} 간의 관계`,
      };

      setRelationships((rels) => [...rels, newRelationship]);
      setSelectedRelationshipId(newRelationshipId);
    }

    return newRelationshipId;
  };

  const removeRelationship = (relationshipId: string) => {
    setRelationships((rels) => rels.filter((rel) => rel.id !== relationshipId));

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
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) {
      console.error("엣지 생성 실패: 노드를 찾을 수 없습니다.");
      return;
    }

    console.log(
      `관계 생성: ${sourceNode.data.logicalName}(부모) → ${targetNode.data.logicalName}(자식)`
    );

    // sourceNode가 부모(1), targetNode가 자식(N)
    const parentColumn =
      sourceNode.data.columns.find((col) => col.constraints.isPrimaryKey) ||
      sourceNode.data.columns[0];

    let childColumnId = "";

    const existingFkColumn = targetNode.data.columns.find(
      (col) => col.constraints.foreignKey?.tableId === sourceNode.id
    );

    if (existingFkColumn) {
      childColumnId = existingFkColumn.id;
    } else {
      // 자식 테이블(target)에 FK 컬럼 추가
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
        dataType: parentColumn.dataType,
        order: targetNode.data.columns.length,
        constraints: {
          isNotNull: true,
          foreignKey: {
            tableId: sourceNode.id,
            columnId: parentColumn.id,
          },
        },
      };

      updateNode(targetNode.id, {
        columns: [...targetNode.data.columns, newFkColumn],
      });

      childColumnId = newColumnId;
    }

    const relationshipId = `rel-${Date.now()}`;
    const newRelationship: Relationship = {
      id: relationshipId,
      name: `${sourceNode.data.logicalName}-${targetNode.data.logicalName}`,
      type: RelationshipType.ONE_TO_MANY, // source(부모):target(자식) = 1:N
      sourceTableId: sourceNode.id, // 부모 테이블
      sourceColumnIds: [parentColumn.id], // 부모 테이블의 PK
      targetTableId: targetNode.id, // 자식 테이블
      targetColumnIds: [childColumnId], // 자식 테이블의 FK
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      onDelete: "CASCADE",
      description: `${sourceNode.data.logicalName}(부모)과 ${targetNode.data.logicalName}(자식) 간의 1:N 관계`,
    };

    setRelationships((rels) => [...rels, newRelationship]);
  };

  const removeEdge = (edgeId: string) => {
    const directRelationship = relationships.find((rel) => rel.id === edgeId);

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

    const selectedNode = nodes.find((node) => node.id === nodeId);
    const currentSelectedColumn = getSelectedColumn();

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

  const generateSqlDDLForSelectedNodes = useCallback(
    (selectedNodeIds: string[], options: SQLGenerationOptions) => {
      return generateDDLForSelectedNodes(
        selectedNodeIds,
        nodes,
        relationships,
        options
      );
    },
    [nodes, relationships]
  );

  const resetSchemaData = () => {
    try {
      if (nodes && nodes.length > 0) {
        const removeChanges: NodeRemoveChange[] = nodes.map((node) => ({
          type: "remove",
          id: node.id,
        }));
        onNodesChange(removeChanges);
      }

      setRelationships([]);
      setEdges([]);
    } catch (error) {
      console.error("스키마 데이터 초기화 오류:", error);
    }
  };

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
    generateSqlDDLForSelectedNodes,
    resetSchemaData,
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
