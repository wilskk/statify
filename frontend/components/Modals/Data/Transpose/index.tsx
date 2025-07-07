"use client";

import React from "react";
import { TransposeModalProps } from "./types";
import { useTranspose } from "./hooks/useTranspose";
import { TransposeUI } from "./TransposeUI";

const TransposeModal: React.FC<TransposeModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const hookProps = useTranspose({ onClose });

    return (
        <TransposeUI
            {...hookProps}
            onClose={onClose}
            containerType={containerType}
        />
    );
};

export default TransposeModal;