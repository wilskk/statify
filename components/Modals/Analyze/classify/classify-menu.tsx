"use client";

import React from "react";
import {
    MenubarItem,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
} from "@/components/ui/menubar";
import { ModalType, useModal } from "@/hooks/useModal";

const ClassifyMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarSub>
            <MenubarSubTrigger>Classify</MenubarSubTrigger>
            <MenubarSubContent>
                <MenubarItem
                    onClick={() => openModal(ModalType.TwoStepCluster)}
                >
                    TwoStep Cluster
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.KMeansCluster)}>
                    K-Means Cluster
                </MenubarItem>
                <MenubarItem
                    onClick={() => openModal(ModalType.HierarchicalCluster)}
                >
                    Hierarchical Cluster
                </MenubarItem>
                <MenubarItem
                    onClick={() => openModal(ModalType.ClusterSilhouettes)}
                >
                    Cluster Silhouettes
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Tree)}>
                    Tree
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Discriminant)}>
                    Discriminant
                </MenubarItem>
                <MenubarItem
                    onClick={() => openModal(ModalType.NearestNeighbor)}
                >
                    Nearest Neighbor
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.ROCCurve)}>
                    ROC Curve
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.ROCAnalysis)}>
                    ROC Analysis
                </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
    );
};

export default ClassifyMenu;
