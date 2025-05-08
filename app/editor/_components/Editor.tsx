import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import SchemaEditor from "./SchemaEditor";
import { SchemaProvider } from "@/contexts/SchemaContext";
import Properties from "./Properties";
import Topbar from "./topbar/Topbar";

function Editor() {
  return (
    <ReactFlowProvider>
      <SchemaProvider>
        <div className="flex flex-col h-full w-full overflow-hidden">
          <div className="flex h-full w-full overflow-hidden">
            <SchemaEditor />
            <div className="w-80 border-l border-gray-200 shadow-sm bg-gray-50">
              <Properties />
            </div>
          </div>
          <div className="border-t border-gray-200 shadow-sm">
            <Topbar />
          </div>
        </div>
      </SchemaProvider>
    </ReactFlowProvider>
  );
}

export default Editor;
