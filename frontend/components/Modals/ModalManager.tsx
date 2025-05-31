"use client";

import React from "react";
import { useModal } from "@/hooks/useModal";
import ModalRenderer from "./ModalRenderer";

interface ModalManagerProps {
  // Optional callback to filter or customize which modals to display
  // Useful for different views that need special modal handling
  customFilter?: (modalId: string) => boolean;
  
  // Optional custom container type
  containerType?: "dialog" | "sidebar";
}

/**
 * ModalManager - Pengelola tampilan modal dalam aplikasi
 * 
 * Komponen ini bertanggung jawab untuk:
 * 1. Mengambil daftar modal aktif dari store
 * 2. Memfilter modal yang akan ditampilkan (opsional)
 * 3. Merender setiap modal dengan ModalRenderer
 * 
 * Digunakan di layout dashboard untuk menampilkan modal dengan berbagai jenis
 * tampilan (dialog/sidebar) sesuai kebutuhan.
 */
const ModalManager: React.FC<ModalManagerProps> = ({ 
  customFilter,
  containerType = "dialog"
}) => {
  const { modals, closeModal } = useModal();
  
  // Filter modals if a custom filter is provided
  const visibleModals = customFilter 
    ? modals.filter(modal => customFilter(modal.id))
    : modals;
  
  if (visibleModals.length === 0) return null;
  
  return (
    <>
      {visibleModals.map((modal) => {
        console.log(`[ModalManager] Rendering modal: ${modal.type}, containerType: ${containerType}`);
        return (
          <ModalRenderer
            key={modal.id}
            id={modal.id}
            modalType={modal.type}
            onClose={() => closeModal(modal.id)}
            containerType={containerType}
            {...modal.props}
          />
        );
      })}
    </>
  );
};

export default ModalManager; 