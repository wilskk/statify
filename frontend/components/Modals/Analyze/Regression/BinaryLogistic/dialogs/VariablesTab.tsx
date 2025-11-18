import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Ruler, Shapes, BarChartHorizontal } from "lucide-react";
import type { Variable } from "@/types/Variable";
import { BinaryLogisticOptions } from "../types/binary-logistic";

interface VariablesTabProps {
  availableVariables: Variable[];
  selectedDependent: Variable | null;
  selectedCovariates: Variable[];
  selectedFactors: Variable[]; // [FIX] Tambahkan ini
  highlightedVariable: Variable | null;
  setHighlightedVariable: (v: Variable | null) => void;

  // Handlers
  onMoveToDependent: () => void;
  onMoveToCovariates: () => void;
  onMoveToFactors: () => void; // [FIX] Tambahkan ini
  onRemoveDependent: () => void;
  onRemoveCovariate: (v: Variable) => void;
  onRemoveFactor: (v: Variable) => void; // [FIX] Tambahkan ini

  // Method
  method: BinaryLogisticOptions["method"];
  onMethodChange: (val: BinaryLogisticOptions["method"]) => void;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({
  availableVariables,
  selectedDependent,
  selectedCovariates,
  selectedFactors,
  highlightedVariable,
  setHighlightedVariable,
  onMoveToDependent,
  onMoveToCovariates,
  onMoveToFactors,
  onRemoveDependent,
  onRemoveCovariate,
  onRemoveFactor,
  method,
  onMethodChange,
}) => {
  const getVariableIcon = (variable: Variable) => {
    switch (variable.measure) {
      case "scale":
        return (
          <Ruler
            size={14}
            className="text-muted-foreground mr-1.5 flex-shrink-0"
          />
        );
      case "nominal":
        return (
          <Shapes
            size={14}
            className="text-muted-foreground mr-1.5 flex-shrink-0"
          />
        );
      case "ordinal":
        return (
          <BarChartHorizontal
            size={14}
            className="text-muted-foreground mr-1.5 flex-shrink-0"
          />
        );
      default:
        return (
          <Shapes
            size={14}
            className="text-muted-foreground mr-1.5 flex-shrink-0"
          />
        );
    }
  };

  const getDisplayName = (variable: Variable) =>
    variable.label || variable.name;

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-6 py-4 flex-grow min-h-0">
        {/* KOLOM KIRI: Available Variables */}
        <div className="col-span-1 flex flex-col h-full min-h-0">
          <label className="font-semibold block mb-2 text-sm">Variables:</label>
          <div className="border border-border rounded-md flex-1 bg-background overflow-hidden">
            <ScrollArea className="h-full p-2">
              {availableVariables.map((variable) => (
                <div
                  key={variable.id}
                  className={`flex items-center p-1.5 mb-1 cursor-pointer border rounded-md text-sm transition-colors ${
                    highlightedVariable?.name === variable.name
                      ? "bg-accent text-accent-foreground border-primary/50"
                      : "border-transparent hover:bg-accent/50"
                  }`}
                  onClick={() =>
                    setHighlightedVariable(
                      variable.name === highlightedVariable?.name
                        ? null
                        : variable
                    )
                  }
                >
                  {getVariableIcon(variable)}
                  <span className="truncate">{getDisplayName(variable)}</span>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* KOLOM KANAN: Target Boxes */}
        <div className="col-span-1 flex flex-col gap-4 min-h-0 h-full overflow-y-auto pr-2">
          {/* Dependent Variable */}
          <div className="flex items-start gap-2">
            <Button
              variant="outline"
              size="icon"
              className="mt-6 shrink-0 h-8 w-8"
              onClick={onMoveToDependent}
              disabled={!highlightedVariable || !!selectedDependent}
            >
              <ChevronRight size={16} />
            </Button>
            <div className="flex-1">
              <label className="font-semibold block mb-2 text-sm">
                Dependent:
              </label>
              <div
                className="border border-border rounded-md min-h-[40px] p-2 bg-background cursor-pointer hover:border-destructive/50 transition-colors"
                onClick={onRemoveDependent}
                title="Click to remove"
              >
                {selectedDependent ? (
                  <div className="flex items-center text-sm">
                    {getVariableIcon(selectedDependent)}
                    <span className="truncate">
                      {getDisplayName(selectedDependent)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Select variable...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Covariates (Block 1 of 1) */}
          <div className="flex items-start gap-2">
            <Button
              variant="outline"
              size="icon"
              className="mt-6 shrink-0 h-8 w-8"
              onClick={onMoveToCovariates}
              disabled={!highlightedVariable}
            >
              <ChevronRight size={16} />
            </Button>
            <div className="flex-1 flex flex-col">
              <label className="font-semibold block mb-2 text-sm">
                Covariates:
              </label>
              <div className="border border-border rounded-md h-[120px] bg-background overflow-hidden">
                <ScrollArea className="h-full p-2">
                  {selectedCovariates.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center p-1.5 mb-1 rounded-md cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent text-sm transition-colors"
                      onClick={() => onRemoveCovariate(v)}
                      title="Click to remove"
                    >
                      {getVariableIcon(v)}
                      <span className="truncate">{getDisplayName(v)}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Categorical Covariates (Factors) */}
          <div className="flex items-start gap-2">
            <Button
              variant="outline"
              size="icon"
              className="mt-6 shrink-0 h-8 w-8"
              onClick={onMoveToFactors}
              disabled={!highlightedVariable}
            >
              <ChevronRight size={16} />
            </Button>
            <div className="flex-1 flex flex-col">
              <label className="font-semibold block mb-2 text-sm">
                Categorical Covariates:
              </label>
              <div className="border border-border rounded-md h-[120px] bg-background overflow-hidden">
                <ScrollArea className="h-full p-2">
                  {selectedFactors.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center p-1.5 mb-1 rounded-md cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent text-sm transition-colors"
                      onClick={() => onRemoveFactor(v)}
                      title="Click to remove"
                    >
                      {getVariableIcon(v)}
                      <span className="truncate">{getDisplayName(v)}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Method Selector */}
      <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-border/50 flex-shrink-0 mb-2">
        <label htmlFor="method-select" className="text-sm font-medium">
          Method:
        </label>
        <select
          id="method-select"
          className="h-8 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={method}
          onChange={(e) =>
            onMethodChange(e.target.value as BinaryLogisticOptions["method"])
          }
          aria-label="Select Regression Method"
          title="Regression Method"
        >
          <option value="Enter">Enter</option>
          <optgroup label="Forward Stepwise">
            <option value="Forward: Conditional">Forward: Conditional</option>
            <option value="Forward: LR">Forward: LR</option>
            <option value="Forward: Wald">Forward: Wald</option>
          </optgroup>
          <optgroup label="Backward Stepwise">
            <option value="Backward: Conditional">Backward: Conditional</option>
            <option value="Backward: LR">Backward: LR</option>
            <option value="Backward: Wald">Backward: Wald</option>
          </optgroup>
        </select>
      </div>
    </div>
  );
};
