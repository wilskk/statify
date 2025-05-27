import React, { lazy, Suspense } from 'react';
import { ModalType, BaseModalProps, ModalCategory } from '@/types/modalTypes';

// Import file modals - penting untuk UI dan sering digunakan
import ImportCsv from '@/components/Modals/File/ImportCsv';
import ImportExcelModal from '@/components/Modals/File/ImportExcel';
import OpenSavFileModal from '@/components/Modals/File/OpenSavFile';
import PrintModal from '@/components/Modals/File/Print';
import ExportCsv from '@/components/Modals/File/ExportCsv';
import ExportExcelModal from '@/components/Modals/File/ExportExcel';

// Import edit modals
import { FindAndReplaceModal, GoToModal } from '@/components/Modals/Edit';

// Lazy load transform modals
const ComputeVariableModal = lazy(() => import('@/components/Modals/Transform/ComputeVariableModal'));
const RecodeSameVariablesModal = lazy(() => import('@/components/Modals/Transform/recodeSameVariables'));

// Lazy load regression modals - komponen yang jarang digunakan dan mungkin besar
const ModalAutomaticLinearModeling = lazy(() => import('@/components/Modals/Regression/AutomaticLinearModeling/ModalAutomaticLinearModeling'));
const ModalLinear = lazy(() => import('@/components/Modals/Regression/Linear/ModalLinear'));
const Statistics = lazy(() => import('@/components/Modals/Regression/Linear/Statistics'));
const SaveLinear = lazy(() => import('@/components/Modals/Regression/Linear/SaveLinear'));
const OptionsLinear = lazy(() => import('@/components/Modals/Regression/Linear/OptionsLinear'));
const PlotsLinear = lazy(() => import('@/components/Modals/Regression/Linear/PlotsLinear'));
const ModalCurveEstimation = lazy(() => import('@/components/Modals/Regression/CurveEstimation/ModalCurveEstimation'));
const ModalPartialLeastSquares = lazy(() => import('@/components/Modals/Regression/PartialLeastSquares/ModalPartialLeastSquares'));
const ModalBinaryLogistic = lazy(() => import('@/components/Modals/Regression/BinaryLogistic/ModalBinaryLogistic'));
const ModalMultinomialLogistic = lazy(() => import('@/components/Modals/Regression/MultinomialLogistic/ModalMultinomialLogistic'));
const ModalOrdinal = lazy(() => import('@/components/Modals/Regression/Ordinal/ModalOrdinal'));
const ModalProbit = lazy(() => import('@/components/Modals/Regression/Probit/ModalProbit'));
const ModalNonlinear = lazy(() => import('@/components/Modals/Regression/Nonlinear/ModalNonlinear'));
const ModalTwoStageLeastSquares = lazy(() => import('@/components/Modals/Regression/TwoStageLeastSquares/ModalTwoStageLeastSquares'));
const ModalWeightEstimation = lazy(() => import('@/components/Modals/Regression/WeightEstimation/ModalWeightEstimation'));
const ModalQuantiles = lazy(() => import('@/components/Modals/Regression/Quantiles/ModalQuantiles'));
const ModalOptimalScaling = lazy(() => import('@/components/Modals/Regression/OptimalScaling/ModalOptimalScaling'));

// Lazy load chart modals
const SimpleBarModal = lazy(() => import('@/components/Modals/Graphs/LegacyDialogs/BarModal/SimpleBarModal'));
const ChartBuilderModal = lazy(() => import('@/components/Modals/Graphs/ChartBuilder/ChartBuilderModal'));

// Lazy load time series modals
const SmoothingModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/SmoothingModal'));
const DecompositionModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/DecompositionModal'));
const AutocorrelationModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/AutocorrelationModal'));
const UnitRootTestModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/UnitRootTestModal'));
const BoxJenkinsModelModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/BoxJenkinsModelModal'));

/**
 * Komponen LoadingModal - Ditampilkan selama komponen modal sedang dimuat
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
  <div className="p-6 text-center">
    <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" />
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
);

/**
 * Tipe registry komponen modal
 * 
 * Memetakan setiap ModalType ke komponen React yang sesuai
 */
type ModalComponentRegistry = {
  [key in ModalType]?: React.ComponentType<BaseModalProps>;
};

/**
 * withSuspense - HOC untuk membungkus komponen lazy-loaded dengan Suspense
 * 
 * @param Component - Komponen yang di-lazy load
 * @returns Komponen yang dibungkus dengan Suspense
 */
function withSuspense(Component: React.ComponentType<BaseModalProps>): React.ComponentType<BaseModalProps> {
  return (props: BaseModalProps) => (
    <Suspense fallback={<LoadingModal onClose={props.onClose} />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * MODAL_COMPONENTS - Registry utama semua komponen modal
 * 
 * Ini adalah registry terpusat yang memetakan setiap ModalType ke komponen React spesifik.
 * Ketika menambahkan modal baru, cukup mendaftarkannya disini.
 * 
 * Note: Menggunakan 'as' type assertion untuk mengatasi perbedaan props
 * karena BaseModalProps sudah memiliki semua props yang diperlukan sebagai optional.
 */
export const MODAL_COMPONENTS: ModalComponentRegistry = {
  // File modals - eager loaded untuk performa
  [ModalType.ImportCSV]: ImportCsv as React.ComponentType<BaseModalProps>,
  [ModalType.ImportExcel]: ImportExcelModal as React.ComponentType<BaseModalProps>,
  [ModalType.OpenData]: OpenSavFileModal as React.ComponentType<BaseModalProps>,
  [ModalType.Print]: PrintModal as React.ComponentType<BaseModalProps>,
  [ModalType.ExportCSV]: ExportCsv as React.ComponentType<BaseModalProps>,
  [ModalType.ExportExcel]: ExportExcelModal as React.ComponentType<BaseModalProps>,
  
  // Edit modals
  [ModalType.Find]: FindAndReplaceModal as React.ComponentType<BaseModalProps>,
  [ModalType.Replace]: FindAndReplaceModal as React.ComponentType<BaseModalProps>,
  [ModalType.GoToCase]: GoToModal as React.ComponentType<BaseModalProps>,
  [ModalType.GoToVariable]: GoToModal as React.ComponentType<BaseModalProps>,
  
  // Transform modals - lazy loaded
  [ModalType.ComputeVariable]: withSuspense(ComputeVariableModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.RecodeSameVariables]: withSuspense(RecodeSameVariablesModal as any) as React.ComponentType<BaseModalProps>,
  
  // Regression modals - lazy loaded
  [ModalType.ModalAutomaticLinearModeling]: withSuspense(ModalAutomaticLinearModeling as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalLinear]: withSuspense(ModalLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Statistics]: withSuspense(Statistics as any) as React.ComponentType<BaseModalProps>,
  [ModalType.SaveLinear]: withSuspense(SaveLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.OptionsLinear]: withSuspense(OptionsLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.PlotsLinear]: withSuspense(PlotsLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalCurveEstimation]: withSuspense(ModalCurveEstimation as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalPartialLeastSquares]: withSuspense(ModalPartialLeastSquares as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalBinaryLogistic]: withSuspense(ModalBinaryLogistic as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalMultinomialLogistic]: withSuspense(ModalMultinomialLogistic as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalOrdinal]: withSuspense(ModalOrdinal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalProbit]: withSuspense(ModalProbit as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalNonlinear]: withSuspense(ModalNonlinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalWeightEstimation]: withSuspense(ModalWeightEstimation as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalTwoStageLeastSquares]: withSuspense(ModalTwoStageLeastSquares as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalQuantiles]: withSuspense(ModalQuantiles as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalOptimalScaling]: withSuspense(ModalOptimalScaling as any) as React.ComponentType<BaseModalProps>,
  
  // Chart modals - lazy loaded
  [ModalType.ChartBuilderModal]: withSuspense(ChartBuilderModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.SimpleBarModal]: withSuspense(SimpleBarModal as any) as React.ComponentType<BaseModalProps>,
  
  // Time series modals - lazy loaded
  [ModalType.Smoothing]: withSuspense(SmoothingModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Decomposition]: withSuspense(DecompositionModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Autocorrelation]: withSuspense(AutocorrelationModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.UnitRootTest]: withSuspense(UnitRootTestModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.BoxJenkinsModel]: withSuspense(BoxJenkinsModelModal as any) as React.ComponentType<BaseModalProps>,
};

/**
 * getModalComponent - Fungsi untuk mendapatkan komponen modal berdasarkan tipe
 * 
 * @param type - Tipe modal yang diinginkan
 * @returns Komponen React untuk tipe modal tersebut, atau null jika tidak ditemukan
 */
export function getModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No component registered for modal type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * MODAL_CONTAINER_PREFERENCES - Preferensi container untuk modal tertentu
 * 
 * Beberapa modal mungkin lebih cocok ditampilkan dalam format tertentu.
 * Misalnya, modal kompleks seperti ChartBuilder lebih baik selalu dialog.
 * 
 * Opsi "auto" akan menggunakan sidebar di desktop dan dialog di mobile.
 */
export const MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar" | "auto">> = {
  // Chart modals yang kompleks selalu sebagai dialog
  [ModalType.ChartBuilderModal]: "dialog",
  [ModalType.SimpleBarModal]: "dialog",
  
  // Modal File yang lebih baik sebagai dialog untuk UI konsisten
  [ModalType.ImportExcel]: "auto",
  [ModalType.ImportCSV]: "auto",
  [ModalType.Print]: "auto",
  [ModalType.ExportExcel]: "auto",
  [ModalType.ExportCSV]: "auto",
  
  // Edit modals yang lebih baik sebagai dialog
  [ModalType.Find]: "sidebar",
  [ModalType.Replace]: "sidebar",
  [ModalType.GoToCase]: "sidebar",
  [ModalType.GoToVariable]: "sidebar",
  
  // Modal dengan form panjang lebih baik sebagai sidebar
  [ModalType.ModalLinear]: "sidebar",
  [ModalType.ModalCurveEstimation]: "sidebar",
  [ModalType.ModalBinaryLogistic]: "sidebar",
};

/**
 * getModalContainerType - Fungsi untuk menentukan jenis container yang sesuai
 * 
 * @param type - Tipe modal
 * @param fallback - Jenis container default jika tidak ada preferensi
 * @param isMobile - Flag untuk menandakan apakah pengguna menggunakan perangkat mobile
 * @returns Jenis container yang sesuai ("dialog" atau "sidebar")
 */
export function getModalContainerType(
  type: ModalType,
  fallback: "dialog" | "sidebar" = "dialog",
  isMobile: boolean = false
): "dialog" | "sidebar" {
  // Mobile devices always use dialog
  if (isMobile) {
    return "dialog";
  }
  
  // Check for modal-specific preference
  const preference = MODAL_CONTAINER_PREFERENCES[type];
  
  // If no preference is defined, use the fallback
  if (!preference) {
    return fallback;
  }
  
  // Handle auto preference based on device type
  if (preference === "auto") {
    return "sidebar"; // Auto on desktop means sidebar
  }
  
  // Return the explicit preference
  return preference;
} 