// types/modalTypes.ts

import React from 'react';

/**
 * ModalType - Enum untuk semua tipe modal dalam aplikasi
 * 
 * Digunakan untuk:
 * 1. Mengidentifikasi modal secara unik
 * 2. Menjamin type-safety dalam kode
 * 3. Memudahkan autocomplete saat pengembangan
 */
export enum ModalType {
  // File modals - Operasi file seperti import, export, print
  ImportCSV = "ImportCSV",
  ReadCSVFile = "ReadCSVFile",
  ImportExcel = "ImportExcel",
  ReadExcelFile = "ReadExcelFile",
  OpenData = "OpenData",
  OpenOutput = "OpenOutput",
  PrintPreview = "PrintPreview",
  Print = "Print",
  ExportCSV = "ExportCSV",
  ExportExcel = "ExportExcel",
  Exit = "Exit",
  
  // Edit modals - Operasi pencarian dan navigasi
  Find = "Find",
  Replace = "Replace",
  GoToCase = "GoToCase", 
  GoToVariable = "GoToVariable",
  
  // Data modals - Operasi manipulasi dan pengaturan data
  DefineVarProps = "DefineVarProps",
  SortCases = "SortCases",
  SortVars = "SortVars",
  
  // Transform modals - Transformasi variabel dan data
  ComputeVariable = "ComputeVariable",
  RecodeSameVariables = "RecodeSameVariables",
  
  // Regression modals - Analisis regresi dan model terkait
  ModalAutomaticLinearModeling = "ModalAutomaticLinearModeling",
  ModalLinear = "ModalLinear",
  Statistics = "Statistics",
  SaveLinear = "SaveLinear",
  OptionsLinear = "OptionsLinear",
  PlotsLinear = "PlotsLinear",
  ModalCurveEstimation = "ModalCurveEstimation",
  ModalPartialLeastSquares = "ModalPartialLeastSquares",
  ModalBinaryLogistic = "ModalBinaryLogistic",
  ModalMultinomialLogistic = "ModalMultinomialLogistic",
  ModalOrdinal = "ModalOrdinal",
  ModalProbit = "ModalProbit",
  ModalNonlinear = "ModalNonlinear",
  ModalWeightEstimation = "ModalWeightEstimation",
  ModalTwoStageLeastSquares = "ModalTwoStageLeastSquares",
  ModalQuantiles = "ModalQuantiles",
  ModalOptimalScaling = "ModalOptimalScaling",
  
  // Chart modals - Pembuatan dan konfigurasi grafik
  ChartBuilderModal = "ChartBuilderModal",
  SimpleBarModal = "SimpleBarModal",
  
  // Time series modals - Analisis deret waktu
  Smoothing = "Smoothing",
  Decomposition = "Decomposition",
  Autocorrelation = "Autocorrelation",
  UnitRootTest = "UnitRootTest",
  BoxJenkinsModel = "BoxJenkinsModel",
}

/**
 * ModalCategory - Kategori untuk pengelompokan modal
 * 
 * Digunakan untuk mengorganisir modal berdasarkan fungsi
 * dan menempatkannya dalam menu yang sesuai.
 */
export enum ModalCategory {
  File = "File",
  Data = "Data",
  Edit = "Edit",
  Transform = "Transform",
  Analyze = "Analyze",
  Regression = "Regression",
  Graphs = "Graphs",
  TimeSeries = "TimeSeries",
}

/**
 * BaseModalProps - Interface dasar untuk props semua modal
 * 
 * Semua komponen modal harus menerima props ini.
 * Untuk mendukung fleksibilitas, beberapa props yang diperlukan oleh
 * komponen modal tertentu dibuat opsional dengan tanda tanya (?)
 */
export interface BaseModalProps {
  // Props wajib untuk semua modal
  onClose: () => void;
  containerType?: "dialog" | "sidebar" | "auto";
  
  // Container override untuk memaksa tipe container tertentu
  containerOverride?: "dialog" | "sidebar" | "auto";
  
  // Props opsional untuk modal tertentu
  isOpen?: boolean;                    // Untuk file modals
  params?: any;                        // Untuk regression modals
  onChange?: (params: any) => void;    // Untuk regression modals
  availablePlotVariables?: any[];      // Untuk PlotsLinear
  
  // Mendukung props tambahan lainnya
  [key: string]: any;
}

/**
 * ModalMetadata - Metadata untuk modal
 * 
 * Berisi informasi tambahan tentang modal yang dapat
 * digunakan untuk UI atau logika khusus.
 */
export interface ModalMetadata {
  type: ModalType;
  category: ModalCategory;
  title: string;
  description?: string;
  preferredContainer?: "dialog" | "sidebar";
}

/**
 * MODAL_CATEGORIES - Pemetaan modal ke kategori
 * 
 * Setiap ModalType dipetakan ke ModalCategory yang sesuai.
 */
export const MODAL_CATEGORIES: Record<ModalType, ModalCategory> = {
  // File modals
  [ModalType.ImportCSV]: ModalCategory.File,
  [ModalType.ReadCSVFile]: ModalCategory.File,
  [ModalType.ImportExcel]: ModalCategory.File,
  [ModalType.ReadExcelFile]: ModalCategory.File,
  [ModalType.OpenData]: ModalCategory.File,
  [ModalType.OpenOutput]: ModalCategory.File,
  [ModalType.PrintPreview]: ModalCategory.File,
  [ModalType.Print]: ModalCategory.File,
  [ModalType.ExportCSV]: ModalCategory.File,
  [ModalType.ExportExcel]: ModalCategory.File,
  [ModalType.Exit]: ModalCategory.File,
  
  // Edit modals
  [ModalType.Find]: ModalCategory.Edit,
  [ModalType.Replace]: ModalCategory.Edit,
  [ModalType.GoToCase]: ModalCategory.Edit,
  [ModalType.GoToVariable]: ModalCategory.Edit,
  
  // Data modals
  [ModalType.DefineVarProps]: ModalCategory.Data,
  [ModalType.SortCases]: ModalCategory.Data,
  [ModalType.SortVars]: ModalCategory.Data,
  
  // Transform modals
  [ModalType.ComputeVariable]: ModalCategory.Transform,
  [ModalType.RecodeSameVariables]: ModalCategory.Transform,
  
  // Regression modals
  [ModalType.ModalAutomaticLinearModeling]: ModalCategory.Regression,
  [ModalType.ModalLinear]: ModalCategory.Regression,
  [ModalType.Statistics]: ModalCategory.Regression,
  [ModalType.SaveLinear]: ModalCategory.Regression,
  [ModalType.OptionsLinear]: ModalCategory.Regression,
  [ModalType.PlotsLinear]: ModalCategory.Regression,
  [ModalType.ModalCurveEstimation]: ModalCategory.Regression,
  [ModalType.ModalPartialLeastSquares]: ModalCategory.Regression,
  [ModalType.ModalBinaryLogistic]: ModalCategory.Regression,
  [ModalType.ModalMultinomialLogistic]: ModalCategory.Regression,
  [ModalType.ModalOrdinal]: ModalCategory.Regression,
  [ModalType.ModalProbit]: ModalCategory.Regression,
  [ModalType.ModalNonlinear]: ModalCategory.Regression,
  [ModalType.ModalWeightEstimation]: ModalCategory.Regression,
  [ModalType.ModalTwoStageLeastSquares]: ModalCategory.Regression,
  [ModalType.ModalQuantiles]: ModalCategory.Regression,
  [ModalType.ModalOptimalScaling]: ModalCategory.Regression,
  
  // Chart modals
  [ModalType.ChartBuilderModal]: ModalCategory.Graphs,
  [ModalType.SimpleBarModal]: ModalCategory.Graphs,
  
  // Time series modals
  [ModalType.Smoothing]: ModalCategory.TimeSeries,
  [ModalType.Decomposition]: ModalCategory.TimeSeries,
  [ModalType.Autocorrelation]: ModalCategory.TimeSeries,
  [ModalType.UnitRootTest]: ModalCategory.TimeSeries,
  [ModalType.BoxJenkinsModel]: ModalCategory.TimeSeries,
};

/**
 * isModalInCategory - Memeriksa apakah modal termasuk dalam kategori tertentu
 * 
 * @param type - Tipe modal yang diperiksa
 * @param category - Kategori yang dicek
 * @returns true jika modal ada dalam kategori tersebut
 */
export const isModalInCategory = (type: ModalType, category: ModalCategory): boolean => 
  MODAL_CATEGORIES[type] === category;

/**
 * isFileModal - Memeriksa apakah modal termasuk kategori File
 * 
 * @param type - Tipe modal yang diperiksa
 * @returns true jika modal adalah tipe File
 */
export const isFileModal = (type: ModalType): boolean => 
  isModalInCategory(type, ModalCategory.File);

/**
 * isDataModal - Memeriksa apakah modal termasuk kategori Data
 * 
 * @param type - Tipe modal yang diperiksa
 * @returns true jika modal adalah tipe Data
 */
export const isDataModal = (type: ModalType): boolean => 
  isModalInCategory(type, ModalCategory.Data);

/**
 * isEditModal - Memeriksa apakah modal termasuk kategori Edit
 * 
 * @param type - Tipe modal yang diperiksa
 * @returns true jika modal adalah tipe Edit
 */
export const isEditModal = (type: ModalType): boolean => 
  isModalInCategory(type, ModalCategory.Edit);

/**
 * getModalTitle - Mendapatkan judul yang diformat dari tipe modal
 * 
 * @param type - Tipe modal
 * @returns Judul yang diformat dengan baik untuk tampilan UI
 */
export const getModalTitle = (type: ModalType): string => {
  return type.toString()
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}; 