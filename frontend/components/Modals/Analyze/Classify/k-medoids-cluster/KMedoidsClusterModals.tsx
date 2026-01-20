"use client";

import React from "react";
import type { BaseModalProps } from "@/types/modalTypes";

const ModalKMedoidsCluster: React.FC<BaseModalProps> = ({ onClose }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">K-Medoids Cluster</h2>
      <p className="text-sm text-muted-foreground mt-2">
        K-Medoids clustering module (under development)
      </p>
    </div>
  );
};

export default ModalKMedoidsCluster;
