import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FunctionsListProps {
  onFunctionSelect: (func: string) => void;
}

export const FunctionsList: React.FC<FunctionsListProps> = ({
  onFunctionSelect,
}) => {
  const [selectedGroup, setSelectedGroup] = useState("All");

  const functionGroups = {
    Arithmetic: ["abs", "exp", "ln", "log10", "mod", "sqrt", "trunc"],
    Statistical: [
      "mean",
      "median",
      "mode",
      "sd",
      "variance",
      "sum",
      "min",
      "max",
    ],
    String: ["concat", "length", "lower", "upper", "substr", "trim"],
    "Date & Time": [
      "date",
      "time",
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
    ],
    Logical: ["and", "or", "not", "if", "then", "else"],
    Conversion: ["toNumber", "toString", "toDate"],
    "CDF & Noncentral CDF": ["cdf.normal", "cdf.t", "cdf.chisq", "cdf.f"],
    "Random Variables": ["rv.uniform", "rv.normal", "rv.bernoulli"],
  };

  const renderFunctions = () => {
    if (selectedGroup === "All") {
      return Object.entries(functionGroups).map(([group, functions]) => (
        <div key={group} className="mb-3">
          <div className="font-medium text-xs text-gray-700 mb-1">{group}</div>
          <div className="space-y-1">
            {functions.map((func) => (
              <div
                key={func}
                className="pl-2 py-1 text-xs hover:bg-blue-100 cursor-pointer rounded"
                onClick={() => onFunctionSelect(`${func}(`)}
              >
                {func}
              </div>
            ))}
          </div>
        </div>
      ));
    }

    const functions =
      functionGroups[selectedGroup as keyof typeof functionGroups] || [];
    return (
      <div className="space-y-1">
        {functions.map((func) => (
          <div
            key={func}
            className="py-1 px-2 text-xs hover:bg-blue-100 cursor-pointer rounded"
            onClick={() => onFunctionSelect(`${func}(`)}
          >
            {func}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
        <SelectTrigger className="w-full bg-white text-xs">
          <SelectValue placeholder="Select a function group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All" className="text-xs">
            All
          </SelectItem>
          {Object.keys(functionGroups).map((group) => (
            <SelectItem key={group} value={group} className="text-xs">
              {group}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-2 border rounded bg-white h-[250px] md:h-[300px] lg:h-[350px]">
        <ScrollArea className="h-full p-2">{renderFunctions()}</ScrollArea>
      </div>
    </div>
  );
};
