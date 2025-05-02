import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import SchemaEditor from "./SchemaEditor";
import { SchemaProvider } from "@/contexts/SchemaContext";
import Properties from "./Properties";

function Editor() {
  return (
    <ReactFlowProvider>
      <SchemaProvider>
        <div className="flex h-full w-full overflow-hidden">
          <SchemaEditor />
          <Properties />
        </div>
      </SchemaProvider>
    </ReactFlowProvider>
  );
}

export default Editor;
