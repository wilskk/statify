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

// --- Default Parameter States ---
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

// Use exported PlotsLinearParams type
const defaultPlotParams: PlotsLinearParams = {
    selectedY: null,
    selectedX: null,
    histogramChecked: false,
    normalProbabilityChecked: false,
    producePartialChecked: false
};

// Use exported SaveLinearParams type
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

// Use exported OptionsLinearParams type
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
  // --- State Variables ---
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable[]>([]);
  const [selectedSelectionVariable, setSelectedSelectionVariable] = useState<Variable | null>(null);
  const [selectedCaseLabelsVariable, setSelectedCaseLabelsVariable] = useState<Variable | null>(null);
  const [selectedWLSWeightVariable, setSelectedWLSWeightVariable] = useState<Variable | null>(null);
  const [highlightedVariable, setHighlightedVariable] = useState<Variable | null>(null);
  const [method, setMethod] = useState<string>('Enter');

  // State for parameters from other tabs - use correct types
  const [statsParams, setStatsParams] = useState<StatisticsParams>(defaultStatsParams);
  const [plotParams, setPlotParams] = useState<PlotsLinearParams>(defaultPlotParams);
  const [saveParams, setSaveParams] = useState<SaveLinearParams>(defaultSaveParams);
  const [optionsParams, setOptionsParams] = useState<OptionsLinearParams>(defaultOptionsParams);

  const variablesFromStore = useVariableStore((state) => state.variables);
  const data = useDataStore((state) => state.data);
  const { calculateLinearRegression } = useLinear();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

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

  // --- Prepare variables for the Plots tab --- 
  const availablePlotVariables = React.useMemo(() => {
    // Define standard plot variables (adjust names as needed)
    const standardPlotVars = [
        { name: "*ZPRED" },
        { name: "*ZRESID" },
        { name: "*DRESID" },
        { name: "*ADJPRED" },
        { name: "*SRESID" },
        { name: "*SDRESID" },
    ];
    // Combine selected variables (dependent + independents) with standard plot vars
    const selectedVarsForPlot = [
        ...(selectedDependentVariable ? [{ name: selectedDependentVariable.name }] : []),
        ...selectedIndependentVariables.map(v => ({ name: v.name }))
    ];
    // Deduplicate and combine
    const combined = [...selectedVarsForPlot, ...standardPlotVars];
    return combined.filter((v, index, self) =>
        index === self.findIndex((t) => t.name === v.name)
    );
  }, [selectedDependentVariable, selectedIndependentVariables]);

  // --- Handler Functions for Variable Tab (Keep existing handlers) ---
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

  // --- Handlers for Parameter Tabs ---
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

  // --- Main Action Handlers ---
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

  const handleAnalyze = async () => {
    // Validate necessary inputs
    if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
      alert("Please select a dependent variable and at least one independent variable on the Variables tab.");
      return;
    }

    // Use state directly instead of localStorage
    const currentStatsParams = statsParams;
    const currentOptionsParams = optionsParams; // Use options state

    // Add checks for plotParams, saveParams if needed by workers/logic below

    console.log("[Analyze] Using parameters:", {
        stats: currentStatsParams,
        options: currentOptionsParams,
        plots: plotParams,
        save: saveParams
    });

    try {
      const dependentVarName = selectedDependentVariable.name;
      const independentVarNames = selectedIndependentVariables.map(v => v.name);

      // Construct log message (adapt as needed based on final required format)
      const logMessage = `REGRESSION 
      /MISSING ${currentOptionsParams.missingValue === 'listwise' ? 'LISTWISE' : currentOptionsParams.missingValue === 'pairwise' ? 'PAIRWISE' : 'MEANSUBSTITUTION'} 
      /STATISTICS COEFF OUTS R ANOVA ${currentStatsParams.confidenceIntervals ? 'CI(95)' : ''} ${currentStatsParams.covarianceMatrix ? 'COV' : ''} ${currentStatsParams.rSquaredChange ? 'CHANGE' : ''} ${currentStatsParams.descriptives ? 'DESCRIPTIVES' : ''} ${currentStatsParams.partAndPartial ? 'ZPP' : ''} ${currentStatsParams.collinearityDiagnostics ? 'COLLIN' : ''} ${currentStatsParams.durbinWatson ? 'DW' : ''}
      /CRITERIA=PIN(${currentOptionsParams.steppingMethod === 'probability' ? currentOptionsParams.probEntry : '.05'}) POUT(${currentOptionsParams.steppingMethod === 'probability' ? currentOptionsParams.probRemoval : '.10'}) ${currentOptionsParams.steppingMethod === 'fvalue' ? `FIN(${currentOptionsParams.fvalueEntry}) FOUT(${currentOptionsParams.fvalueRemoval})` : ''}
      ${currentOptionsParams.includeConstant ? '/NOORIGIN' : '/ORIGIN'}
      /DEPENDENT ${dependentVarName} 
      /METHOD=${method.toUpperCase()} ${independentVarNames.join(' ')}.`; // Assuming method state holds 'Enter', 'Stepwise' etc.

      console.log("[Analyze] Log message:", logMessage);
      const log = { log: logMessage };
      const logId = await addLog(log);
      console.log("[Analyze] Log ID:", logId);

      const analytic = {
        title: "Linear Regression",
        note: `Dependent: ${dependentVarName}, Method: ${method}`, // Example note
      };
      const analyticId = await addAnalytic(logId, analytic);
      console.log("[Analyze] Analytic ID:", analyticId);

      // Use variables from store directly
      const allVariables = variablesFromStore;
      const dataRows = data;

      const dependentVar = selectedDependentVariable; // Already have the object
      const independentVars = selectedIndependentVariables; // Already have the objects

      const dependentVarIndex = dependentVar?.columnIndex;
      const independentVarIndices = independentVars.map(v => v.columnIndex);

      if (dependentVarIndex === undefined || independentVarIndices.some(index => index === undefined)) {
        throw new Error('Variable indices not found.');
      }

      const depVarIndex = dependentVarIndex;
      const indepVarIndices = independentVarIndices as number[];

      // Declare variables for core results needed by subsequent workers
      let calculatedCoefficients: number[] | null = null; // Or appropriate type
      let calculatedResiduals: number[] | null = null;
      let calculatedPredicted: number[] | null = null;

      // --- Data Filtering (Listwise Deletion based on selected Dep/Indep) ---
      let filteredDependentData: number[] = [];
      let filteredIndependentData: number[][] = Array(indepVarIndices.length).fill(0).map(() => []);
      let originalIndices: number[] = []; // Keep track of original row index for Case Labels/Save

      for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const depValue = parseFloat(String(row[depVarIndex]));
          const indepValues = indepVarIndices.map(idx => parseFloat(String(row[idx])));

          // Check if any value is NaN
          if (!isNaN(depValue) && indepValues.every(val => !isNaN(val))) {
              filteredDependentData.push(depValue);
              indepVarIndices.forEach((_, k) => {
                  filteredIndependentData[k].push(indepValues[k]);
              });
              originalIndices.push(i); // Store the original index of the valid row
          }
      }
      // --- End Data Filtering ---

      if (filteredDependentData.length === 0) {
          alert("No valid data remaining after handling missing values. Cannot perform analysis.");
          return; // Stop analysis
      }

      console.log(`[Analyze] Data valid (after ${currentOptionsParams.missingValue}) - Dependent: ${filteredDependentData.length} cases`);
      // console.log("[Analyze] Data valid - Independent (per variable):", filteredIndependentData);

      // Transpose independent data for libraries/workers expecting rows as inner arrays
       const independentDataTransposed = filteredDependentData.length > 0
        ? filteredIndependentData[0].map((_, colIndex) =>
            filteredIndependentData.map(row => row[colIndex]))
        : [];

      // --- Worker Calls based on selected Statistics --- 

      // Example: Pass data to the main regression calculation hook/function (if it exists)
      // This function might internally call workers or perform calculations directly
      // Replace this placeholder as needed
      // const regressionResults = calculateLinearRegression(filteredDependentData, independentDataTransposed);
      // console.log("[Analyze] Hasil regresi (calculateLinearRegression):", regressionResults);

      // Variables Entered/Removed (usually part of method output)
      const variablesEnteredRemovedWorker = new Worker('/workers/Regression/variables.js');
      console.log("[Analyze] Mengirim data ke Worker untuk Variables Entered/Removed...");
      variablesEnteredRemovedWorker.postMessage({
        dependent: filteredDependentData,
        // Ensure worker expects independent data per variable (array of arrays)
        independent: filteredIndependentData,
        dependentName: dependentVarName,
        independentNames: independentVarNames
        // Pass method if needed by worker: method: method
      });

      variablesEnteredRemovedWorker.onmessage = async (e: MessageEvent) => {
        const variablesEnteredRemovedResults = e.data;
        console.log("[Analyze] Hasil dari Worker Variables Entered/Removed:", variablesEnteredRemovedResults);
        if (variablesEnteredRemovedResults && !variablesEnteredRemovedResults.error) {
            const variablesEnteredRemovedStat = {
              title: "Variables Entered/Removed",
              output_data: JSON.stringify(variablesEnteredRemovedResults), // Adjust based on worker output structure
              components: "VariablesEnteredRemoved",
              description: "Variables entered/removed based on the selected method"
            };
            await addStatistic(analyticId, variablesEnteredRemovedStat);
            console.log("[Analyze] Statistik Variables Entered/Removed disimpan.");
        } else {
            console.error("[Analyze] Worker Variables Entered/Removed error:", variablesEnteredRemovedResults?.error);
        }
        variablesEnteredRemovedWorker.terminate();
      };
      variablesEnteredRemovedWorker.onerror = (error: ErrorEvent) => {
        console.error("[Analyze] Worker Variables Entered/Removed error:", error);
        variablesEnteredRemovedWorker.terminate();
      };

      // ANOVA (Always calculated? Or depends on Model Fit? Check SPSS behavior)
      // Assuming always calculated if model is generated
      const anovaWorker = new Worker('/workers/Regression/anovaWorker.js');
      console.log("[Analyze] Sending data to ANOVA Worker...");
      anovaWorker.postMessage({
        dependentData: filteredDependentData,
        independentData: filteredIndependentData // Check worker input reqs
      });
      anovaWorker.onmessage = async (e: MessageEvent) => {
        const anovaStat = e.data;
        if (anovaStat.error) {
          console.error("[Analyze] ANOVA Worker Error:", anovaStat.error);
          // Optionally show error to user
        } else {
          console.log("[Analyze] Hasil ANOVA Worker:", anovaStat);
          const completeStats = {
            title: anovaStat.title || "ANOVA", // Use title from worker or default
            output_data: anovaStat.output_data, // Expecting JSON string or object
            components: anovaStat.components || "AnovaTable", // Expecting component name
            description: "ANOVA table for the regression model"
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

      // Coefficients (Always calculated)
      const coefficientsWorker = new Worker('/workers/Regression/coefficients.js');
      console.log("[Analyze] Sending data to Coefficients Worker...");
      coefficientsWorker.postMessage({
        dependentData: filteredDependentData,
        independentData: filteredIndependentData,
        independentVarNames: independentVarNames,
        calculateCI: currentStatsParams.confidenceIntervals,
        calculateCorrelations: currentStatsParams.partAndPartial,
        calculateCollinearity: currentStatsParams.collinearityDiagnostics
      });
      coefficientsWorker.onmessage = async (e: MessageEvent) => {
        const { success, result, error } = e.data;
        if (success) {
          console.log("[Analyze] Hasil Coefficients Worker:", result);
          const coefficientsTable = result; // Adjust based on worker output structure

          // *** ASSIGN CORE RESULTS HERE ***
          // Example: Assuming worker result includes these keys
          calculatedCoefficients = result.coefficients || null;
          calculatedResiduals = result.residuals || null;
          calculatedPredicted = result.predicted || null;
          // *******************************

          const coefficientsStat = {
            title: "Coefficients",
            output_data: JSON.stringify(coefficientsTable), // May need to adjust what part of result is stringified
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

      // Model Summary (R Square) - Calculated if Model Fit or Descriptives selected?
      if (currentStatsParams.modelFit || currentStatsParams.descriptives) {
        const modelSummaryWorker = new Worker('/workers/Regression/model_summary.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Model Summary...");
        modelSummaryWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData, // Check worker input reqs
          // Pass flags for specific calculations if needed
          calculateRSquareChange: currentStatsParams.rSquaredChange,
          calculateDurbinWatson: currentStatsParams.durbinWatson
        });
        modelSummaryWorker.onmessage = async (e: MessageEvent) => {
          const modelSummaryResults = e.data;
          if(modelSummaryResults && !modelSummaryResults.error) {
              console.log("[Analyze] Hasil dari Worker Model Summary:", modelSummaryResults);
              const modelSummaryStat = {
                title: "Model Summary",
                output_data: JSON.stringify(modelSummaryResults), // Adjust based on worker output
                components: "ModelSummary", // May need variations (e.g., ModelSummaryWithDW)
                description: "Summary statistics of the regression model"
              };
              await addStatistic(analyticId, modelSummaryStat);
              console.log("[Analyze] Statistik Model Summary disimpan.");
          } else {
              console.error("[Analyze] Worker Model Summary error:", modelSummaryResults?.error);
          }
          modelSummaryWorker.terminate();
        };
        modelSummaryWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Model Summary error:", error);
          modelSummaryWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Model Summary (Model Fit / Descriptives not selected).");
      }

     // --- Conditional Worker Calls based on Stats Params --- 

      // Descriptive Statistics
      if (currentStatsParams.descriptives) {
        const descriptiveWorker = new Worker('/workers/Regression/descriptive_statistics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Descriptive Statistics...");
        descriptiveWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData, // Check worker input
          dependentName: dependentVarName,      // Pass names if needed by worker
          independentNames: independentVarNames
        });
        descriptiveWorker.onmessage = async (e: MessageEvent) => {
          const descriptiveResults = e.data;
          if (descriptiveResults && !descriptiveResults.error) {
              console.log("[Analyze] Hasil Descriptive Statistics dari Worker:", descriptiveResults);
              const descriptiveStat = {
                title: "Descriptive Statistics",
                output_data: JSON.stringify(descriptiveResults), // Adjust based on worker output
                components: "DescriptiveStatistics",
                description: "Descriptive statistics for the variables"
              };
              await addStatistic(analyticId, descriptiveStat);
              console.log("[Analyze] Statistik Descriptive Statistics disimpan.");
          } else {
               console.error("[Analyze] Worker Descriptive Statistics error:", descriptiveResults?.error);
          }
          descriptiveWorker.terminate();
        };
        descriptiveWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Descriptive Statistics error:", error);
          descriptiveWorker.terminate();
        };

        const correlationsWorker = new Worker('/workers/Regression/correlations.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Correlations...");
        correlationsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData, // Check worker input
          dependentName: dependentVarName,
          independentNames: independentVarNames
        });
        correlationsWorker.onmessage = async (e: MessageEvent) => {
          const correlationsResults = e.data;
           if (correlationsResults && !correlationsResults.error) {
              console.log("[Analyze] Hasil dari Worker Correlations:", correlationsResults);
              const correlationsStat = {
                title: "Correlations",
                output_data: JSON.stringify(correlationsResults), // Adjust based on worker output
                components: "Correlations",
                description: "Correlation matrix between variables"
              };
              await addStatistic(analyticId, correlationsStat);
              console.log("[Analyze] Statistik Correlations disimpan.");
           } else {
               console.error("[Analyze] Worker Correlations error:", correlationsResults?.error);
           }
          correlationsWorker.terminate();
        };
        correlationsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Correlations error:", error);
          correlationsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Descriptive Statistics & Correlations (not selected).");
      }
      
      // Part and Partial Correlations (if calculated separately from Coefficients)
      /* // This seems to be handled IN the coefficients worker now based on its params
      if (currentStatsParams.partAndPartial) {
        const partAndPartialWorker = new Worker('/workers/Regression/coefficients_partandpartial.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Part & Partial Correlations...");
        partAndPartialWorker.postMessage({
          dependent: filteredDependentData,
          independents: filteredIndependentData // Check worker expects this structure
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
      */

      // Collinearity Diagnostics (if calculated separately from Coefficients)
      /* // This seems to be handled IN the coefficients worker now based on its params
      if (currentStatsParams.collinearityDiagnostics) {
        const collinearityWorker = new Worker('/workers/Regression/coefficients_collinearity.js'); 
        // ... post message ... 
        // ... on message ...
        // ... on error ...
        const collinearityDiagnosticsWorker = new Worker('/workers/Regression/collinearity_diagnostics.js');
        // ... post message ... 
        // ... on message ...
        // ... on error ...
      } else {
        console.log("[Analyze] Skipping Collinearity Diagnostics (not selected).");
      }
      */

      // Durbin-Watson (If calculated separately from Model Summary)
      /* // This seems to be handled IN the model summary worker now based on its params
      if (currentStatsParams.durbinWatson) {
          const modelDurbinWorker = new Worker('/workers/Regression/model_durbin.js');
          // ... post message ...
          // ... on message ...
          // ... on error ...
      } else {
          console.log("[Analyze] Skipping Durbin-Watson test (not selected).");
      }
      */

      // Residuals Statistics
      if (currentStatsParams.durbinWatson || currentStatsParams.casewiseDiagnostics) {
        if(calculatedPredicted && calculatedResiduals) { 
            const residualsStatisticsWorker = new Worker('/workers/Regression/residuals_statistics.js');
            console.log("[Analyze] Mengirim data ke Worker untuk Residuals Statistics...");
            residualsStatisticsWorker.postMessage({
              predicted: calculatedPredicted,
              residuals: calculatedResiduals
            });
            residualsStatisticsWorker.onmessage = async (e: MessageEvent) => {
                const results = e.data;
                if (results && !results.error) {
                    await addStatistic(analyticId, {
                    title: "Residuals Statistics",
                    output_data: JSON.stringify(results),
                    components: "ResidualsStatistics",
                    description: "Statistics of regression residuals"
                    });
                    console.log("[Analyze] Statistik Residuals Statistics disimpan.");
                } else { console.error("[Analyze] Worker Residuals Statistics error:", results?.error); }
                residualsStatisticsWorker.terminate();
            };
            residualsStatisticsWorker.onerror = (e) => { console.error("[Analyze] Worker Residuals Statistics error:", e); residualsStatisticsWorker.terminate(); };
        } else {
             console.warn("[Analyze] Skipping Residuals Statistics: Core regression results not available when needed.");
        }
      } else {
        console.log("[Analyze] Skipping Residuals Statistics (no relevant option selected).");
      }

      // Casewise Diagnostics
      if (currentStatsParams.casewiseDiagnostics) {
        if (calculatedResiduals) { 
            const casewiseDiagnosticsWorker = new Worker('/workers/Regression/casewise_diagnostics.js');
            const filteredCaseLabels = selectedCaseLabelsVariable
                ? dataRows
                    .filter((_, index) => originalIndices.includes(index))
                    .map(row => row[selectedCaseLabelsVariable!.columnIndex])
                : null;
            console.log("[Analyze] Mengirim data ke Worker untuk Casewise Diagnostics...");
            casewiseDiagnosticsWorker.postMessage({
              residuals: calculatedResiduals, 
              caseLabels: filteredCaseLabels, 
              originalIndices: originalIndices, 
              threshold: parseFloat(currentStatsParams.outlierThreshold) || 3,
              option: currentStatsParams.selectedResidualOption
            });
            casewiseDiagnosticsWorker.onmessage = async (e: MessageEvent) => {
                const results = e.data;
                if (results && !results.error) {
                    await addStatistic(analyticId, {
                    title: "Casewise Diagnostics",
                    output_data: JSON.stringify(results),
                    components: "CasewiseDiagnostics",
                    description: "Casewise diagnostics for outlier detection"
                    });
                    console.log("[Analyze] Statistik Casewise Diagnostics disimpan.");
                } else { console.error("[Analyze] Worker Casewise Diagnostics error:", results?.error); }
                casewiseDiagnosticsWorker.terminate();
            };
            casewiseDiagnosticsWorker.onerror = (e) => { console.error("[Analyze] Worker Casewise Diagnostics error:", e); casewiseDiagnosticsWorker.terminate(); };
        } else {
             console.warn("[Analyze] Skipping Casewise Diagnostics: Residuals not available when needed.");
        }
      } else {
        console.log("[Analyze] Skipping Casewise Diagnostics (not selected).");
      }

      // Covariance/Correlation Matrix
      if (currentStatsParams.covarianceMatrix) {
        const coefficientCorrelationsWorker = new Worker('/workers/Regression/coefficient_correlations.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficient Correlations/Covariance...");
        coefficientCorrelationsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData, // Check worker input
          calculateCovariance: currentStatsParams.covarianceMatrix
          // Worker needs to handle calculation based on flag
        });
        coefficientCorrelationsWorker.onmessage = async (e: MessageEvent) => {
          const correlationsResults = e.data;
           if (correlationsResults && !correlationsResults.error) {
              console.log("[Analyze] Hasil dari Worker Coefficient Correlations/Covariance:", correlationsResults);
              const correlationsStat = {
                // Title might differ based on whether cov or corr was calculated
                title: currentStatsParams.covarianceMatrix ? "Covariance Matrix" : "Coefficient Correlations",
                output_data: JSON.stringify(correlationsResults), // Adjust based on worker output
                components: currentStatsParams.covarianceMatrix ? "CovarianceMatrix" : "CoefficientCorrelations",
                description: currentStatsParams.covarianceMatrix ? "Covariance matrix of coefficients" : "Correlations between regression coefficients"
              };
              await addStatistic(analyticId, correlationsStat);
              console.log("[Analyze] Statistik Coefficient Correlations/Covariance disimpan.");
           } else {
               console.error("[Analyze] Worker Coefficient Correlations/Covariance error:", correlationsResults?.error);
           }
          coefficientCorrelationsWorker.terminate();
        };
        coefficientCorrelationsWorker.onerror = (error: ErrorEvent) => {
          console.error("[Analyze] Worker Coefficient Correlations/Covariance error:", error);
          coefficientCorrelationsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Coefficient Covariance/Correlation calculations (not selected).");
      }

      // TODO: Add calls for Plots tab options
      // TODO: Add calls for Save tab options (saving new variables to data store)

      // Close modal after initiating analysis (workers run in background)
      handleClose(); 

    } catch (error: unknown) {
      console.error('[Analyze] Failed to perform linear regression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to perform linear regression: ${errorMessage}`);
      // Optionally set an error state to display in the modal
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

        {/* Statistics Tab - Uncommented */}
        <TabsContent value="statistics">
          <Statistics params={statsParams} onChange={handleStatsChange} />
        </TabsContent>

        {/* Plots Tab - Uncommented */}
        <TabsContent value="plots">
          <PlotsLinear
            params={plotParams}
            onChange={handlePlotChange}
            availablePlotVariables={availablePlotVariables} />
        </TabsContent>

        {/* Save Tab - Uncommented */}
        <TabsContent value="save">
           <SaveLinear params={saveParams} onChange={handleSaveChange} />
        </TabsContent>

        {/* Options Tab - Uncommented */}
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