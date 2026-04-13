import { Variable } from "@/types/Variable";

// Interface untuk opsi utama (pemilihan variabel)
export interface OrdinalOptions {
  dependent: Variable | null;
  factors: Variable[];
  covariates: Variable[];
}

// Interface untuk tab Location
export interface OrdinalLocationParams {
  locationModel: Variable[];
}

// Interface untuk tab Scale
export interface OrdinalScaleParams {
  scaleModel: Variable[];
}

// Interface untuk tab Options (sesuaikan dengan gambar OptionsTab.jpeg)
export interface OrdinalOptionsParams {
  maxIterations: number;
  maxStepHalving: number;
  logLikelihoodConvergence: number;
  parameterConvergence: number;
  confidenceInterval: number;
  delta: number;
  singularityTolerance: number;
  linkFunction: "Logit" | "Probit" | "Complementary Log-Log" | "Cauchit" | "Negative Log-Log";
}

// Interface untuk tab Output (sesuaikan dengan gambar OutputTab.jpeg)
export interface OrdinalOutputParams {
  display: {
    goodnessOfFit: boolean;
    summaryStatistics: boolean;
    parameterEstimates: boolean;
    asymptoticCorrelation: boolean;
    cellInformation: boolean;
    testOfParallelLines: boolean;
    iterationHistory: boolean;
    iterationHistoryStep: number;
  };
  savedVariables: {
    predictedCategory: boolean;
    predictedProbability: boolean; // Akan meminta input untuk kategori
    actualProbability: boolean; // Akan meminta input untuk kategori
  };
  printLogLikelihood: "Including" | "Excluding";

}

export interface AnalysisSection {
  id: string;
  title: string;
  data: any;
  description?: string;
  type: "table" | "text";
  note?: string;
}