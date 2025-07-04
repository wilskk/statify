// components/Layout/Main/FileMenu.tsx
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
import { useFileMenuActions } from "./hooks/useFileMenuActions";
import { ModalType, useModal } from "@/hooks/useModal";

const FileMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useFileMenuActions();

    return (
        <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => handleAction({ actionType: "New" })}>
                    New
                </MenubarItem>
                <MenubarItem onClick={() => handleAction({ actionType: "Save" })}>
                    Save
                </MenubarItem>
                <MenubarItem onClick={() => handleAction({ actionType: "SaveAs" })}>
                    Save As
                </MenubarItem>
                <MenubarSub>
                    <MenubarItem onClick={() => openModal(ModalType.OpenData)}>
                        Open SAV
                    </MenubarItem>
                    <MenubarItem onClick={() => openModal(ModalType.ExampleDataset)}>
                        Example Data
                    </MenubarItem>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Import Data</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.ImportExcel)}>
                            Excel
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ImportCSV)}>
                            CSV Data
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ImportClipboard)}>
                            From Clipboard
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarSub>
                    <MenubarSubTrigger>Export</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.ExportExcel)}>
                            Excel
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ExportCSV)}>
                            CSV Data
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.Print)}>
                    Print...
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => handleAction({ actionType: "Exit" })}>
                    Exit
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default FileMenu;