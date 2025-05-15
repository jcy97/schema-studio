import { Loader2 } from "lucide-react";
import React from "react";

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-foreground font-medium">로딩 중...</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
