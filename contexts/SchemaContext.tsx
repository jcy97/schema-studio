"use client";
import { initialNodes } from "@/sample";
import { AppNode, Column } from "@/types/appNode";
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
  selectedColumnId: string | null;
  updateNode: (nodeId: string, data: Partial<AppNode["data"]>) => void;
  addNode: (node: AppNode) => void;
  removeNode: (nodeId: string) => void;
  updateEdges: (edges: Edge[]) => void;
  addEdge: (connection: Connection) => void;
  removeEdge: (edgeId: string) => void;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onNodeSelect: (nodeId: string) => void;
  getSelectedNode: () => AppNode | undefined;
  onColumnSelect: (columnId: string) => void;
  getSelectedColumn: () => Column | null;
  updateColumnOrders: (nodeId: string, updateColumns: Column[]) => void;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export const SchemaProvider = ({ children }: { children: React.ReactNode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

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

  const addNode = (node: AppNode) => {
    setNodes((nds) => [...nds, node]);
  };

  const removeNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  };

  const updateEdges = (newEdges: Edge[]) => {
    setEdges(newEdges);
  };

  const addEdge = (connection: Connection) => {
    const newEdge: Edge = {
      id: `e-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };
    setEdges((eds) => [...eds, newEdge]);
  };

  const removeEdge = (edgeId: string) => {
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

  const value: SchemaContextType = {
    nodes,
    edges,
    selectedColumnId,
    updateNode,
    addNode,
    removeNode,
    updateEdges,
    addEdge,
    removeEdge,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    getSelectedNode,
    onColumnSelect,
    getSelectedColumn,
    updateColumnOrders,
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
