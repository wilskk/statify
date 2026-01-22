import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Ruler, Shapes, BarChartHorizontal } from "lucide-react";
import { Variable } from "@/types/Variable";
import { OrdinalOptions } from "../types/ordinal";

interface Props {
  availableVariables: Variable[]; 
  selectedDependent: Variable | null;
  selectedFactors: Variable[];
  selectedCovariates: Variable[];
  onOptionsChange: (options: OrdinalOptions) => void;
}

export const VariablesTab: React.FC<Props> = ({
  availableVariables,
  selectedDependent,
  selectedFactors,
  selectedCovariates,
  onOptionsChange,
}) => {
  const [highlightedVariable, setHighlightedVariable] = useState<Variable | null>(null);

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

  const moveToDependent = () => {
    if (highlightedVariable) {
      // dependent is a single variable; remove it from other lists if present
      const newFactors = selectedFactors.filter((v) => v.name !== highlightedVariable.name);
      const newCovariates = selectedCovariates.filter((v) => v.name !== highlightedVariable.name);
      onOptionsChange({ dependent: highlightedVariable, factors: newFactors, covariates: newCovariates });
      setHighlightedVariable(null);
    }
  };

  const moveToFactors = () => {
    if (highlightedVariable) {
      // add to factors, ensure not duplicated and remove from dependent/covariates
      const newFactors = [...selectedFactors.filter((v) => v.name !== highlightedVariable.name), highlightedVariable];
      const newCovariates = selectedCovariates.filter((v) => v.name !== highlightedVariable.name);
      const newDependent = selectedDependent && selectedDependent.name === highlightedVariable.name ? null : selectedDependent;
      onOptionsChange({ dependent: newDependent, factors: newFactors, covariates: newCovariates });
      setHighlightedVariable(null);
    }
  };

  const moveToCovariates = () => {
    if (highlightedVariable) {
      // add to covariates, ensure not duplicated and remove from dependent/factors
      const newCovariates = [...selectedCovariates.filter((v) => v.name !== highlightedVariable.name), highlightedVariable];
      const newFactors = selectedFactors.filter((v) => v.name !== highlightedVariable.name);
      const newDependent = selectedDependent && selectedDependent.name === highlightedVariable.name ? null : selectedDependent;
      onOptionsChange({ dependent: newDependent, factors: newFactors, covariates: newCovariates });
      setHighlightedVariable(null);
    }
  };

  const removeDependent = () => onOptionsChange({ dependent: null, factors: selectedFactors, covariates: selectedCovariates });
  const removeFactor = (v: Variable) => {
    const newFactors = selectedFactors.filter(f => f.id !== v.id);
    onOptionsChange({ dependent: selectedDependent, factors: newFactors, covariates: selectedCovariates });
  };
  const removeCovariate = (v: Variable) => {
    const newCovariates = selectedCovariates.filter(c => c.id !== v.id);
    onOptionsChange({ dependent: selectedDependent, factors: selectedFactors, covariates: newCovariates });
  };

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
              onClick={moveToDependent}
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
                onClick={removeDependent}
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

          {/* Covariates */}
          <div className="flex items-start gap-2">
            <Button
              variant="outline"
              size="icon"
              className="mt-6 shrink-0 h-8 w-8"
              onClick={moveToCovariates}
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
                      onClick={() => removeCovariate(v)}
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

          {/* Factors */}
          <div className="flex items-start gap-2">
            <Button
              variant="outline"
              size="icon"
              className="mt-6 shrink-0 h-8 w-8"
              onClick={moveToFactors}
              disabled={!highlightedVariable}
            >
              <ChevronRight size={16} />
            </Button>
            <div className="flex-1 flex flex-col">
              <label className="font-semibold block mb-2 text-sm">
                Factor(s):
              </label>
              <div className="border border-border rounded-md h-[120px] bg-background overflow-hidden">
                <ScrollArea className="h-full p-2">
                  {selectedFactors.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center p-1.5 mb-1 rounded-md cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent text-sm transition-colors"
                      onClick={() => removeFactor(v)}
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

      {/* FOOTER: Link Function Selector */}
      <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-border/50 flex-shrink-0 mb-2">
        <label htmlFor="link-function-select" className="text-sm font-medium">
          Link Function:
        </label>
        <select
          id="link-function-select"
          className="h-8 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue="Logit"
          aria-label="Select Link Function"
          title="Link Function"
        >
          <option value="Logit">Logit</option>
          <option value="Probit">Probit</option>
          <option value="Complementary Log-Log">Complementary Log-Log</option>
          <option value="Cauchit">Cauchit</option>
        </select>
      </div>
    </div>
  );
};