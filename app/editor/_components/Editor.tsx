import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import SchemaEditor from "./SchemaEditor";
import { SchemaProvider } from "@/contexts/SchemaContext";

function Editor() {
  return (
    <ReactFlowProvider>
      <SchemaProvider>
        <div className="flex flex-col h-full w-full overflow-hidden">
          <SchemaEditor />
        </div>
      </SchemaProvider>
    </ReactFlowProvider>
  );
}

export default Editor;
