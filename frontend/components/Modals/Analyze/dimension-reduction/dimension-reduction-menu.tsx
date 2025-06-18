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

const DimensionReductionMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarSub>
            <MenubarSubTrigger>Dimension Reduction</MenubarSubTrigger>
            <MenubarSubContent>
                <MenubarItem onClick={() => openModal(ModalType.ModalFactor)}>
                    Factor
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        openModal(ModalType.ModalCorrespondenceAnalysis)
                    }
                >
                    Correspondence Analysis
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => openModal(ModalType.ModalDROptimalScaling)}
                >
                    Optimal Scaling
                </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
    );
};

export default DimensionReductionMenu;
