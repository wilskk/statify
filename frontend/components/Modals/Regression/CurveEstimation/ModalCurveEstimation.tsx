// components/Modals/CurveEstimation/ModalCurveEstimation.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useResultStore } from '@/stores/useResultStore';
import { Variable, VariableType } from '@/types/Variable';
import { Chart, registerables } from 'chart.js';

// Import our custom tab components (menggunakan struktur baru)
import VariablesTab from './VariablesTab';
import ModelsTab from './ModelsTab';

Chart.register(...registerables);

// Updated to match OpenSavFile pattern
export interface ModalCurveEstimationProps {
  onClose: () => void;
  containerType?: string;
}

// Using named export like OpenSavFile
export const ModalCurveEstimation: React.FC<ModalCurveEstimationProps> = ({ onClose, containerType }) => {
  // State variables dari desain baru
  const [activeTab, setActiveTab] = useState("variables");
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable[]>([]);
  const [selectedCaseLabels, setSelectedCaseLabels] = useState<Variable | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>(['Linear']);
  const [includeConstant, setIncludeConstant] = useState<boolean>(true); // State ini ada, tapi tidak dikirim ke worker oleh handleRunRegression versi lama
  const [plotModels, setPlotModels] = useState<boolean>(true);
  const [displayANOVA, setDisplayANOVA] = useState<boolean>(false); // State ini ada, tapi tidak dikirim ke worker oleh handleRunRegression versi lama
  const [upperBound, setUpperBound] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "", description: "" });
  const [inlineAlertMessage, setInlineAlertMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const variables = useVariableStore((state) => state.variables);
  const { data } = useAnalysisData();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // useEffect untuk memfilter availableVariables (dari kode baru)
  useEffect(() => {
    const allVarsFiltered = variables.filter(v => {
      if (!v.name) return false;
      const isDependent = selectedDependentVariable?.columnIndex === v.columnIndex;
      const isIndependent = selectedIndependentVariables.some(iv => iv.columnIndex === v.columnIndex);
      const isCaseLabel = selectedCaseLabels?.columnIndex === v.columnIndex;
      return !isDependent && !isIndependent && !isCaseLabel;
    });
    setAvailableVariables(allVarsFiltered);
  }, [variables, selectedDependentVariable, selectedIndependentVariables, selectedCaseLabels]);

  const showAlert = (title: string, description: string) => {
    if (containerType === "sidebar") {
        setInlineAlertMessage(`${title}: ${description}`);
    } else {
        setAlertMessage({ title, description });
        setAlertOpen(true);
    }
  };

  // Handlers untuk VariablesTab (dari kode baru)
  const handleDependentDoubleClick = (variable: Variable) => {
    if (selectedDependentVariable) {
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
      setAvailableVariables(prev => [...prev, selectedCaseLabels]);
    }
    setSelectedCaseLabels(variable);
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setHighlightedVariable(null);
  };

  const moveToDependent = () => {
    if (!highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) handleDependentDoubleClick(variable);
  };

  const moveToIndependent = () => {
    if (!highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) handleIndependentDoubleClick(variable);
  };

  const moveToCaseLabels = () => {
    if (!highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) handleCaseLabelsDoubleClick(variable);
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

  // Handler untuk ModelsTab (dari kode baru)
  const handleModelChange = (model: string) => {
    setSelectedModels((prev) =>
        prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // Handler Close (dari kode baru)
  const handleClose = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    onClose();
  };

  // Handler Reset (dari kode baru)
  const handleReset = () => {
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

  // ========================================================================
  // <<< INI ADALAH FUNGSI handleRunRegression DARI KODE LAMA >>>
  // Menggunakan filtering data lama dan payload postMessage lama
  // ========================================================================
  const handleRunRegression = async () => {
    setInlineAlertMessage(null);
    if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
      showAlert("Missing Information", "Please select a dependent variable and at least one independent variable.");
      return;
    }

    if (selectedModels.includes('Logistic') && (upperBound === '' || isNaN(parseFloat(upperBound)))) {
        showAlert("Invalid Input", "Please provide a valid numeric upper bound for the Logistic model.");
        return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const depCol = selectedDependentVariable.columnIndex;
      // The component supports multiple selections, but the old logic only uses the first one.
      // We'll stick to that to avoid changing the core analysis behavior.
      const indepColX = selectedIndependentVariables[0].columnIndex;
      const independentVarNames = selectedIndependentVariables.map(iv => iv.name);
      const dependentVarName = selectedDependentVariable.name;

      // New data filtering: Perform listwise deletion on the data from useAnalysisData
      const X_data: number[] = [];
      const Y_data: number[] = [];

      data.forEach(row => {
        // Ensure column indices are valid for the row
        if (depCol < row.length && indepColX < row.length) {
          const yVal = Number(row[depCol]);
          const xVal = Number(row[indepColX]);

          // Include row only if both values are valid numbers
          if (!isNaN(yVal) && !isNaN(xVal)) {
            Y_data.push(yVal);
            X_data.push(xVal);
          }
        }
      });

      if (X_data.length === 0) {
        setErrorMessage("No valid data pairs found after listwise deletion.");
        setIsProcessing(false);
        return;
      }

      const method = selectedModels.join(', ');

      // Log message LAMA (selalu /NOORIGIN)
      const logMessage = `REGRESSION
/MISSING LISTWISE
/STATISTICS COEFF OUTS R ANOVA
/CRITERIA=PIN(.05) POUT(.10)
/NOORIGIN
/DEPENDENT ${dependentVarName}
/METHOD=${method.toUpperCase()} ${independentVarNames.join(' ')}.`;

      const log = { log: logMessage };
      const logId = await addLog(log);
      console.log("[CurveEstimation OLD CALC] Log created with ID:", logId);

      const analytic = {
        title: "Curve Estimation",
        note: "",
      };
      const analyticId = await addAnalytic(logId, analytic);
      console.log("[CurveEstimation OLD CALC] Analytic created with ID:", analyticId);

      if (workerRef.current) {
        workerRef.current.terminate();
      }

      workerRef.current = new Worker('/workers/CurveEstimation/curve_estimation.js');

      workerRef.current.onmessage = async (event) => {
        const { action, data: workerData } = event.data; // Ganti nama variabel data

        if (action === 'regressionResults') {
          console.log("[CurveEstimation OLD CALC] Received regression results:", workerData);

          if (workerData.success) {
            // Deskripsi statistik LAMA (generik)
            const regressionSummaryStat = {
              title: "Curve Estimation",
              output_data: JSON.stringify(workerData.result),
              components: "CurveEstimationSummary",
              description: "Curve estimation analysis results" // Deskripsi generik lama
            };

            try {
              await addStatistic(analyticId, regressionSummaryStat);
              console.log("[CurveEstimation OLD CALC] Statistics saved successfully");
              onClose(); // Tetap tutup modal setelah sukses
            } catch (error) {
              console.error("[CurveEstimation OLD CALC] Failed to save statistics:", error);
              setErrorMessage("Failed to save regression results.");
            }
          } else {
            console.error("[CurveEstimation OLD CALC] Worker returned an error:", workerData.message);
            setErrorMessage(workerData.message || "An error occurred during regression analysis.");
          }

          setIsProcessing(false);
        } else if (action === 'error') {
          console.error("[CurveEstimation OLD CALC] Worker error:", workerData.message);
          setErrorMessage(workerData.message || "An error occurred during calculation.");
          setIsProcessing(false);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error("[CurveEstimation OLD CALC] Worker error:", error.message);
        setErrorMessage(`Worker error: ${error.message}`);
        setIsProcessing(false);

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };

      console.log("[CurveEstimation OLD CALC] Sending data to worker:", { models: selectedModels, X_length: X_data.length, Y_length: Y_data.length, upperBound: upperBound });
      // Payload postMessage LAMA (tidak mengirim includeConstant/displayANOVA)
      workerRef.current.postMessage({
        action: 'runRegression',
        data: {
          models: selectedModels,
          X: X_data, // Data X dari metode baru
          Y: Y_data, // Data Y dari metode baru
          dependentName: dependentVarName,
          independentNames: independentVarNames, // Nama tetap dikirim semua
          upperBound: selectedModels.includes('Logistic') ? parseFloat(upperBound) : undefined
          // TIDAK ADA includeConstant
          // TIDAK ADA displayANOVA
        }
      });

    } catch (error: unknown) {
      console.error("[CurveEstimation OLD CALC] Error in regression processing:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(`Error: ${errorMsg}`);
      setIsProcessing(false);
    }
  };
  // ========================================================================
  // <<< AKHIR DARI FUNGSI handleRunRegression KODE LAMA >>>
  // ========================================================================


  // Render function (JSX) modified to work with ModalRenderer
  return (
    <div className="flex flex-col h-full max-h-[85vh] overflow-hidden">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
                <AlertDialogDescription>{alertMessage.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Header section */}
      <div className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
        <h3 className="text-[22px] font-semibold">Curve Estimation</h3>
      </div>

      {/* Error and Warning Messages */}
      {errorMessage && (
        <div className="px-6 py-2 text-destructive">{errorMessage}</div>
      )}
      {containerType === "sidebar" && inlineAlertMessage && (
          <div className="p-2 mb-2 mx-6 text-sm text-destructive-foreground bg-destructive rounded-md">
              {inlineAlertMessage}
              <Button variant="ghost" size="sm" onClick={() => setInlineAlertMessage(null)} className="ml-2 text-destructive-foreground hover:bg-destructive/80">Dismiss</Button>
          </div>
      )}

      {/* Main content */}
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
        <TabsContent value="variables" className="overflow-y-auto flex-grow p-6 data-[state=inactive]:hidden">
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
        <TabsContent value="models" className="overflow-y-auto flex-grow data-[state=inactive]:hidden">
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

      {/* Footer section */}
      <div className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
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
      </div>
    </div>
  );
};

// Add default export to match OpenSavFile pattern
export default ModalCurveEstimation;