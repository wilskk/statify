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

const GeneralLinearModelMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarSub>
            <MenubarSubTrigger>General Linear Model</MenubarSubTrigger>
            <MenubarSubContent>
                <MenubarItem disabled>
                    Univariate
                </MenubarItem>
                <MenubarItem disabled>
                    Multivariate
                </MenubarItem>
                <MenubarItem disabled>
                    Repeated Measures
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem disabled>
                    Variance Components
                </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
    );
};

export default GeneralLinearModelMenu;
