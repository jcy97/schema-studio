"use client";
import { initialNodes } from "@/sample";
import { AppNode } from "@/types/appNode";
import { Connection, Edge, useEdgesState, useNodesState } from "@xyflow/react";
import { createContext, useCallback, useContext, useState } from "react";

interface SchemaContextType {
  nodes: AppNode[];
  edges: Edge[];
  updateNode: (nodeId: string, data: Partial<AppNode["data"]>) => void;
  addNode: (node: AppNode) => void;
  removeNode: (nodeId: string) => void;
  updateEdges: (edges: Edge[]) => void;
  addEdge: (connection: Connection) => void;
  removeEdge: (edgeId: string) => void;
  onNodesChange: () => void;
  onEdgesChange: () => void;
  onNodeSelect: (nodeId: string) => void;
  getSelectedNode: () => AppNode;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export const SchemaProvider = ({ children }: { children: React.ReactNode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  const updateNode = (nodeId: string, data: Partial<AppNode>["data"]) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...data },
          };
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
  };

  const getSelectedNode = useCallback(() => {
    const selectedNode = nodes.find((node) => node.id === selectedNodeId);
    return selectedNode;
  }, [nodes, selectedNodeId]);

  const value: SchemaContextType = {
    nodes,
    edges,
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
  } as SchemaContextType;
  return (
    <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
  );
};

export const useSchema = () => {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error("useSchema must be used a SchemaProvider");
  }
  return context;
};
