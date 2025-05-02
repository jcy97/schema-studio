import React, { useState, ChangeEvent } from "react";

type PropertyInputProps = {
  title: string;
  value: string | number;
  type?: "text" | "number";
  onChange: (value: string | number) => void;
};

function PropertyInput({
  title,
  value,
  type = "text",
  onChange,
}: PropertyInputProps) {
  // 숫자형 인풋 처리
  const handleIncrement = (): void => {
    if (type === "number") {
      onChange(Number(value) + 1);
    }
  };

  const handleDecrement = (): void => {
    if (type === "number") {
      onChange(Number(value) - 1);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newValue =
      type === "number" ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className="flex items-center mb-2">
      <div className="w-24 text-sm font-medium text-gray-700">{title}:</div>

      {type === "text" ? (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : type === "number" ? (
        <div className="flex-1 flex items-center">
          <input
            type="number"
            value={value}
            onChange={handleChange}
            className="flex-1 px-2 py-1 border border-gray-300 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex flex-col border border-l-0 border-gray-300 rounded-r overflow-hidden">
            <button
              onClick={handleIncrement}
              className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 border-b border-gray-300"
            >
              ▲
            </button>
            <button
              onClick={handleDecrement}
              className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200"
            >
              ▼
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Define property types for the example usage
interface PropertyValues {
  name: string;
  width: number;
  height: number;
  color: string;
}

// Usage example component
function PropertyEditor() {
  const [properties, setProperties] = useState<PropertyValues>({
    name: "상자",
    width: 100,
    height: 100,
    color: "#FF5733",
  });

  const handlePropertyChange = <K extends keyof PropertyValues>(
    property: K,
    value: PropertyValues[K]
  ): void => {
    setProperties({
      ...properties,
      [property]: value,
    });
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-white w-64">
      <h3 className="text-lg font-medium mb-4">속성</h3>

      <PropertyInput
        title="이름"
        type="text"
        value={properties.name}
        onChange={(value) => handlePropertyChange("name", value as string)}
      />

      <PropertyInput
        title="너비"
        type="number"
        value={properties.width}
        onChange={(value) => handlePropertyChange("width", value as number)}
      />

      <PropertyInput
        title="높이"
        type="number"
        value={properties.height}
        onChange={(value) => handlePropertyChange("height", value as number)}
      />

      <PropertyInput
        title="색상"
        type="text"
        value={properties.color}
        onChange={(value) => handlePropertyChange("color", value as string)}
      />
    </div>
  );
}

export default PropertyInput;
