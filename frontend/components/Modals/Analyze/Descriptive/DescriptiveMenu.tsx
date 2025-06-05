// components/Modals/Descriptive/DescriptiveMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { ModalType } from "@/types/modalTypes";
import { useModal } from "@/hooks/useModal";

const DescriptiveMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger>Descriptive</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.Descriptives)}>
                    Descriptives...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Explore)}>
                    Explore...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Frequencies)}>
                    Frequencies...
                </MenubarItem>
                <MenubarSeparator />
                {/* <MenubarItem onClick={() => openModal(ModalType.Crosstabs)}>
                    Crosstabs...
                </MenubarItem> */}
                {/* 
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.Ratio)}>
                    Ratio...
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.PPPlots)}>
                    P-P Plots...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.QQPlots)}>
                    Q-Q Plots...
                </MenubarItem>
                */}
            </MenubarContent>
        </MenubarMenu>
    );
};

export default DescriptiveMenu;