"use client";

import React from "react";
import { useModal, ModalType } from "@/hooks/useModal";
import { X } from "lucide-react";
import { ContainerType } from "@/types/ui";
import { DescriptiveModal, isDescriptiveModal } from "@/components/Modals/Analyze/Descriptive/DescriptiveModal";

// Helper function to format modal title from ModalType
const formatModalTitle = (type: ModalType): string => {
  return type.toString()
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const SidebarContainer: React.FC = () => {
  const { modals, closeModal } = useModal();

  if (modals.length === 0) return null;

  const currentModal = modals[modals.length - 1];
  const modalTitle = formatModalTitle(currentModal.type);

  // Render modal content based on type
  const renderSidebarContent = () => {
    // For now, we'll focus on supporting Descriptive modal first
    if (isDescriptiveModal(currentModal.type)) {
      return (
        <DescriptiveModal
          modalType={currentModal.type}
          onClose={closeModal}
          props={currentModal.props}
          containerType="sidebar"
        />
      );
    }

    // Fallback for unsupported modals
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium mb-4">Unsupported Modal Type</h3>
        <p className="text-muted-foreground mb-6">
          This modal type ({currentModal.type}) is not yet supported in sidebar mode.
        </p>
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Close
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="text-xl font-semibold">{modalTitle}</h2>
        <button 
          onClick={closeModal}
          className="rounded-full p-1.5 hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderSidebarContent()}
      </div>
    </div>
  );
};

export default SidebarContainer; 