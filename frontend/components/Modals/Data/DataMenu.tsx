// components/Modals/Data/DataMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { ModalType, useModal } from "@/hooks/useModal";

const DataMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger>Data</MenubarTrigger>
            <MenubarContent>
                <MenubarItem
                    onClick={() => openModal(ModalType.DefineVarProps)}
                >
                    Define Variable Properties...
                </MenubarItem>
                <MenubarItem
                    onClick={() => openModal(ModalType.SetMeasurementLevel)}
                >
                    Set Measurement Level...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.DefineDateTime)}>
                    Define Date and Time...
                </MenubarItem>
                <MenubarSeparator />
                {/*<MenubarItem onClick={() => openModal(ModalType.Validate)}>*/}
                {/*    Validation...*/}
                {/*</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.DuplicateCases)}>
                    Identify Duplicate Cases...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.UnusualCases)}>
                    Identify Unusual Cases...
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.SortCases)}>
                    Sort Cases...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.SortVars)}>
                    Sort Variables...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Transpose)}>
                    Transpose...
                </MenubarItem>
                {/*<MenubarItem onClick={() => openModal(ModalType.Restructure)}>*/}
                {/*    Restructure...*/}
                {/*</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.Aggregate)}>
                    Aggregate...
                </MenubarItem>
                <MenubarSeparator />
                {/*<MenubarItem onClick={() => openModal(ModalType.SelectCases)}>*/}
                {/*    Select Cases...*/}
                {/*</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.WeightCases)}>
                    Weight Cases...
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default DataMenu;