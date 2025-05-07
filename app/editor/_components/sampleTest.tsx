import { ReactFlow } from "@xyflow/react";

export default function SimpleTest() {
  const initialNodes = [
    { id: "node-1", position: { x: 100, y: 100 }, data: { label: "노드1" } },
    { id: "node-2", position: { x: 300, y: 100 }, data: { label: "노드2" } },
  ];

  const initialEdges = [{ id: "edge-1", source: "node-1", target: "node-2" }];

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} />
    </div>
  );
}
