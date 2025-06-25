"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    console.groupCollapsed(`[ModalRenderer] useEffect for ${modalType} - Determining Container`);
    console.log(`Dependencies:`, { modalType, requestedContainer, containerOverride, isMobile });

    const determineContainerType = () => {
      console.log(`Initial values: reqContainer=${requestedContainer}, override=${containerOverride}, mobile=${isMobile}`);
      
      // Special debug for ExportCSV modal
      if (modalType === ModalType.ExportCSV) {
        console.log(`ExportCSV Modal Debug - Processing with:`, {
          requestedContainer,
          containerOverride,
          isMobile,
        });
      }
      
      if (isMobile) {
        console.log('Decision: Mobile device, using "dialog".');
        return "dialog";
      }
      
      if (containerOverride) {
        console.log(`Decision: Container override present ("${containerOverride}"), using it.`);
        return containerOverride;
      }
      
      const preferred = getModalContainerType(
        modalType,
        requestedContainer,
        false // isMobile is false at this point
      );
      console.log(`Decision: No override, preferred from registry: "${preferred}" (based on requested: "${requestedContainer}")`);
      return preferred;
    };

    const newFinalContainerType = determineContainerType();
    console.log(`New final container type: "${newFinalContainerType}"`);
    setFinalContainerType(newFinalContainerType);
    
    console.groupEnd();

    // Handle window resize for responsiveness
    const handleResize = () => {
      console.groupCollapsed(`[ModalRenderer] handleResize for ${modalType} - Re-determining Container`);
      const resizedContainerType = determineContainerType();
      console.log(`Resized final container type: "${resizedContainerType}"`);
      setFinalContainerType(resizedContainerType);
      console.groupEnd();
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      console.log(`[ModalRenderer] useEffect cleanup for ${modalType} - Removing resize listener.`);
      window.removeEventListener("resize", handleResize);
    };
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
          <div className="w-full min-w-0 h-full">
            <ModalComponent 
              onClose={onClose} 
              containerType="sidebar" 
              id={id}
              {...props} 
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Render as a dialog
  const descriptionId = `modal-desc-${modalType}`;
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-md p-0" 
        aria-describedby={descriptionId}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{getModalTitle(modalType)}</DialogTitle>
          <DialogDescription id={descriptionId}>
          </DialogDescription>
        </DialogHeader>
        <ModalComponent 
          onClose={onClose} 
          containerType="dialog" 
          {...props} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModalRenderer; 