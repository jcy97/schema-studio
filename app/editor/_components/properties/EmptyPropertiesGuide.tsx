import React from "react";
import { CircleHelp, SmilePlus } from "lucide-react";
function EmptyPropertiesGuide() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="bg-blue-50 dark:bg-blue-950 p-8 rounded-xl border-2 border-dashed border-primary dark:border-primary-700">
        <div className="flex justify-center mb-4">
          <CircleHelp className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <h3 className="text-xl font-bold mb-2">선택된 스키마가 없네요! 👀</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          스미카를 선택하면 여기서 상세 정보를 확인하고 편집할 수 있어요.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
          <SmilePlus className="h-5 w-5" />
          <span>왼쪽 화면에서 스키마를 클릭해보세요!</span>
        </div>
      </div>
    </div>
  );
}

export default EmptyPropertiesGuide;
