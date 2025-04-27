import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import SchemaEditor from "./SchemaEditor";

function Editor() {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <SchemaEditor />
      </div>
    </ReactFlowProvider>
  );
}

export default Editor;
