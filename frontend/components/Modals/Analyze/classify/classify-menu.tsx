"use client";

import React from "react";
import {
    MenubarItem,
    MenubarSeparator,
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
                <MenubarItem disabled>
                    TwoStep Cluster
                </MenubarItem>
                <MenubarItem disabled>
                    K-Means Cluster
                </MenubarItem>
                <MenubarItem disabled>
                    Hierarchical Cluster
                </MenubarItem>
                <MenubarItem disabled>
                    Cluster Silhouettes
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem disabled>
                    Tree
                </MenubarItem>
                <MenubarItem disabled>
                    Discriminant
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem disabled>
                    Nearest Neighbor
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem disabled>
                    ROC Curve
                </MenubarItem>
                <MenubarItem disabled>
                    ROC Analysis
                </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
    );
};

export default ClassifyMenu;
