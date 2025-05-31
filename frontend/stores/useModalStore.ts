// stores/useModalStore.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export enum ModalType {
        Statistics = 'Statistics',
        SaveLinear = 'SaveLinear',
        OptionsLinear = 'OptionsLinear',
        BootstrapLinear = 'BootstrapLinear',
        PlotsLinear = 'PlotsLinear',
  OpenFile = "openFile",
  SaveFile = "saveFile",
  ExportData = "exportData",
  ComputeVariable = "computeVariable",
  RecodeSameVariables = "recodeSameVariables",

  // Punya Nopal
  ModalAutomaticLinearModeling = "modalAutomaticLinearModeling",
  ModalLinear = "modalLinear",
  ModalCurveEstimation = "modalCurveEstimation",
  ModalPartialLeastSquares = "modalPartialLeastSquares",
  ModalBinaryLogistic = "modalBinaryLogistic",
  ModalMultinomialLogistic = "modalMultinomialLogistic",
  ModalOrdinal = "modalOrdinal",
  ModalProbit = "modalProbit",
  ModalNonlinear = "modalNonlinear",
  ModalWeightEstimation = "modalWeightEstimation",
  ModalTwoStageLeastSquares = "modalTwoStageLeastSquares",
  ModalQuantiles = "modalQuantiles",
  ModalOptimalScaling = "modalOptimalScaling",

  // General Linear Model
  Univariate = "univariate",
  Multivariate = "multivariate",
  RepeatedMeasures = "repeated-measures",
  RepeatedMeasuresDialog = "repeated-measures-dialog",
  VarianceComponents = "variance-components",

  // Dimension Reduction
  Factor = "factor",
  CorrespondenceAnalysis = "correspondence-analysis",
  OptimalScaling = "optimal-scaling",
  OptimalScalingCATPCA = "optimal-scaling-catpca",
  OptimalScalingMCA = "optimal-scaling-mca",
  OptimalScalingOVERALS = "optimal-scaling-overals",

  // Classify
  TwoStepCluster = "two-step-cluster",
  KMeansCluster = "k-means-cluster",
  HierarchicalCluster = "hierarchical-cluster",
  ClusterSilhouettes = "cluster-silhouettes",
  Tree = "tree",
  Discriminant = "discriminant",
  NearestNeighbor = "nearest-neighbor",
  ROCCurve = "roc-curve",
  ROCAnalysis = "roc-analysis",

  // Time Series
  Smoothing = "smoothing", //Time Series Smoothing
  Decomposition = "decomposition", //Time Series Decomposition
  Autocorrelation = 'autocorrelation', //Time Series Stationary Test
  UnitRootTest = "unitRootTest", //Time Series Stationary Test
  BoxJenkinsModel = "BoxJenkinsModel", //Time Series Create Model
  FrequenciesStatistic = "frequenciesStatistic",
  DescriptiveStatistic = "descriptiveStatistic",
  StatisticsSettingsModal = "statisticsSettingsModal",
  ChartSettingsModal = "chartSettingsModal",

  // File
  NewFile = "newFile",
  OpenData = "openData",
  OpenOutput = "openOutput",
  ImportExcel = "importExcel",
  ImportCSV = "importCSV",
  ExportDatabase = "exportDatabase",
  ExportExcel = "exportExcel",
  ExportCSV = "exportCSV",
  PrintPreview = "printPreview",
  Print = "print",
  Exit = "exit",

  // Edit
  Find = "find",
  Replace = "replace",
  GoToCase = "goToCase",
  GoToVariable = "goToVariable",

  // Data
  DefineVarProps = "defineVarProps",
  VarPropsEditor = "varPropsEditor",

  MeasureUnknown = "measureUnknown",
  CopyDataProps = "copyDataProps",
  NewCustomAttr = "newCustomAttr",
  DefineDateTime = "defineDateTime",
  MultipleResponse = "multipleResponse",
  Validate = "validate",
  DuplicateCases = "duplicateCases",
  UnusualCases = "unusualCases",
  CompareDatasets = "compareDatasets",
  SortCases = "sortCases",
  SortVars = "sortVars",
  Transpose = "transpose",
  MergeFiles = "mergeFiles",
  Restructure = "restructure",
  Aggregate = "aggregate",
  OrthogonalDesign = "orthogonalDesign",
  CopyDataset = "copyDataset",
  SplitFile = "splitFile",
  SelectCases = "selectCases",
  WeightCases = "weightCases",


  // Descriptive
  Frequencies = "frequencies",
  Descriptive = "descriptive",
  Explore = "explore",
  Crosstabs = "crosstabs",
  Ratio = "ratio",
  QQPlots = "qqPlots",
  ReadCSVFile = "readCSVFile",
  ReadExcelFile = "ReadExcelFile",

  // Compare Means
  OneSampleTTest = "oneSampleTTest",
  IndependentSamplesTTest = "independentSamplesTTest",
  PairedSamplesTTest = "pairedSamplesTTest",

  // Nonparametric Test
  ChiSquare = 'chiSquare',
  Runs = 'runs',
  TwoIndependentSamples = 'twoIndependentSamples',
  KIndependentSamples = 'kIndependentSamples',
  TwoRelatedSamples = 'twoRelatedSamples',
  KRelatedSamples = 'kRelatedSamples',

  //Chart Builder
  ChartBuilderModal = "chartBuilderModal",
  SimpleBarModal = "simpleBarModal",
  SetMeasurementLevel = "setMeasurementLevel",
  DefineValidationRules = "defineValidationRules",
  PPPlots = "ppPlots",
  ExampleDataset = "exampleDataset",
}

interface ModalInstance {
  type: ModalType;
  props?: any;
}

interface ModalStoreState {
  modals: ModalInstance[];
  isStatisticProgress: boolean;
  openModal: (type: ModalType, props?: any) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  setStatisticProgress: (value: boolean) => void;
}

export const useModalStore = create<ModalStoreState>()(
    devtools((set, get) => ({
      modals: [],
      isStatisticProgress: false,
      openModal: (type, props) => {
        console.log('openModal', type, props);
        set((state) => ({ modals: [...state.modals, { type, props }] }));
      },
      closeModal: () => {
        set((state) => ({ modals: state.modals.slice(0, -1) }));
      },
      closeAllModals: () => {
        set({ modals: [] });
      },
      setStatisticProgress: (value: boolean) =>
          set({ isStatisticProgress: value }),
    }))
);

