// Memodifikasi ModalLinear dengan menggunakan handleAnalyze dari versi lama
// Bagian import sesuai dengan modal baru
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import { useLinear } from '@/hooks/useLinear';
import Statistics, { StatisticsParams } from '@/components/Modals/Regression/Linear/Statistics';
import PlotsLinear, { PlotsLinearParams } from '@/components/Modals/Regression/Linear/PlotsLinear';
import SaveLinear, { SaveLinearParams } from './SaveLinear';
import OptionsLinear, { OptionsLinearParams } from './OptionsLinear';
import VariablesLinearTab from './VariablesLinearTab';
import { Variable } from '@/types/Variable';

interface ModalLinearProps {
  onClose: () => void;
}

// Default parameter states - sama seperti modal baru
const defaultStatsParams: StatisticsParams = {
  estimates: true,
  confidenceIntervals: false,
  covarianceMatrix: false,
  modelFit: true,
  rSquaredChange: false,
  descriptives: false,
  partAndPartial: false,
  collinearityDiagnostics: false,
  durbinWatson: false,
  casewiseDiagnostics: false,
  selectedResidualOption: '',
  outlierThreshold: '3'
};

const defaultPlotParams: PlotsLinearParams = {
    selectedY: null,
    selectedX: null,
    histogramChecked: false,
    normalProbabilityChecked: false,
    producePartialChecked: false
};

const defaultSaveParams: SaveLinearParams = {
  predictedUnstandardized: false,
  predictedStandardized: false,
  predictedAdjusted: false,
  predictedSE: false,
  residualUnstandardized: false,
  residualStandardized: false,
  residualStudentized: false,
  residualDeleted: false,
  residualStudentizedDeleted: false,
  distanceMahalanobis: false,
  distanceCooks: false,
  distanceLeverage: false,
  influenceDfBetas: false,
  influenceStandardizedDfBetas: false,
  influenceDfFits: false,
  influenceStandardizedDfFits: false,
  influenceCovarianceRatios: false,
  predictionMean: false,
  predictionIndividual: false,
  confidenceInterval: '95',
  createCoefficientStats: false,
  coefficientOption: 'newDataset',
  datasetName: '',
  xmlFilePath: '',
  includeCovarianceMatrixXml: false,
};

const defaultOptionsParams: OptionsLinearParams = {
  steppingMethod: 'probability',
  probEntry: '0.05',
  probRemoval: '0.10',
  fvalueEntry: '3.84',
  fvalueRemoval: '2.71',
  includeConstant: true,
  missingValue: 'listwise',
};

const ModalLinear: React.FC<ModalLinearProps> = ({ onClose }) => {
  // State variables - menggunakan struktur versi baru
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable[]>([]);
  const [selectedSelectionVariable, setSelectedSelectionVariable] = useState<Variable | null>(null);
  const [selectedCaseLabelsVariable, setSelectedCaseLabelsVariable] = useState<Variable | null>(null);
  const [selectedWLSWeightVariable, setSelectedWLSWeightVariable] = useState<Variable | null>(null);
  const [highlightedVariable, setHighlightedVariable] = useState<Variable | null>(null);
  const [method, setMethod] = useState<string>('Enter');

  // State untuk parameter dari tab lain
  const [statsParams, setStatsParams] = useState<StatisticsParams>(defaultStatsParams);
  const [plotParams, setPlotParams] = useState<PlotsLinearParams>(defaultPlotParams);
  const [saveParams, setSaveParams] = useState<SaveLinearParams>(defaultSaveParams);
  const [optionsParams, setOptionsParams] = useState<OptionsLinearParams>(defaultOptionsParams);

  const variablesFromStore = useVariableStore((state) => state.variables);
  const data = useDataStore((state) => state.data);
  const { calculateLinearRegression } = useLinear();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // Side effect - mengambil dari versi baru yang lebih terstruktur
  useEffect(() => {
    // Update available variables for the Variables tab
    const allSelectedIndices = [
      selectedDependentVariable?.columnIndex,
      ...selectedIndependentVariables.map(v => v.columnIndex),
      selectedSelectionVariable?.columnIndex,
      selectedCaseLabelsVariable?.columnIndex,
      selectedWLSWeightVariable?.columnIndex
    ].filter(index => index !== undefined);

    const availableVars: Variable[] = variablesFromStore
      .filter(v => v.name && !allSelectedIndices.includes(v.columnIndex))
      .map((v): Variable => ({
        id: v.id,
        columnIndex: v.columnIndex,
        name: v.name,
        type: v.type,
        width: v.width,
        decimals: v.decimals,
        label: v.label,
        values: v.values,
        missing: v.missing,
        columns: v.columns,
        align: v.align,
        measure: v.measure,
        role: v.role,
      }));
    setAvailableVariables(availableVars);
  }, [variablesFromStore, selectedDependentVariable, selectedIndependentVariables, selectedSelectionVariable, selectedCaseLabelsVariable, selectedWLSWeightVariable]);

  // Prepare variables for the Plots tab - dari versi baru
  const availablePlotVariables = React.useMemo(() => {
    const standardPlotVars = [
        { name: "*ZPRED" },
        { name: "*ZRESID" },
        { name: "*DRESID" },
        { name: "*ADJPRED" },
        { name: "*SRESID" },
        { name: "*SDRESID" },
    ];
    const selectedVarsForPlot = [
        ...(selectedDependentVariable ? [{ name: selectedDependentVariable.name }] : []),
        ...selectedIndependentVariables.map(v => ({ name: v.name }))
    ];
    const combined = [...selectedVarsForPlot, ...standardPlotVars];
    return combined.filter((v, index, self) =>
        index === self.findIndex((t) => t.name === v.name)
    );
  }, [selectedDependentVariable, selectedIndependentVariables]);

  // Handler functions for variable tab - menggunakan yang dari versi baru
  const handleSelectAvailableVariable = (variable: Variable | null) => {
    setHighlightedVariable(variable);
  };

  const handleMoveToDependent = () => {
    if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
      const currentAvailable = availableVariables.filter(v => v.columnIndex !== highlightedVariable.columnIndex);
      if (selectedDependentVariable) {
          currentAvailable.push(selectedDependentVariable);
      }
      setAvailableVariables(currentAvailable.sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedDependentVariable(highlightedVariable);
      setHighlightedVariable(null);
    }
  };

  const handleMoveToIndependent = () => {
      if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
          const variableToAdd = availableVariables.find(v => v.columnIndex === highlightedVariable.columnIndex);
          if (variableToAdd) {
              setSelectedIndependentVariables((prev) => [...prev, variableToAdd].sort((a, b) => a.columnIndex - b.columnIndex));
              setAvailableVariables((prev) => prev.filter((item) => item.columnIndex !== highlightedVariable.columnIndex).sort((a, b) => a.columnIndex - b.columnIndex));
              setHighlightedVariable(null);
          }
      }
  };

  const handleMoveToSelectionVariable = () => {
      if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
          const currentAvailable = availableVariables.filter(v => v.columnIndex !== highlightedVariable.columnIndex);
          if (selectedSelectionVariable) {
              currentAvailable.push(selectedSelectionVariable);
          }
          setAvailableVariables(currentAvailable.sort((a, b) => a.columnIndex - b.columnIndex));
          setSelectedSelectionVariable(highlightedVariable);
          setHighlightedVariable(null);
      }
  };

  const handleMoveToCaseLabelsVariable = () => {
      if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
          const currentAvailable = availableVariables.filter(v => v.columnIndex !== highlightedVariable.columnIndex);
          if (selectedCaseLabelsVariable) {
              currentAvailable.push(selectedCaseLabelsVariable);
          }
          setAvailableVariables(currentAvailable.sort((a, b) => a.columnIndex - b.columnIndex));
          setSelectedCaseLabelsVariable(highlightedVariable);
          setHighlightedVariable(null);
      }
  };

  const handleMoveToWLSWeightVariable = () => {
      if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
          const currentAvailable = availableVariables.filter(v => v.columnIndex !== highlightedVariable.columnIndex);
          if (selectedWLSWeightVariable) {
              currentAvailable.push(selectedWLSWeightVariable);
          }
          setAvailableVariables(currentAvailable.sort((a, b) => a.columnIndex - b.columnIndex));
          setSelectedWLSWeightVariable(highlightedVariable);
          setHighlightedVariable(null);
      }
  };

  const handleRemoveFromDependent = () => {
    if (selectedDependentVariable) {
      setAvailableVariables((prev) => [...prev, selectedDependentVariable].sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedDependentVariable(null);
    }
  };

  const handleRemoveFromIndependent = (variable: Variable) => {
    setAvailableVariables((prev) => [...prev, variable].sort((a, b) => a.columnIndex - b.columnIndex));
    setSelectedIndependentVariables((prev) => prev.filter((item) => item.columnIndex !== variable.columnIndex));
  };

  const handleRemoveFromSelectionVariable = () => {
    if (selectedSelectionVariable) {
      setAvailableVariables((prev) => [...prev, selectedSelectionVariable].sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedSelectionVariable(null);
    }
  };

  const handleRemoveFromCaseLabelsVariable = () => {
    if (selectedCaseLabelsVariable) {
      setAvailableVariables((prev) => [...prev, selectedCaseLabelsVariable].sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedCaseLabelsVariable(null);
    }
  };

  const handleRemoveFromWLSWeightVariable = () => {
    if (selectedWLSWeightVariable) {
      setAvailableVariables((prev) => [...prev, selectedWLSWeightVariable].sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedWLSWeightVariable(null);
    }
  };

  // Handlers for parameter tabs - dari versi baru
  const handleStatsChange = (newParams: Partial<StatisticsParams>) => {
    setStatsParams(prev => ({ ...prev, ...newParams }));
  };

  const handlePlotChange = (newParams: Partial<PlotsLinearParams>) => {
    setPlotParams(prev => ({ ...prev, ...newParams }));
  };

  const handleSaveChange = (newParams: Partial<SaveLinearParams>) => {
    setSaveParams(prev => ({ ...prev, ...newParams }));
  };

  const handleOptionsChange = (newParams: Partial<OptionsLinearParams>) => {
    setOptionsParams(prev => ({ ...prev, ...newParams }));
  };

  // handleReset - menggunakan versi baru
  const handleReset = () => {
    // Get all currently selected variables across all fields
     const allSelectedVars = [
        selectedDependentVariable,
        ...selectedIndependentVariables,
        selectedSelectionVariable,
        selectedCaseLabelsVariable,
        selectedWLSWeightVariable
    ].filter(v => v !== null) as Variable[];

    // Reset available variables to the full list from the store
    setAvailableVariables(variablesFromStore.map(v => ({...v})).sort((a, b) => a.columnIndex - b.columnIndex));

    // Clear all selections
    setSelectedDependentVariable(null);
    setSelectedIndependentVariables([]);
    setSelectedSelectionVariable(null);
    setSelectedCaseLabelsVariable(null);
    setSelectedWLSWeightVariable(null);
    setHighlightedVariable(null);
    setMethod('Enter');

    // Reset parameters for other tabs to defaults
    setStatsParams(defaultStatsParams);
    setPlotParams(defaultPlotParams);
    setSaveParams(defaultSaveParams);
    setOptionsParams(defaultOptionsParams);

    console.log("Reset button clicked - All selections and parameters reset");
  };

  const handleClose = () => {
    onClose();
  };

  // FUNGSI HANDLE ANALYZE DARI VERSI LAMA - diterapkan untuk versi baru
  const handleAnalyze = async () => {
    try {
      // Validasi input
      if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
        alert('Please select a dependent variable and at least one independent variable.');
        return;
      }
      
      // Gunakan statsParams langsung dari state (tidak perlu localStorage)
      const currentStatsParams = statsParams;
      console.log("[Analyze] Using statistics parameters:", currentStatsParams);
  
      const dependentVarName = selectedDependentVariable.name;
      const independentVarNames = selectedIndependentVariables.map(v => v.name);
  
      // Buat log message
      const logMessage = `REGRESSION 
      /MISSING LISTWISE 
      /STATISTICS COEFF OUTS R ANOVA 
      /CRITERIA=PIN(.05) POUT(.10) 
      /NOORIGIN 
      /DEPENDENT ${dependentVarName} 
      /METHOD=${method.toUpperCase()} ${independentVarNames.join(' ')}.`;
      
      console.log("[Analyze] Log message:", logMessage);
      const log = { log: logMessage };
      const logId = await addLog(log);
  
      const analytic = {
        title: "Linear Regression",
        note: "",
      };
      const analyticId = await addAnalytic(logId, analytic);
      console.log("[Analyze] Analytic ID:", analyticId);
  
      // Persiapkan data dan variabel
      const allVariables = variablesFromStore;
      const dataRows = data;
  
      const dependentVar = selectedDependentVariable;
      const independentVars = selectedIndependentVariables;
  
      const dependentVarIndex = dependentVar?.columnIndex;
      const independentVarIndices = independentVars.map(v => v.columnIndex);
  
      if (dependentVarIndex === undefined || independentVarIndices.some(index => index === undefined)) {
        throw new Error('Variable indices not found.');
      }
  
      const depVarIndex = dependentVarIndex;
      const indepVarIndices = independentVarIndices as number[];
  
      // Persiapkan data untuk analisis
      const dependentData = dataRows.map(row => parseFloat(String(row[depVarIndex])));
      const independentData = indepVarIndices.map(index => dataRows.map(row => parseFloat(String(row[index]))));
      console.log("[Analyze] Data awal - Dependent:", dependentData);
      console.log("[Analyze] Data awal - Independent (per variable):", independentData);
  
      // Filter data yang valid (listwise deletion)
      const validIndices = dependentData.map((value, idx) => {
        if (isNaN(value) || independentData.some(indepData => isNaN(indepData[idx]))) {
          return false;
        }
        return true;
      });
  
      const filteredDependentData = dependentData.filter((_, idx) => validIndices[idx]);
      const filteredIndependentData = independentData.map(indepData => indepData.filter((_, idx) => validIndices[idx]));
      console.log("[Analyze] Data valid - Dependent:", filteredDependentData);
      console.log("[Analyze] Data valid - Independent (per variable):", filteredIndependentData);
  
      // Transpose data untuk perhitungan regresi
      const independentDataTransposed = filteredIndependentData[0].map((_, idx) =>
        filteredIndependentData.map(indepData => indepData[idx])
      );
  
      // Hitung regresi (core calculation)
      const regressionResults = calculateLinearRegression(filteredDependentData, independentDataTransposed);
      console.log("[Analyze] Hasil regresi (calculateLinearRegression):", regressionResults);

      // --- WORKERS DARI VERSI LAMA (SEMUA WORKER DIJALANKAN TERPISAH) ---

      // 1. Variables Entered/Removed Worker
      const variablesEnteredRemovedWorker = new Worker('/workers/Regression/variables.js');
      console.log("[Analyze] Mengirim data ke Worker untuk Variables Entered/Removed...");
      variablesEnteredRemovedWorker.postMessage({
        dependent: filteredDependentData,
        independent: filteredIndependentData,
        dependentName: dependentVarName,
        independentNames: independentVarNames
      });

      variablesEnteredRemovedWorker.onmessage = async (e: MessageEvent) => {
        const variablesEnteredRemovedResults = e.data;
        console.log("[Analyze] Hasil dari Worker Variables Entered/Removed:", variablesEnteredRemovedResults);

        const variablesEnteredRemovedStat = {
          title: "Variables Entered/Removed",
          output_data: JSON.stringify(variablesEnteredRemovedResults),
          components: "VariablesEnteredRemoved",
          description: "Variables entered/removed in the regression analysis"
        };

        await addStatistic(analyticId, variablesEnteredRemovedStat);
        console.log("[Analyze] Statistik Variables Entered/Removed disimpan.");
        variablesEnteredRemovedWorker.terminate();
      };

      variablesEnteredRemovedWorker.onerror = (error: ErrorEvent) => {
        console.error("[Analyze] Worker Variables Entered/Removed error:", error);
        variablesEnteredRemovedWorker.terminate();
      };

      // 2. ANOVA Worker
      const anovaWorker = new Worker('/workers/Regression/anova.js');
      console.log("[Analyze] Sending data to ANOVA Worker...");
      anovaWorker.postMessage({
        dependentData: filteredDependentData,
        independentData: filteredIndependentData
      });

      anovaWorker.onmessage = async (e: MessageEvent) => {
        const anovaStat = e.data;
        if (anovaStat.error) {
          console.error("[Analyze] ANOVA Worker Error:", anovaStat.error);
          alert(`ANOVA Worker Error: ${anovaStat.error}`);
        } else {
          const completeStats = {
            title: anovaStat.title,
            output_data: anovaStat.output_data,
            components: anovaStat.components,
            description: "ANOVA analysis results"
          };
          await addStatistic(analyticId, completeStats);
          console.log("[Analyze] ANOVA statistics saved.");
        }
        anovaWorker.terminate();
      };

      anovaWorker.onerror = (error: ErrorEvent) => {
        console.error("[Analyze] ANOVA Worker error:", error, error.message);
        alert("An error occurred in the ANOVA Worker: " + (error.message || "Unknown error"));
        anovaWorker.terminate();
      };

      // 3. Coefficients Worker
      const coefficientsWorker = new Worker('/workers/Regression/coefficients.js');
      console.log("[Analyze] Sending data to Coefficients Worker...");

      coefficientsWorker.postMessage({
        dependentData: filteredDependentData,
        independentData: filteredIndependentData,
        independentVarNames: independentVarNames
      });

      coefficientsWorker.onmessage = async (e: MessageEvent) => {
        const { success, result, error } = e.data;

        if (success) {
          const coefficientsTable = result;
          const coefficientsStat = {
            title: "Coefficients",
            output_data: JSON.stringify(coefficientsTable),
            components: "Coefficients",
            description: "Coefficients of the regression model"
          };

          await addStatistic(analyticId, coefficientsStat);
          console.log("[Analyze] Coefficients statistics saved.");
        } else {
          console.error("[Analyze] Coefficients Worker error:", error);
          alert(`Coefficients Worker Error: ${error}`);
        }

        coefficientsWorker.terminate();
      };

      coefficientsWorker.onerror = (error: ErrorEvent) => {
        console.error("[Analyze] Coefficients Worker error:", error, error.message);
        alert("An error occurred in the Coefficients Worker: " + (error.message || "Unknown error"));
        coefficientsWorker.terminate();
      };

      // 4. R-Square Change (Conditional)
      if (currentStatsParams.rSquaredChange) {
        const worker = new Worker('/workers/Regression/rsquare.js');
        console.log("[Analyze] Mengirim data ke Worker untuk perhitungan regresi (squared changes)...");
        worker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        worker.onmessage = async (e: MessageEvent) => {
          const workerResults = e.data;
          console.log("[Analyze] Hasil dari Worker:", workerResults);
          const rSquareStat = {
            title: "Model Summary (R Square Change)",
            output_data: JSON.stringify(workerResults),
            components: "RSquareChange",
            description: "R square change statistics"
          };
          await addStatistic(analyticId, rSquareStat);
          console.log("[Analyze] Statistik R Square Change disimpan.");
          
          worker.terminate();
        };
  
        worker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker error:", error);
          worker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping R Square Change calculation (not selected).");
      }
  
      // 5. Confidence Intervals (Conditional)
      if (currentStatsParams.confidenceIntervals) {
        const confidenceWorker = new Worker('/workers/Regression/confidence_interval.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Confidence Interval...");
        confidenceWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        confidenceWorker.onmessage = async (e: MessageEvent) => {
          const confidenceResults = e.data;
          console.log("[Analyze] Hasil Confidence Interval dari Worker:", confidenceResults);
          const confidenceStat = {
            title: "Confidence Interval",
            output_data: JSON.stringify(confidenceResults),
            components: "ConfidenceInterval",
            description: "Confidence interval for regression coefficients"
          };
          await addStatistic(analyticId, confidenceStat);
          console.log("[Analyze] Statistik Confidence Interval disimpan.");
          confidenceWorker.terminate();
        };
  
        confidenceWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Confidence Interval error:", error);
          confidenceWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Confidence Interval calculation (not selected).");
      }
  
      // 6. Part and Partial Correlations (Conditional)
      if (currentStatsParams.partAndPartial) {
        const partAndPartialWorker = new Worker('/workers/Regression/coefficients_partandpartial.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Part & Partial Correlations...");
        partAndPartialWorker.postMessage({
          dependent: filteredDependentData,
          independents: filteredIndependentData
        });
  
        partAndPartialWorker.onmessage = async (e: MessageEvent) => {
          const partAndPartialResults = e.data;
          console.log("[Analyze] Hasil dari Worker Coefficients Part & Partial:", partAndPartialResults);
          const partAndPartialStat = {
            title: "Coefficients (Part & Partial Correlations)",
            output_data: JSON.stringify(partAndPartialResults),
            components: "CoefficientsPartAndPartial",
            description: "Part and partial correlations of regression coefficients"
          };
          await addStatistic(analyticId, partAndPartialStat);
          console.log("[Analyze] Statistik Coefficients Part & Partial disimpan.");
          partAndPartialWorker.terminate();
        };
  
        partAndPartialWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Coefficients Part & Partial error:", error);
          partAndPartialWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Part & Partial Correlations (not selected).");
      }
  
      // 7. Collinearity Diagnostics (Conditional)
      if (currentStatsParams.collinearityDiagnostics) {
        // 7a. Coefficients Collinearity
        const collinearityWorker = new Worker('/workers/Regression/coefficients_collinearity.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Collinearity...");
        collinearityWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        collinearityWorker.onmessage = async (e: MessageEvent) => {
          const collinearityResults = e.data;
          console.log("[Analyze] Hasil dari Worker Coefficients Collinearity:", collinearityResults);
          const collinearityStat = {
            title: "Collinearity Diagnostics",
            output_data: JSON.stringify(collinearityResults),
            components: "CollinearityStatistics",
            description: "Collinearity statistics for regression variables"
          };
          await addStatistic(analyticId, collinearityStat);
          console.log("[Analyze] Statistik Collinearity Diagnostics disimpan.");
          collinearityWorker.terminate();
        };
  
        collinearityWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Coefficients Collinearity error:", error);
          collinearityWorker.terminate();
        };
        
        // 7b. Collinearity Diagnostics (Detailed)
        const collinearityDiagnosticsWorker = new Worker('/workers/Regression/collinearity_diagnostics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Collinearity Diagnostics...");
        collinearityDiagnosticsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        collinearityDiagnosticsWorker.onmessage = async (e: MessageEvent) => {
          const collinearityDiagnosticsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Collinearity Diagnostics:", collinearityDiagnosticsResults);
          const collinearityDiagnosticsStat = {
            title: "Collinearity Diagnostics",
            output_data: JSON.stringify(collinearityDiagnosticsResults),
            components: "CollinearityDiagnostics",
            description: "Detailed collinearity diagnostics"
          };
          await addStatistic(analyticId, collinearityDiagnosticsStat);
          console.log("[Analyze] Statistik Collinearity Diagnostics disimpan.");
          collinearityDiagnosticsWorker.terminate();
        };
  
        collinearityDiagnosticsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Collinearity Diagnostics error:", error);
          collinearityDiagnosticsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Collinearity Diagnostics (not selected).");
      }
  
      // 8. Durbin-Watson (Conditional)
      if (currentStatsParams.durbinWatson) {
        const modelDurbinWorker = new Worker('/workers/Regression/model_durbin.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Model Durbin...");
        modelDurbinWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        modelDurbinWorker.onmessage = async (e: MessageEvent) => {
          const modelDurbinResults = e.data;
          console.log("[Analyze] Hasil dari Worker Model Durbin:", modelDurbinResults);
          const modelDurbinStat = {
            title: "Model Summary (Durbin-Watson)",
            output_data: JSON.stringify(modelDurbinResults),
            components: "ModelDurbin",
            description: "Durbin-Watson test statistics"
          };
          await addStatistic(analyticId, modelDurbinStat);
          console.log("[Analyze] Statistik Model Durbin disimpan.");
          modelDurbinWorker.terminate();
        };
  
        modelDurbinWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Model Durbin error:", error);
          modelDurbinWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Durbin-Watson test (not selected).");
      }
  
      // 9. Residuals Statistics (Conditional - Durbin-Watson or Casewise Diagnostics)
      if (currentStatsParams.durbinWatson || currentStatsParams.casewiseDiagnostics) {
        const residualsStatisticsWorker = new Worker('/workers/Regression/residuals_statistics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Residuals Statistics...");
        residualsStatisticsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData[0]
        });
  
        residualsStatisticsWorker.onmessage = async (e: MessageEvent) => {
          const residualsStatisticsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Residuals Statistics:", residualsStatisticsResults);
          const residualsStatisticsStat = {
            title: "Residuals Statistics",
            output_data: JSON.stringify(residualsStatisticsResults),
            components: "ResidualsStatistics",
            description: "Statistics of regression residuals"
          };
          await addStatistic(analyticId, residualsStatisticsStat);
          console.log("[Analyze] Statistik Residuals Statistics disimpan.");
          residualsStatisticsWorker.terminate();
        };
  
        residualsStatisticsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Residuals Statistics error:", error);
          residualsStatisticsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Residuals Statistics (no residual option selected).");
      }
  
      // 10. Casewise Diagnostics (Conditional)
      if (currentStatsParams.casewiseDiagnostics) {
        const casewiseDiagnosticsWorker = new Worker('/workers/Regression/casewise_diagnostics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Casewise Diagnostics...");
        casewiseDiagnosticsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData[0],
          threshold: parseFloat(currentStatsParams.outlierThreshold) || 3
        });
  
        casewiseDiagnosticsWorker.onmessage = async (e: MessageEvent) => {
          const casewiseDiagnosticsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Casewise Diagnostics:", casewiseDiagnosticsResults);
          const casewiseDiagnosticsStat = {
            title: "Casewise Diagnostics",
            output_data: JSON.stringify(casewiseDiagnosticsResults),
            components: "CasewiseDiagnostics",
            description: "Casewise diagnostics for outlier detection"
          };
          await addStatistic(analyticId, casewiseDiagnosticsStat);
          console.log("[Analyze] Statistik Casewise Diagnostics disimpan.");
          casewiseDiagnosticsWorker.terminate();
        };
  
        casewiseDiagnosticsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Casewise Diagnostics error:", error);
          casewiseDiagnosticsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Casewise Diagnostics (not selected).");
      }
  
      // 11. Covariance Matrix (Conditional)
      if (currentStatsParams.covarianceMatrix) {
        const coefficientCorrelationsWorker = new Worker('/workers/Regression/coefficient_correlations.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficient Correlations...");
        coefficientCorrelationsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        coefficientCorrelationsWorker.onmessage = async (e: MessageEvent) => {
          const correlationsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Coefficient Correlations:", correlationsResults);
          const correlationsStat = {
            title: "Coefficient Correlations",
            output_data: JSON.stringify(correlationsResults),
            components: "CoefficientCorrelations",
            description: "Correlations between regression coefficients"
          };
          await addStatistic(analyticId, correlationsStat);
          console.log("[Analyze] Statistik Coefficient Correlations disimpan.");
          coefficientCorrelationsWorker.terminate();
        };
  
        coefficientCorrelationsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Coefficient Correlations error:", error);
          coefficientCorrelationsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Correlation calculations (covariance matrix not selected).");
      }
  
      // 12. Descriptive Statistics (Conditional)
      if (currentStatsParams.descriptives) {
        // 12a. Descriptive Statistics
        const descriptiveWorker = new Worker('/workers/Regression/descriptive_statistics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Descriptive Statistics...");
        descriptiveWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        descriptiveWorker.onmessage = async (e: MessageEvent) => {
          const descriptiveResults = e.data;
          console.log("[Analyze] Hasil Descriptive Statistics dari Worker:", descriptiveResults);
          const descriptiveStat = {
            title: "Descriptive Statistics",
            output_data: JSON.stringify(descriptiveResults),
            components: "DescriptiveStatistics",
            description: "Descriptive statistics for the variables"
          };
          await addStatistic(analyticId, descriptiveStat);
          console.log("[Analyze] Statistik Descriptive Statistics disimpan.");
          descriptiveWorker.terminate();
        };
  
        descriptiveWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Descriptive Statistics error:", error);
          descriptiveWorker.terminate();
        };
        
        // 12b. Correlations
        const correlationsWorker = new Worker('/workers/Regression/correlations.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Correlations...");
        correlationsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        correlationsWorker.onmessage = async (e: MessageEvent) => {
          const correlationsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Correlations:", correlationsResults);
          const correlationsStat = {
            title: "Correlations",
            output_data: JSON.stringify(correlationsResults),
            components: "Correlations",
            description: "Correlation matrix between variables"
          };
          await addStatistic(analyticId, correlationsStat);
          console.log("[Analyze] Statistik Correlations disimpan.");
          correlationsWorker.terminate();
        };
  
        correlationsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Correlations error:", error);
          correlationsWorker.terminate();
        };
  
      } else {
        console.log("[Analyze] Skipping Descriptive Statistics (not selected).");
      }
  
      // 13. Model Fit / Model Summary (Conditional)
      if (currentStatsParams.modelFit || currentStatsParams.descriptives) {
        const modelSummaryWorker = new Worker('/workers/Regression/model_summary.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Model Summary...");
        modelSummaryWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        modelSummaryWorker.onmessage = async (e: MessageEvent) => {
          const modelSummaryResults = e.data;
          console.log("[Analyze] Hasil dari Worker Model Summary:", modelSummaryResults);
          const modelSummaryStat = {
            title: "Model Summary",
            output_data: JSON.stringify(modelSummaryResults),
            components: "ModelSummary",
            description: "Summary of the regression model"
          };
          await addStatistic(analyticId, modelSummaryStat);
          console.log("[Analyze] Statistik Model Summary disimpan.");
          modelSummaryWorker.terminate();
        };
  
        modelSummaryWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Model Summary error:", error);
          modelSummaryWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Model Summary (model fit not selected).");
      }

      // Tutup modal setelah memulai analisis
      onClose();
  
    } catch (error: unknown) {
      console.error('[Analyze] Failed to perform linear regression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to perform linear regression: ${errorMessage}`);
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[900px]">
      <DialogHeader>
        <DialogTitle>Linear Regression</DialogTitle>
      </DialogHeader>

      <Separator className="my-2" />

      <Tabs defaultValue="variables" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="plots">Plots</TabsTrigger>
          <TabsTrigger value="save">Save</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>

        {/* Variables Tab */}
        <TabsContent value="variables">
          <VariablesLinearTab
            availableVariables={availableVariables}
            selectedDependentVariable={selectedDependentVariable}
            selectedIndependentVariables={selectedIndependentVariables}
            selectedSelectionVariable={selectedSelectionVariable}
            selectedCaseLabelsVariable={selectedCaseLabelsVariable}
            selectedWLSWeightVariable={selectedWLSWeightVariable}
            highlightedVariable={highlightedVariable}
            method={method}
            handleSelectAvailableVariable={handleSelectAvailableVariable}
            handleMoveToDependent={handleMoveToDependent}
            handleMoveToIndependent={handleMoveToIndependent}
            handleMoveToSelectionVariable={handleMoveToSelectionVariable}
            handleMoveToCaseLabelsVariable={handleMoveToCaseLabelsVariable}
            handleMoveToWLSWeightVariable={handleMoveToWLSWeightVariable}
            handleRemoveFromDependent={handleRemoveFromDependent}
            handleRemoveFromIndependent={handleRemoveFromIndependent}
            handleRemoveFromSelectionVariable={handleRemoveFromSelectionVariable}
            handleRemoveFromCaseLabelsVariable={handleRemoveFromCaseLabelsVariable}
            handleRemoveFromWLSWeightVariable={handleRemoveFromWLSWeightVariable}
            setMethod={setMethod}
          />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Statistics params={statsParams} onChange={handleStatsChange} />
        </TabsContent>

        {/* Plots Tab */}
        <TabsContent value="plots">
          <PlotsLinear
            params={plotParams}
            onChange={handlePlotChange}
            availablePlotVariables={availablePlotVariables} />
        </TabsContent>

        {/* Save Tab */}
        <TabsContent value="save">
           <SaveLinear params={saveParams} onChange={handleSaveChange} />
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options">
           <OptionsLinear params={optionsParams} onChange={handleOptionsChange} />
        </TabsContent>

      </Tabs>

      {/* Footer */}
      <DialogFooter className="flex justify-center space-x-4 mt-4">
        <Button onClick={handleAnalyze}>OK</Button>
        <Button variant="outline">Paste</Button>
        <Button variant="outline" onClick={handleReset}>Reset</Button>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="outline">Help</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ModalLinear;