"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
} from "@/components/ui/menubar";
import { useActions } from "@/hooks/actions";
import { ModalType, useModal } from "@/hooks/useModal";

const TransformMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useActions();

    return (
        <MenubarMenu>
            <MenubarTrigger>Transform</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.ComputeVariable)}>
                    Compute Variable...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.RecodeSameVariables)}>
                    Recode into Same Variables...
                </MenubarItem>
                {/* Add more transform options as needed */}
                <MenubarSeparator />
                {/* Additional transform options can be added here */}
            </MenubarContent>
        </MenubarMenu>
    );
};

export default TransformMenu; 