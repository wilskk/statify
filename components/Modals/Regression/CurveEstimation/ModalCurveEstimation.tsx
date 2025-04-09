import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import { Variable, VariableType } from '@/types/Variable';
import { Chart, registerables } from 'chart.js';

// Import our custom tab components
import VariablesTab from './VariablesTab';
import ModelsTab from './ModelsTab';

Chart.register(...registerables);

interface ModalCurveEstimationProps {
  onClose: () => void;
}

const ModalCurveEstimation: React.FC<ModalCurveEstimationProps> = ({ onClose }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState("variables");

  // Variables state
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable[]>([]);
  const [selectedCaseLabels, setSelectedCaseLabels] = useState<Variable | null>(null);

  // Models state
  const [selectedModels, setSelectedModels] = useState<string[]>(['Linear']);
  const [includeConstant, setIncludeConstant] = useState<boolean>(true);
  const [plotModels, setPlotModels] = useState<boolean>(true);
  const [displayANOVA, setDisplayANOVA] = useState<boolean>(false);
  const [upperBound, setUpperBound] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const variables = useVariableStore((state) => state.variables);
  const data = useDataStore((state) => state.data);
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // Define numeric variable types
  const numericTypes: VariableType[] = ["NUMERIC", "COMMA", "DOT", "SCIENTIFIC"];

  useEffect(() => {
    // Load available variables, filtering out any already selected
    const allVarsFiltered = variables.filter(v => {
      if (!v.name) return false;

      const isDependent = selectedDependentVariable?.columnIndex === v.columnIndex;
      const isIndependent = selectedIndependentVariables.some(iv => iv.columnIndex === v.columnIndex);
      const isCaseLabel = selectedCaseLabels?.columnIndex === v.columnIndex;

      return !isDependent && !isIndependent && !isCaseLabel;
    });

    setAvailableVariables(allVarsFiltered);
  }, [variables, selectedDependentVariable, selectedIndependentVariables, selectedCaseLabels]);

  // Variables Tab handlers
  const handleDependentDoubleClick = (variable: Variable) => {
    if (selectedDependentVariable) {
      // Move current dependent back to available
      setAvailableVariables(prev => [...prev, selectedDependentVariable]);
    }
    setSelectedDependentVariable(variable);
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setHighlightedVariable(null);
  };

  const handleIndependentDoubleClick = (variable: Variable) => {
    setSelectedIndependentVariables(prev => [...prev, variable]);
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setHighlightedVariable(null);
  };

  const handleCaseLabelsDoubleClick = (variable: Variable) => {
    if (selectedCaseLabels) {
      // Move current case label back to available
      setAvailableVariables(prev => [...prev, selectedCaseLabels]);
    }
    setSelectedCaseLabels(variable);
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setHighlightedVariable(null);
  };

  const moveToDependent = () => {
    if (!highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) {
      handleDependentDoubleClick(variable);
    }
  };

  const moveToIndependent = () => {
    if (!highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) {
      handleIndependentDoubleClick(variable);
    }
  };

  const moveToCaseLabels = () => {
    if (!highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) {
      handleCaseLabelsDoubleClick(variable);
    }
  };

  const removeDependent = () => {
    if (selectedDependentVariable) {
      setAvailableVariables(prev => [...prev, selectedDependentVariable]);
      setSelectedDependentVariable(null);
    }
  };

  const removeIndependent = (variable: Variable) => {
    setSelectedIndependentVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setAvailableVariables(prev => [...prev, variable]);
  };

  const removeCaseLabels = () => {
    if (selectedCaseLabels) {
      setAvailableVariables(prev => [...prev, selectedCaseLabels]);
      setSelectedCaseLabels(null);
    }
  };

  // Models Tab handlers
  const handleModelChange = (model: string) => {
    setSelectedModels((prev) =>
        prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // General handlers
  const handleClose = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    onClose();
  };

  const handleReset = () => {
    // Move all selected variables back to available variables
    if (selectedDependentVariable) {
      setAvailableVariables(prev => [...prev, selectedDependentVariable]);
    }

    if (selectedIndependentVariables.length > 0) {
      setAvailableVariables(prev => [...prev, ...selectedIndependentVariables]);
    }

    if (selectedCaseLabels) {
      setAvailableVariables(prev => [...prev, selectedCaseLabels]);
    }

    setSelectedDependentVariable(null);
    setSelectedIndependentVariables([]);
    setSelectedCaseLabels(null);
    setHighlightedVariable(null);
    setSelectedModels(['Linear']);
    setIncludeConstant(true);
    setPlotModels(true);
    setDisplayANOVA(false);
    setUpperBound('');
    setErrorMessage(null);
  };

  const handleRunRegression = async () => {
    if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
      setErrorMessage("Please select a dependent variable and at least one independent variable.");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const depCol = selectedDependentVariable.columnIndex;
      const indepCols = selectedIndependentVariables.map(iv => iv.columnIndex);

      // Extract and filter data for the regression
      const validRows = data.filter(row =>
          depCol < row.length &&
          indepCols.every(col => col < row.length) &&
          !isNaN(Number(row[depCol])) &&
          indepCols.every(col => !isNaN(Number(row[col])))
      );

      if (validRows.length === 0) {
        setErrorMessage("No valid data rows found for regression analysis.");
        setIsProcessing(false);
        return;
      }

      const Y = validRows.map(row => Number(row[depCol]));
      const X = validRows.map(row => Number(row[indepCols[0]])); // Using first independent variable for now

      const dependentVarName = selectedDependentVariable.name;
      const independentVarNames = selectedIndependentVariables.map(iv => iv.name);
      const method = selectedModels.join(', ');

      const logMessage = `REGRESSION 
/MISSING LISTWISE 
/STATISTICS COEFF OUTS R ANOVA 
/CRITERIA=PIN(.05) POUT(.10) 
${includeConstant ? '/NOORIGIN' : '/ORIGIN'} 
/DEPENDENT ${dependentVarName} 
/METHOD=${method.toUpperCase()} ${independentVarNames.join(' ')}.`;

      const log = { log: logMessage };
      const logId = await addLog(log);
      console.log("[CurveEstimation] Log created with ID:", logId);

      const analytic = {
        title: "Curve Estimation",
        note: "",
      };
      const analyticId = await addAnalytic(logId, analytic);
      console.log("[CurveEstimation] Analytic created with ID:", analyticId);

      if (workerRef.current) {
        workerRef.current.terminate();
      }

      workerRef.current = new Worker('/workers/CurveEstimation/curve_estimation.js');

      workerRef.current.onmessage = async (event) => {
        const { action, data } = event.data;

        if (action === 'regressionResults') {
          console.log("[CurveEstimation] Received regression results:", data);

          if (data.success) {
            const regressionSummaryStat = {
              title: "Curve Estimation",
              output_data: JSON.stringify(data.result),
              components: "CurveEstimationSummary",
              description: `Curve estimation for ${dependentVarName} using ${selectedModels.join(', ')} models`
            };

            try {
              await addStatistic(analyticId, regressionSummaryStat);
              console.log("[CurveEstimation] Statistics saved successfully");
              onClose();
            } catch (error) {
              console.error("[CurveEstimation] Failed to save statistics:", error);
              setErrorMessage("Failed to save regression results.");
            }
          } else {
            console.error("[CurveEstimation] Worker returned an error:", data.message);
            setErrorMessage(data.message || "An error occurred during regression analysis.");
          }

          setIsProcessing(false);
        } else if (action === 'error') {
          console.error("[CurveEstimation] Worker error:", data.message);
          setErrorMessage(data.message || "An error occurred during calculation.");
          setIsProcessing(false);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error("[CurveEstimation] Worker error:", error.message);
        setErrorMessage(`Worker error: ${error.message}`);
        setIsProcessing(false);

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };

      workerRef.current.postMessage({
        action: 'runRegression',
        data: {
          models: selectedModels,
          includeConstant,
          X,
          Y,
          dependentName: dependentVarName,
          independentNames: independentVarNames,
          upperBound: selectedModels.includes('Logistic') && upperBound ? parseFloat(upperBound) : undefined,
          displayANOVA
        }
      });

    } catch (error: unknown) {
      console.error("[CurveEstimation] Error in regression processing:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(`Error: ${errorMsg}`);
      setIsProcessing(false);
    }
  };

  return (
      <DialogContent className="max-w-[700px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
          <DialogTitle className="text-[22px] font-semibold">Curve Estimation</DialogTitle>
        </DialogHeader>

        {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mx-6 mt-2 rounded">
              {errorMessage}
            </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
          <div className="border-b border-[#E6E6E6] flex-shrink-0">
            <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
              <TabsTrigger
                  value="variables"
                  className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
              >
                Variables
              </TabsTrigger>
              <TabsTrigger
                  value="models"
                  className={`px-4 h-8 rounded-none text-sm ${activeTab === 'models' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
              >
                Models
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Variables Tab Content */}
          <TabsContent value="variables" className="overflow-y-auto flex-grow p-6">
            <VariablesTab
                availableVariables={availableVariables}
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                selectedDependentVariable={selectedDependentVariable}
                selectedIndependentVariables={selectedIndependentVariables}
                selectedCaseLabels={selectedCaseLabels}
                handleDependentDoubleClick={handleDependentDoubleClick}
                handleIndependentDoubleClick={handleIndependentDoubleClick}
                handleCaseLabelsDoubleClick={handleCaseLabelsDoubleClick}
                moveToDependent={moveToDependent}
                moveToIndependent={moveToIndependent}
                moveToCaseLabels={moveToCaseLabels}
                removeDependent={removeDependent}
                removeIndependent={removeIndependent}
                removeCaseLabels={removeCaseLabels}
                isProcessing={isProcessing}
            />
          </TabsContent>

          {/* Models Tab Content */}
          <TabsContent value="models" className="overflow-y-auto flex-grow">
            <ModelsTab
                selectedModels={selectedModels}
                handleModelChange={handleModelChange}
                includeConstant={includeConstant}
                setIncludeConstant={setIncludeConstant}
                plotModels={plotModels}
                setPlotModels={setPlotModels}
                displayANOVA={displayANOVA}
                setDisplayANOVA={setDisplayANOVA}
                upperBound={upperBound}
                setUpperBound={setUpperBound}
                isProcessing={isProcessing}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <Button
                className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                onClick={handleRunRegression}
                disabled={isProcessing}
            >
              {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
              ) : (
                  "OK"
              )}
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                disabled={isProcessing}
            >
              Paste
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                onClick={handleReset}
                disabled={isProcessing}
            >
              Reset
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                onClick={handleClose}
                disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                disabled={isProcessing}
            >
              Help
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
  );
};

export default ModalCurveEstimation;