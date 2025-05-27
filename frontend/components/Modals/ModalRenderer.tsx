"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { ModalType, BaseModalProps, getModalTitle } from "@/types/modalTypes";
import { getModalComponent, getModalContainerType } from "./ModalRegistry";
import { useMobile } from "@/hooks/useMobile";

interface ModalRendererProps extends BaseModalProps {
  modalType: ModalType;
  id?: string;
}

/**
 * ModalRenderer - Komponen yang bertugas merender modal dengan format yang tepat
 * 
 * Komponen ini menangani:
 * 1. Pemilihan komponen modal yang sesuai dari registry
 * 2. Penentuan container (dialog/sidebar) berdasarkan konfigurasi dan device
 * 3. Rendering UI dengan format yang konsisten
 */
const ModalRenderer: React.FC<ModalRendererProps> = ({
  modalType,
  onClose,
  containerType: requestedContainer = "dialog",
  id,
  containerOverride,
  ...props
}) => {
  // State untuk menyimpan tipe container yang akan digunakan
  const [finalContainerType, setFinalContainerType] = useState<"dialog" | "sidebar">("dialog");
  
  // Get mobile status
  const { isMobile } = useMobile();
  
  // Get the component
  const ModalComponent = getModalComponent(modalType);
  
  // Determine container type based on device, preference, and override
  useEffect(() => {
    /**
     * Determines final container type with a clear priority order:
     * 1. containerOverride (highest priority)
     * 2. Registry preferences 
     * 3. Requested container from props
     * 4. Device-based defaults (lowest priority)
     */
    const determineContainerType = () => {
      // Mobile devices always use dialog regardless of other settings
      if (isMobile) return "dialog";
      
      // 1. containerOverride has highest priority if provided
      if (containerOverride) {
        return containerOverride === "auto" ? "sidebar" : 
               containerOverride === "sidebar" ? "sidebar" : "dialog";
      }
      
      // 2. Get preferred container from registry (already handles preferences)
      return getModalContainerType(
        modalType,
        requestedContainer === "auto" ? "sidebar" : requestedContainer,
        isMobile
      );
    };

    // Set the container type
    setFinalContainerType(determineContainerType());
    
    // Handle window resize for responsiveness
    const handleResize = () => setFinalContainerType(determineContainerType());
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [modalType, requestedContainer, containerOverride, isMobile]);
  
  // Render placeholder if no component is found
  if (!ModalComponent) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsupported Modal Type</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-muted-foreground mb-6">
              This modal type ({modalType}) is not yet supported.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Render as a sidebar
  if (finalContainerType === "sidebar") {
    const title = getModalTitle(modalType);
    
    return (
      <div className="h-full flex flex-col bg-background overflow-hidden w-full">
        <div className="flex justify-between items-center border-b p-4 shrink-0">
          <h2 className="text-xl font-semibold truncate mr-2">{title}</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto overflow-x-auto min-w-0">
          <div className="w-full min-w-0">
            <ModalComponent 
              onClose={onClose} 
              containerType="sidebar" 
              {...props} 
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Render as a dialog
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <ModalComponent 
        onClose={onClose} 
        containerType="dialog" 
        {...props} 
      />
    </Dialog>
  );
};

export default ModalRenderer; 