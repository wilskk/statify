import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVariableStore, VariableRow } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, ArrowRight } from 'lucide-react';
import { useLinear } from '@/hooks/useLinear';
import { Statistics } from '@/components/Modals/Regression/Linear/Statistics';
import {ModalType} from "@/stores/useModalStore";
import {useModal} from "@/hooks/useModal";
import { SaveLinearParams } from './SaveLinear';
import { StatisticsParams } from './Statistics';

interface Variable {
  name: string;
  type: 'numeric' | 'categorical';
  columnIndex: number;
}

interface ModalLinearProps {
  onClose: () => void;
}

const ModalLinear: React.FC<ModalLinearProps> = ({ onClose }) => {
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable[]>([]);
  const [selectedSelectionVariable, setSelectedSelectionVariable] = useState<Variable | null>(null);
  const [selectedCaseLabelsVariable, setSelectedCaseLabelsVariable] = useState<Variable | null>(null);
  const [selectedWLSWeightVariable, setSelectedWLSWeightVariable] = useState<Variable | null>(null);
  const [highlightedVariable, setHighlightedVariable] = useState<Variable | null>(null);
  const [method, setMethod] = useState<string>('Enter');
  const [saveParams, setSaveParams] = useState<SaveLinearParams | null>(null);
  const { openModal } = useModal();

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

  const [statsParams, setStatsParams] = useState<StatisticsParams | null>(defaultStatsParams);

  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const handleStatisticsSubmit = (params: StatisticsParams) => {
    localStorage.setItem('temp_stats_params', JSON.stringify(params));
    setStatsParams(params);
    console.log("Statistics parameters received:", params);
  };
  const variables = useVariableStore((state) => state.variables);
  const data = useDataStore((state) => state.data);

  const { calculateLinearRegression } = useLinear();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  useEffect(() => {
    const availableVars: Variable[] = variables
      .filter(v => v.name)
      .map((v) => ({
        name: v.name,
        type: v.type as 'numeric' | 'categorical',
        columnIndex: v.columnIndex,
      }));
    setAvailableVariables(availableVars);
  }, [variables]);

  const handleReset = () => {
    localStorage.removeItem('temp_stats_params');
    setStatsParams(defaultStatsParams);

    if (selectedDependentVariable) {
      setAvailableVariables(prev => [...prev, selectedDependentVariable]);
    }

    if (selectedIndependentVariables.length > 0) {
      setAvailableVariables(prev => [...prev, ...selectedIndependentVariables]);
    }

    if (selectedSelectionVariable) {
      setAvailableVariables(prev => [...prev, selectedSelectionVariable]);
    }

    if (selectedCaseLabelsVariable) {
      setAvailableVariables(prev => [...prev, selectedCaseLabelsVariable]);
    }

    if (selectedWLSWeightVariable) {
      setAvailableVariables(prev => [...prev, selectedWLSWeightVariable]);
    }

    setSelectedDependentVariable(null);
    setSelectedIndependentVariables([]);
    setSelectedSelectionVariable(null);
    setSelectedCaseLabelsVariable(null);
    setSelectedWLSWeightVariable(null);
    setHighlightedVariable(null);
    setMethod('Enter');

    console.log("Reset button clicked - All selections returned to available variables");
  };

  const handleSelectAvailableVariable = (variable: Variable) => {
    setHighlightedVariable(variable);
  };

  const handleMoveToDependent = () => {
    if (highlightedVariable && availableVariables.includes(highlightedVariable)) {
      if (selectedDependentVariable) {
        setAvailableVariables((prev) => [...prev, selectedDependentVariable]);
      }
      setSelectedDependentVariable(highlightedVariable);
      setAvailableVariables((prev) => prev.filter((item) => item !== highlightedVariable));
      setHighlightedVariable(null);
    }
  };

  const handleMoveToIndependent = () => {
    if (highlightedVariable && availableVariables.includes(highlightedVariable)) {
      setSelectedIndependentVariables((prev) => [...prev, highlightedVariable]);
      setAvailableVariables((prev) => prev.filter((item) => item !== highlightedVariable));
      setHighlightedVariable(null);
    }
  };

  const handleRemoveFromDependent = () => {
    if (selectedDependentVariable) {
      setAvailableVariables((prev) => [...prev, selectedDependentVariable]);
      setSelectedDependentVariable(null);
    }
  };

  const handleRemoveFromIndependent = (variable: Variable) => {
    setAvailableVariables((prev) => [...prev, variable]);
    setSelectedIndependentVariables((prev) => prev.filter((item) => item !== variable));
  };

  const handleRemoveFromSelectionVariable = () => {
    if (selectedSelectionVariable) {
      setAvailableVariables((prev) => [...prev, selectedSelectionVariable]);
      setSelectedSelectionVariable(null);
    }
  };

  const handleRemoveFromCaseLabelsVariable = () => {
    if (selectedCaseLabelsVariable) {
      setAvailableVariables((prev) => [...prev, selectedCaseLabelsVariable]);
      setSelectedCaseLabelsVariable(null);
    }
  };

  const handleRemoveFromWLSWeightVariable = () => {
    if (selectedWLSWeightVariable) {
      setAvailableVariables((prev) => [...prev, selectedWLSWeightVariable]);
      setSelectedWLSWeightVariable(null);
    }
  };

  const handleMoveToSelectionVariable = () => {
    if (highlightedVariable && availableVariables.includes(highlightedVariable)) {
      if (selectedSelectionVariable) {
        setAvailableVariables((prev) => [...prev, selectedSelectionVariable]);
      }
      setSelectedSelectionVariable(highlightedVariable);
      setAvailableVariables((prev) => prev.filter((item) => item !== highlightedVariable));
      setHighlightedVariable(null);
    }
  };

  const handleMoveToCaseLabelsVariable = () => {
    if (highlightedVariable && availableVariables.includes(highlightedVariable)) {
      if (selectedCaseLabelsVariable) {
        setAvailableVariables((prev) => [...prev, selectedCaseLabelsVariable]);
      }
      setSelectedCaseLabelsVariable(highlightedVariable);
      setAvailableVariables((prev) => prev.filter((item) => item !== highlightedVariable));
      setHighlightedVariable(null);
    }
  };

  const handleMoveToWLSWeightVariable = () => {
    if (highlightedVariable && availableVariables.includes(highlightedVariable)) {
      if (selectedWLSWeightVariable) {
        setAvailableVariables((prev) => [...prev, selectedWLSWeightVariable]);
      }
      setSelectedWLSWeightVariable(highlightedVariable);
      setAvailableVariables((prev) => prev.filter((item) => item !== highlightedVariable));
      setHighlightedVariable(null);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleAnalyze = async () => {
    try {
      const dependentVarName = selectedDependentVariable?.name;
      const independentVarNames = selectedIndependentVariables.map(v => v.name);
  
      if (!dependentVarName || independentVarNames.length === 0) {
        alert('Please select a dependent variable and at least one independent variable.');
        return;
      }
  
      const storedParams = localStorage.getItem('temp_stats_params');
      const retrievedStatsParams = storedParams
          ? JSON.parse(storedParams)
          : defaultStatsParams;
  
      console.log("[Analyze] Using statistics parameters:", retrievedStatsParams);
  
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
  
      const allVariables = variables;
      const dataRows = data;
  
      const dependentVar = allVariables.find(v => v.name === dependentVarName);
      const independentVars = independentVarNames
        .map(name => allVariables.find(v => v.name === name))
        .filter(v => v);
  
      const dependentVarIndex = dependentVar?.columnIndex;
      const independentVarIndices = independentVars.map(v => v.columnIndex);
  
      if (dependentVarIndex === undefined || independentVarIndices.includes(undefined)) {
        throw new Error('Variable indices not found.');
      }
  
      const depVarIndex = dependentVarIndex;
      const indepVarIndices = independentVarIndices;
  
      const dependentData = dataRows.map(row => parseFloat(row[depVarIndex]));
      const independentData = indepVarIndices.map(index => dataRows.map(row => parseFloat(row[index])));
      console.log("[Analyze] Data awal - Dependent:", dependentData);
      console.log("[Analyze] Data awal - Independent (per variable):", independentData);
  
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
  
      const independentDataTransposed = filteredIndependentData[0].map((_, idx) =>
        filteredIndependentData.map(indepData => indepData[idx])
      );
  
      const regressionResults = calculateLinearRegression(filteredDependentData, independentDataTransposed);
      console.log("[Analyze] Hasil regresi (calculateLinearRegression):", regressionResults);

      const variablesEnteredRemovedWorker = new Worker('/workers/Regression/variables.js');
      console.log("[Analyze] Mengirim data ke Worker untuk Variables Entered/Removed...");
      variablesEnteredRemovedWorker.postMessage({
        dependent: filteredDependentData,
        independent: filteredIndependentData,
        dependentName: dependentVarName,
        independentNames: independentVarNames
      });

      variablesEnteredRemovedWorker.onmessage = async (e) => {
        const variablesEnteredRemovedResults = e.data;
        console.log("[Analyze] Hasil dari Worker Variables Entered/Removed:", variablesEnteredRemovedResults);

        const variablesEnteredRemovedStat = {
          title: "Variables Entered/Removed",
          output_data: JSON.stringify(variablesEnteredRemovedResults),
          output_type: "table",
          components: "VariablesEnteredRemoved",
        };

        await addStatistic(analyticId, variablesEnteredRemovedStat);
        console.log("[Analyze] Statistik Variables Entered/Removed disimpan.");
        variablesEnteredRemovedWorker.terminate();
      };

      variablesEnteredRemovedWorker.onerror = (error) => {
        console.error("[Analyze] Worker Variables Entered/Removed error:", error);
        variablesEnteredRemovedWorker.terminate();
      };

      const anovaWorker = new Worker('/workers/Regression/anovaWorker.js');
      console.log("[Analyze] Sending data to ANOVA Worker...");
      anovaWorker.postMessage({
        dependentData: filteredDependentData,
        independentData: filteredIndependentData
      });

      anovaWorker.onmessage = async (e) => {
        const anovaStat = e.data;
        if (anovaStat.error) {
          console.error("[Analyze] ANOVA Worker Error:", anovaStat.error);
          alert(`ANOVA Worker Error: ${anovaStat.error}`);
        } else {
          const completeStats = {
            title: anovaStat.title,
            output_data: anovaStat.output_data,
            output_type: anovaStat.output_type,
            components: anovaStat.components,
          };
          await addStatistic(analyticId, completeStats);
          console.log("[Analyze] ANOVA statistics saved.");
        }
        anovaWorker.terminate();
      };

      anovaWorker.onerror = (error) => {
        console.error("[Analyze] ANOVA Worker error:", error, error.message);
        alert("An error occurred in the ANOVA Worker: " + (error.message || "Unknown error"));
        anovaWorker.terminate();
      };

      const coefficientsWorker = new Worker('/workers/Regression/coefficients.js');
      console.log("[Analyze] Sending data to Coefficients Worker...");

      coefficientsWorker.postMessage({
        dependentData: filteredDependentData,
        independentData: filteredIndependentData,
        independentVarNames: independentVarNames
      });

      coefficientsWorker.onmessage = async (e) => {
        const { success, result, error } = e.data;

        if (success) {
          const coefficientsTable = result;
          const coefficientsStat = {
            title: "Coefficients",
            output_data: JSON.stringify(coefficientsTable),
            output_type: "table",
            components: "Coefficients",
          };

          await addStatistic(analyticId, coefficientsStat);
          console.log("[Analyze] Coefficients statistics saved.");
        } else {
          console.error("[Analyze] Coefficients Worker error:", error);
          alert(`Coefficients Worker Error: ${error}`);
        }

        coefficientsWorker.terminate();
      };

      coefficientsWorker.onerror = (error) => {
        console.error("[Analyze] Coefficients Worker error:", error, error.message);
        alert("An error occurred in the Coefficients Worker: " + (error.message || "Unknown error"));
        coefficientsWorker.terminate();
      };

      if (retrievedStatsParams.rSquaredChange) {
        const worker = new Worker('/workers/Regression/rsquare.js');
        console.log("[Analyze] Mengirim data ke Worker untuk perhitungan regresi (squared changes)...");
        worker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        worker.onmessage = async (e) => {
          const workerResults = e.data;
          console.log("[Analyze] Hasil dari Worker:", workerResults);
          const rSquareStat = {
            title: "Model Summary (R Square Change)",
            output_data: JSON.stringify(workerResults),
            output_type: "table",
            components: "RSquareChange",
          };
          await addStatistic(analyticId, rSquareStat);
          console.log("[Analyze] Statistik R Square Change disimpan.");
          
          worker.terminate();
        };
  
        worker.onerror = (error) => {
          console.error("[Analyze] Worker error:", error);
          worker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping R Square Change calculation (not selected).");
      }
  
      if (retrievedStatsParams.confidenceIntervals) {
        const confidenceWorker = new Worker('/workers/Regression/confidence_interval.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Confidence Interval...");
        confidenceWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        confidenceWorker.onmessage = async (e) => {
          const confidenceResults = e.data;
          console.log("[Analyze] Hasil Confidence Interval dari Worker:", confidenceResults);
          const confidenceStat = {
            title: "Confidence Interval",
            output_data: JSON.stringify(confidenceResults),
            output_type: "table",
            components: "ConfidenceInterval",
          };
          await addStatistic(analyticId, confidenceStat);
          console.log("[Analyze] Statistik Confidence Interval disimpan.");
          confidenceWorker.terminate();
        };
  
        confidenceWorker.onerror = (error) => {
          console.error("[Analyze] Worker Confidence Interval error:", error);
          confidenceWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Confidence Interval calculation (not selected).");
      }
  
      if (retrievedStatsParams.partAndPartial) {
        const partAndPartialWorker = new Worker('/workers/Regression/coefficients_partandpartial.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Part & Partial Correlations...");
        partAndPartialWorker.postMessage({
          dependent: filteredDependentData,
          independents: filteredIndependentData
        });
  
        partAndPartialWorker.onmessage = async (e) => {
          const partAndPartialResults = e.data;
          console.log("[Analyze] Hasil dari Worker Coefficients Part & Partial:", partAndPartialResults);
          const partAndPartialStat = {
            title: "Coefficients (Part & Partial Correlations)",
            output_data: JSON.stringify(partAndPartialResults),
            output_type: "table",
            components: "CoefficientsPartAndPartial",
          };
          await addStatistic(analyticId, partAndPartialStat);
          console.log("[Analyze] Statistik Coefficients Part & Partial disimpan.");
          partAndPartialWorker.terminate();
        };
  
        partAndPartialWorker.onerror = (error) => {
          console.error("[Analyze] Worker Coefficients Part & Partial error:", error);
          partAndPartialWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Part & Partial Correlations (not selected).");
      }
  
      if (retrievedStatsParams.collinearityDiagnostics) {
        const collinearityWorker = new Worker('/workers/Regression/coefficients_collinearity.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Collinearity...");
        collinearityWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        collinearityWorker.onmessage = async (e) => {
          const collinearityResults = e.data;
          console.log("[Analyze] Hasil dari Worker Coefficients Collinearity:", collinearityResults);
          const collinearityStat = {
            title: "Collinearity Diagnostics",
            output_data: JSON.stringify(collinearityResults),
            output_type: "table",
            components: "CollinearityStatistics",
          };
          await addStatistic(analyticId, collinearityStat);
          console.log("[Analyze] Statistik Collinearity Diagnostics disimpan.");
          collinearityWorker.terminate();
        };
  
        collinearityWorker.onerror = (error) => {
          console.error("[Analyze] Worker Coefficients Collinearity error:", error);
          collinearityWorker.terminate();
        };
        
        const collinearityDiagnosticsWorker = new Worker('/workers/Regression/collinearity_diagnostics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Collinearity Diagnostics...");
        collinearityDiagnosticsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        collinearityDiagnosticsWorker.onmessage = async (e) => {
          const collinearityDiagnosticsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Collinearity Diagnostics:", collinearityDiagnosticsResults);
          const collinearityDiagnosticsStat = {
            title: "Collinearity Diagnostics",
            output_data: JSON.stringify(collinearityDiagnosticsResults),
            output_type: "table",
            components: "CollinearityDiagnostics",
          };
          await addStatistic(analyticId, collinearityDiagnosticsStat);
          console.log("[Analyze] Statistik Collinearity Diagnostics disimpan.");
          collinearityDiagnosticsWorker.terminate();
        };
  
        collinearityDiagnosticsWorker.onerror = (error) => {
          console.error("[Analyze] Worker Collinearity Diagnostics error:", error);
          collinearityDiagnosticsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Collinearity Diagnostics (not selected).");
      }
  
      if (retrievedStatsParams.durbinWatson) {
        const modelDurbinWorker = new Worker('/workers/Regression/model_durbin.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Model Durbin...");
        modelDurbinWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        modelDurbinWorker.onmessage = async (e) => {
          const modelDurbinResults = e.data;
          console.log("[Analyze] Hasil dari Worker Model Durbin:", modelDurbinResults);
          const modelDurbinStat = {
            title: "Model Summary (Durbin-Watson)",
            output_data: JSON.stringify(modelDurbinResults),
            output_type: "table",
            components: "ModelDurbin",
          };
          await addStatistic(analyticId, modelDurbinStat);
          console.log("[Analyze] Statistik Model Durbin disimpan.");
          modelDurbinWorker.terminate();
        };
  
        modelDurbinWorker.onerror = (error) => {
          console.error("[Analyze] Worker Model Durbin error:", error);
          modelDurbinWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Durbin-Watson test (not selected).");
      }
  
      if (retrievedStatsParams.durbinWatson || retrievedStatsParams.casewiseDiagnostics) {
        const residualsStatisticsWorker = new Worker('/workers/Regression/residuals_statistics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Residuals Statistics...");
        residualsStatisticsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData[0]
        });
  
        residualsStatisticsWorker.onmessage = async (e) => {
          const residualsStatisticsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Residuals Statistics:", residualsStatisticsResults);
          const residualsStatisticsStat = {
            title: "Residuals Statistics",
            output_data: JSON.stringify(residualsStatisticsResults),
            output_type: "table",
            components: "ResidualsStatistics",
          };
          await addStatistic(analyticId, residualsStatisticsStat);
          console.log("[Analyze] Statistik Residuals Statistics disimpan.");
          residualsStatisticsWorker.terminate();
        };
  
        residualsStatisticsWorker.onerror = (error) => {
          console.error("[Analyze] Worker Residuals Statistics error:", error);
          residualsStatisticsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Residuals Statistics (no residual option selected).");
      }
  
      if (retrievedStatsParams.casewiseDiagnostics) {
        const casewiseDiagnosticsWorker = new Worker('/workers/Regression/casewise_diagnostics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Casewise Diagnostics...");
        casewiseDiagnosticsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData[0],
          threshold: parseFloat(retrievedStatsParams.outlierThreshold) || 3
        });
  
        casewiseDiagnosticsWorker.onmessage = async (e) => {
          const casewiseDiagnosticsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Casewise Diagnostics:", casewiseDiagnosticsResults);
          const casewiseDiagnosticsStat = {
            title: "Casewise Diagnostics",
            output_data: JSON.stringify(casewiseDiagnosticsResults),
            output_type: "table",
            components: "CasewiseDiagnostics",
          };
          await addStatistic(analyticId, casewiseDiagnosticsStat);
          console.log("[Analyze] Statistik Casewise Diagnostics disimpan.");
          casewiseDiagnosticsWorker.terminate();
        };
  
        casewiseDiagnosticsWorker.onerror = (error) => {
          console.error("[Analyze] Worker Casewise Diagnostics error:", error);
          casewiseDiagnosticsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Casewise Diagnostics (not selected).");
      }
  
      if (retrievedStatsParams.covarianceMatrix) {
        const coefficientCorrelationsWorker = new Worker('/workers/Regression/coefficient_correlations.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Coefficient Correlations...");
        coefficientCorrelationsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        coefficientCorrelationsWorker.onmessage = async (e) => {
          const correlationsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Coefficient Correlations:", correlationsResults);
          const correlationsStat = {
            title: "Coefficient Correlations",
            output_data: JSON.stringify(correlationsResults),
            output_type: "table",
            components: "CoefficientCorrelations",
          };
          await addStatistic(analyticId, correlationsStat);
          console.log("[Analyze] Statistik Coefficient Correlations disimpan.");
          coefficientCorrelationsWorker.terminate();
        };
  
        coefficientCorrelationsWorker.onerror = (error) => {
          console.error("[Analyze] Worker Coefficient Correlations error:", error);
          coefficientCorrelationsWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Correlation calculations (covariance matrix not selected).");
      }
  
      if (retrievedStatsParams.descriptives) {
        const descriptiveWorker = new Worker('/workers/Regression/descriptive_statistics.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Descriptive Statistics...");
        descriptiveWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        descriptiveWorker.onmessage = async (e) => {
          const descriptiveResults = e.data;
          console.log("[Analyze] Hasil Descriptive Statistics dari Worker:", descriptiveResults);
          const descriptiveStat = {
            title: "Descriptive Statistics",
            output_data: JSON.stringify(descriptiveResults),
            output_type: "table",
            components: "DescriptiveStatistics",
          };
          await addStatistic(analyticId, descriptiveStat);
          console.log("[Analyze] Statistik Descriptive Statistics disimpan.");
          descriptiveWorker.terminate();
        };
  
        descriptiveWorker.onerror = (error) => {
          console.error("[Analyze] Worker Descriptive Statistics error:", error);
          descriptiveWorker.terminate();
        };
        
        const correlationsWorker = new Worker('/workers/Regression/correlations.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Correlations...");
        correlationsWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        correlationsWorker.onmessage = async (e) => {
          const correlationsResults = e.data;
          console.log("[Analyze] Hasil dari Worker Correlations:", correlationsResults);
          const correlationsStat = {
            title: "Correlations",
            output_data: JSON.stringify(correlationsResults),
            output_type: "table",
            components: "Correlations",
          };
          await addStatistic(analyticId, correlationsStat);
          console.log("[Analyze] Statistik Correlations disimpan.");
          correlationsWorker.terminate();
        };
  
        correlationsWorker.onerror = (error) => {
          console.error("[Analyze] Worker Correlations error:", error);
          correlationsWorker.terminate();
        };
  
      } else {
        console.log("[Analyze] Skipping Descriptive Statistics (not selected).");
      }
  
      if (retrievedStatsParams.modelFit || retrievedStatsParams.descriptives) {
        const modelSummaryWorker = new Worker('/workers/Regression/model_summary.js');
        console.log("[Analyze] Mengirim data ke Worker untuk Model Summary...");
        modelSummaryWorker.postMessage({
          dependent: filteredDependentData,
          independent: filteredIndependentData
        });
  
        modelSummaryWorker.onmessage = async (e) => {
          const modelSummaryResults = e.data;
          console.log("[Analyze] Hasil dari Worker Model Summary:", modelSummaryResults);
          const modelSummaryStat = {
            title: "Model Summary",
            output_data: JSON.stringify(modelSummaryResults),
            output_type: "table",
            components: "ModelSummary",
          };
          await addStatistic(analyticId, modelSummaryStat);
          console.log("[Analyze] Statistik Model Summary disimpan.");
          modelSummaryWorker.terminate();
        };
  
        modelSummaryWorker.onerror = (error) => {
          console.error("[Analyze] Worker Model Summary error:", error);
          modelSummaryWorker.terminate();
        };
      } else {
        console.log("[Analyze] Skipping Model Summary (model fit not selected).");
      }

      onClose();
  
    } catch (error) {
      console.error('[Analyze] Failed to perform linear regression:', error);
      alert('Failed to perform linear regression. Please check your data and try again.');
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[900px]">
      <DialogHeader>
        <DialogTitle>Linear Regression</DialogTitle>
      </DialogHeader>

      <Separator className="my-0" />

      <div className="grid grid-cols-12 gap-4 py-4">
        <div className="col-span-3 border p-4 rounded-md max-h-[500px] overflow-y-auto">
          <label className="font-semibold">Variables</label>
          <ScrollArea className="mt-2 h-[450px]">
            {availableVariables.map((variable) => (
              <div
                key={variable.name}
                className={`flex items-center p-2 border cursor-pointer rounded-md hover:bg-gray-100 ${
                  highlightedVariable?.name === variable.name ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                }`}
                onClick={() => handleSelectAvailableVariable(variable)}
              >
                <Pencil className="h-5 w-5 mr-2 text-gray-600" />
                {variable.name}
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="col-span-6 space-y-4">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleMoveToDependent}
              disabled={!highlightedVariable || !availableVariables.includes(highlightedVariable)}
              className="mr-2 mt-6"
            >
              <ArrowRight />
            </Button>
            <div className="flex-1">
              <label className="font-semibold">Dependent Variable</label>
              <div
                className="mt-2 p-2 border rounded-md min-h-[50px] cursor-pointer"
                onClick={handleRemoveFromDependent}
              >
                {selectedDependentVariable ? (
                  <div className="flex items-center">
                    <Pencil className="h-5 w-5 mr-2 text-gray-600" />
                    {selectedDependentVariable.name}
                  </div>
                ) : (
                  <span className="text-gray-500">[None]</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleMoveToIndependent}
              disabled={!highlightedVariable || !availableVariables.includes(highlightedVariable)}
              className="mr-2 mt-6"
            >
              <ArrowRight />
            </Button>
            <div className="flex-1">
              <label className="font-semibold">Independent Variables</label>
              <div className="mt-2 p-2 border rounded-md min-h-[100px]">
                {selectedIndependentVariables.length > 0 ? (
                  selectedIndependentVariables.map((variable) => (
                    <div
                      key={variable.name}
                      className="flex items-center p-1 cursor-pointer hover:bg-gray-100 rounded-md"
                      onClick={() => handleRemoveFromIndependent(variable)}
                    >
                      <Pencil className="h-5 w-5 mr-2 text-gray-600" />
                      {variable.name}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">[None]</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-1 ml-[50%]">
              <label className="font-semibold">Method</label>
              <Select onValueChange={(value) => setMethod(value)} value={method}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select a method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enter">Enter</SelectItem>
                  <SelectItem value="Stepwise">Stepwise</SelectItem>
                  <SelectItem value="Forward">Forward</SelectItem>
                  <SelectItem value="Backward">Backward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleMoveToSelectionVariable}
              disabled={!highlightedVariable || !availableVariables.includes(highlightedVariable)}
              className="mr-2 mt-6"
            >
              <ArrowRight />
            </Button>
            <div className="flex-1">
              <label className="font-semibold">Selection Variable</label>
              <div
                className="mt-2 p-2 border rounded-md min-h-[50px] cursor-pointer"
                onClick={handleRemoveFromSelectionVariable}
              >
                {selectedSelectionVariable ? (
                  <div className="flex items-center">
                    <Pencil className="h-5 w-5 mr-2 text-gray-600" />
                    {selectedSelectionVariable.name}
                  </div>
                ) : (
                  <span className="text-gray-500">[None]</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleMoveToCaseLabelsVariable}
              disabled={!highlightedVariable || !availableVariables.includes(highlightedVariable)}
              className="mr-2 mt-6"
            >
              <ArrowRight />
            </Button>
            <div className="flex-1">
              <label className="font-semibold">Case Labels</label>
              <div
                className="mt-2 p-2 border rounded-md min-h-[50px] cursor-pointer"
                onClick={handleRemoveFromCaseLabelsVariable}
              >
                {selectedCaseLabelsVariable ? (
                  <div className="flex items-center">
                    <Pencil className="h-5 w-5 mr-2 text-gray-600" />
                    {selectedCaseLabelsVariable.name}
                  </div>
                ) : (
                  <span className="text-gray-500">[None]</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleMoveToWLSWeightVariable}
              disabled={!highlightedVariable || !availableVariables.includes(highlightedVariable)}
              className="mr-2 mt-6"
            >
              <ArrowRight />
            </Button>
            <div className="flex-1">
              <label className="font-semibold">WLS Weight</label>
              <div
                className="mt-2 p-2 border rounded-md min-h-[50px] cursor-pointer"
                onClick={handleRemoveFromWLSWeightVariable}
              >
                {selectedWLSWeightVariable ? (
                  <div className="flex items-center">
                    <Pencil className="h-5 w-5 mr-2 text-gray-600" />
                    {selectedWLSWeightVariable.name}
                  </div>
                ) : (
                  <span className="text-gray-500">[None]</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-4">
        <Button
          onClick={() => openModal(ModalType.Statistics, { onSubmit: handleStatisticsSubmit })}
          variant="outline"
          className="w-full"
        >
          Statistics...
        </Button>
          <Button onClick={() => openModal(ModalType.PlotsLinear)} variant="outline" className="w-full">
            Plots...
          </Button>
          <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                  openModal(ModalType.SaveLinear, {
                    onSave: (params: SaveLinearParams) => {
                      setSaveParams(params);
                      console.log(params);
                    },
                  })
              }
          >
            Save...
          </Button>
          <Button onClick={() => openModal(ModalType.OptionsLinear)} variant="outline" className="w-full">
            Options...
          </Button>
          <Button onClick={() => openModal(ModalType.BootstrapLinear)} variant="outline" className="w-full">
            Bootstrap...
          </Button>
        </div>
      </div>

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