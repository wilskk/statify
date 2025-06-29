import React, { lazy, Suspense } from 'react';
import { ModalType, BaseModalProps, ModalCategory } from '@/types/modalTypes';

// Import modal registries
import { FILE_MODAL_COMPONENTS, FILE_MODAL_CONTAINER_PREFERENCES } from '@/components/Modals/File/';
import { DATA_MODAL_COMPONENTS, DATA_MODAL_CONTAINER_PREFERENCES } from '@/components/Modals/Data/';
import { ANALYZE_MODAL_COMPONENTS, ANALYZE_MODAL_CONTAINER_PREFERENCES } from '@/components/Modals/Analyze';
import { EDIT_MODAL_COMPONENTS, EDIT_MODAL_CONTAINER_PREFERENCES } from '@/components/Modals/Edit/';
import { TIME_SERIES_MODAL_COMPONENTS, TIME_SERIES_MODAL_CONTAINER_PREFERENCES } from '@/components/Modals/Analyze/TimeSeries';
import { TRANSFORM_MODAL_COMPONENTS, TRANSFORM_MODAL_CONTAINER_PREFERENCES } from '@/components/Modals/Transform';

// Lazy load regression modals - komponen yang jarang digunakan dan mungkin besar
const ModalLinear = lazy(() => import('@/components/Modals/Regression/Linear/ModalLinear'));
const Statistics = lazy(() => import('@/components/Modals/Regression/Linear/Statistics'));
const SaveLinear = lazy(() => import('@/components/Modals/Regression/Linear/SaveLinear'));
const OptionsLinear = lazy(() => import('@/components/Modals/Regression/Linear/OptionsLinear'));
const PlotsLinear = lazy(() => import('@/components/Modals/Regression/Linear/PlotsLinear'));
const ModalCurveEstimation = lazy(() => import('@/components/Modals/Regression/CurveEstimation/ModalCurveEstimation'));

// Lazy load chart modals
const SimpleBarModal = lazy(() => import('@/components/Modals/Graphs/LegacyDialogs/BarModal/SimpleBarModal'));
const ChartBuilderModal = lazy(() => import('@/components/Modals/Graphs/ChartBuilder/ChartBuilderModal'));

// Lazy load time series modals
const SmoothingModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/Smoothing'));
const DecompositionModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/Decomposition'));
const AutocorrelationModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/Autocorrelation'));
const UnitRootTestModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/UnitRootTest'));
const BoxJenkinsModelModal = lazy(() => import('@/components/Modals/Analyze/TimeSeries/BoxJenkinsModel'));

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
  const WrappedComponent = (props: BaseModalProps) => (
    <Suspense fallback={<LoadingModal onClose={props.onClose} />}>
      <Component {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
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
  // File modals - from dedicated registry
  ...FILE_MODAL_COMPONENTS,
  
  // Edit modals - from dedicated registry
  ...EDIT_MODAL_COMPONENTS,
  
  // Data modals - from dedicated registry
  ...DATA_MODAL_COMPONENTS,
  
  // Analyze modals - from dedicated registry
  ...ANALYZE_MODAL_COMPONENTS,
  
  // Time series modals - from dedicated registry
  ...TIME_SERIES_MODAL_COMPONENTS,
  
  // Transform modals - lazy loaded
  // [ModalType.ComputeVariable]: withSuspense(ComputeVariableModal as any) as React.ComponentType<BaseModalProps>,
  // [ModalType.RecodeSameVariables]: withSuspense(RecodeSameVariablesModal as any) as React.ComponentType<BaseModalProps>,
  
  // Regression modals - lazy loaded
  [ModalType.ModalLinear]: withSuspense(ModalLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Statistics]: withSuspense(Statistics as any) as React.ComponentType<BaseModalProps>,
  [ModalType.SaveLinear]: withSuspense(SaveLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.OptionsLinear]: withSuspense(OptionsLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.PlotsLinear]: withSuspense(PlotsLinear as any) as React.ComponentType<BaseModalProps>,
  [ModalType.ModalCurveEstimation]: withSuspense(ModalCurveEstimation as any) as React.ComponentType<BaseModalProps>,
  
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
 */
export const MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  // Data modals - from dedicated preferences
  ...DATA_MODAL_CONTAINER_PREFERENCES,
  
  // File modals - from dedicated preferences
  ...FILE_MODAL_CONTAINER_PREFERENCES,
  
  // Edit modals - from dedicated preferences
  ...EDIT_MODAL_CONTAINER_PREFERENCES,
  
  // Analyze modals - from dedicated preferences
  ...ANALYZE_MODAL_CONTAINER_PREFERENCES,
  
  // Time series modals - from dedicated preferences
  ...TIME_SERIES_MODAL_CONTAINER_PREFERENCES,
  
  // Transform modals - from dedicated preferences
  ...TRANSFORM_MODAL_CONTAINER_PREFERENCES,
  
  // Chart modals yang kompleks selalu sebagai dialog
  [ModalType.ChartBuilderModal]: "dialog",
  [ModalType.SimpleBarModal]: "sidebar",
  
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
  
  // Return the explicit preference
  return preference;
} 