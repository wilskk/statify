// stores/useModalStore.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ModalType } from "@/types/modalTypes";
import { FindReplaceMode } from "@/components/Modals/Edit/FindReplace/types";
import { GoToMode } from "@/components/Modals/Edit/GoTo/types";

/**
 * ModalProps - Interface untuk props yang diteruskan ke modal
 * 
 * Object dinamis yang dapat menampung berbagai jenis props
 * yang dibutuhkan oleh komponen modal.
 */
export interface ModalProps {
  [key: string]: any;
}

// Legacy modal types that are now handled by other modals
const LEGACY_MODAL_MAPPINGS: Record<string, { type: ModalType, props?: ModalProps }> = {
  // Old Find modal now maps to FindAndReplace with Find tab
  "Find": { type: ModalType.FindAndReplace, props: { initialTab: FindReplaceMode.FIND } },
  // Old Replace modal now maps to FindAndReplace with Replace tab
  "Replace": { type: ModalType.FindAndReplace, props: { initialTab: FindReplaceMode.REPLACE } },
  // Old GoToCase modal now maps to GoTo with Case mode
  "GoToCase": { type: ModalType.GoTo, props: { initialMode: GoToMode.CASE } },
  // Old GoToVariable modal now maps to GoTo with Variable mode
  "GoToVariable": { type: ModalType.GoTo, props: { initialMode: GoToMode.VARIABLE } },
};

/**
 * ModalInstance - Representasi sebuah modal dalam store
 * 
 * Berisi informasi lengkap tentang satu instance modal,
 * termasuk tipe, props, dan ID unik.
 */
export interface ModalInstance {

export enum ModalType {
  Statistics = "Statistics",
  SaveLinear = "SaveLinear",
  OptionsLinear = "OptionsLinear",
  BootstrapLinear = "BootstrapLinear",
  PlotsLinear = "PlotsLinear",
  OpenFile = "openFile",
  SaveFile = "saveFile",
  ExportData = "exportData",
  ComputeVariable = "computeVariable",
  RecodeSameVariables = "recodeSameVariables",
  RecodeDifferentVariables = "recodeDifferentVariables",

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
  Autocorrelation = "autocorrelation", //Time Series Stationary Test
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
  ChiSquare = "chiSquare",
  Runs = "runs",
  TwoIndependentSamples = "twoIndependentSamples",
  KIndependentSamples = "kIndependentSamples",
  TwoRelatedSamples = "twoRelatedSamples",
  KRelatedSamples = "kRelatedSamples",

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
  props?: ModalProps;
  id: string; // ID unik untuk mengidentifikasi instance spesifik
}

/**
 * ModalStoreState - Interface untuk state dan aksi pada modal store
 */
interface ModalStoreState {
  // State
  modals: ModalInstance[];
  isStatisticProgress: boolean;
  
  // Aksi dasar
  openModal: (type: ModalType, props?: ModalProps) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  setStatisticProgress: (value: boolean) => void;
  
  // Aksi tambahan
  hasOpenModals: () => boolean;
  getTopModal: () => ModalInstance | undefined;
  isModalOpen: (type: ModalType) => boolean;
  closeModalsByType: (type: ModalType) => void;
  replaceModal: (type: ModalType, props?: ModalProps) => void;
}

/**
 * useModalStore - Store Zustand untuk manajemen modal
 * 
 * Menyediakan state terpusat dan aksi untuk mengelola
 * tampilan dan state modal di seluruh aplikasi.
 */
export const useModalStore = create<ModalStoreState>()(
  devtools((set, get) => ({
    // State
    modals: [],
    isStatisticProgress: false,
    
    // Aksi dasar
    openModal: (type, props) => {
      // Check if this is a legacy modal type that needs to be mapped
      const legacyMapping = LEGACY_MODAL_MAPPINGS[type];
      if (legacyMapping) {
        console.warn(`Modal type "${type}" is deprecated. Use "${legacyMapping.type}" instead.`);
        // Merge any provided props with the legacy mapping props
        const mergedProps = { ...legacyMapping.props, ...props };
        // Use the mapped type and merged props
        type = legacyMapping.type;
        props = mergedProps;
      }
      
      // Buat ID unik untuk instance modal ini
      const modalInstance: ModalInstance = { 
        type, 
        props,
        id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      set((state) => ({ modals: [...state.modals, modalInstance] }));
    },
    
    closeModal: (id) => {
      // Jika ID disediakan, tutup modal spesifik tersebut
      // Jika tidak, tutup modal teratas
      if (id) {
        set((state) => ({
          modals: state.modals.filter(modal => modal.id !== id)
        }));
      } else {
        set((state) => ({ modals: state.modals.slice(0, -1) }));
      }
    },
    
    closeAllModals: () => {
      set({ modals: [] });
    },
    
    setStatisticProgress: (value: boolean) => {
      set({ isStatisticProgress: value });
    },
    
    // Aksi tambahan
    hasOpenModals: () => {
      return get().modals.length > 0;
    },
    
    getTopModal: () => {
      const { modals } = get();
      return modals.length > 0 ? modals[modals.length - 1] : undefined;
    },
    
    isModalOpen: (type: ModalType) => {
      return get().modals.some(modal => modal.type === type);
    },
    
    closeModalsByType: (type: ModalType) => {
      set((state) => ({
        modals: state.modals.filter(modal => modal.type !== type)
      }));
    },
    
    replaceModal: (type: ModalType, props?: ModalProps) => {
      const { modals } = get();
      if (modals.length === 0) {
        get().openModal(type, props);
        return;
      }
      
      // Pertahankan ID yang sama untuk kontinuitas
      const currentId = modals[modals.length - 1].id;
      
      set((state) => ({
        modals: [
          ...state.modals.slice(0, -1), 
          { type, props, id: currentId }
        ]
      }));
    },
  }))
);
