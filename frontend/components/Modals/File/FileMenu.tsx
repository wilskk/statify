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
import { useActions } from "@/hooks/actions";
import { ModalType, useModal } from "@/hooks/useModal";

const FileMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useActions();

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
                <MenubarSub>
                    <MenubarItem onClick={() => openModal(ModalType.OpenData)}>
                        Open Data
                    </MenubarItem>
                    {/*<MenubarSubTrigger>Open</MenubarSubTrigger>*/}
                    {/*<MenubarSubContent>*/}
                    {/*    <MenubarItem onClick={() => openModal(ModalType.OpenData)}>*/}
                    {/*        Data*/}
                    {/*    </MenubarItem>*/}
                    {/*    <MenubarItem onClick={() => openModal(ModalType.OpenOutput)}>*/}
                    {/*        Output*/}
                    {/*    </MenubarItem>*/}
                        {/*<MenubarSub>*/}
                        {/*    <MenubarSubTrigger>Script</MenubarSubTrigger>*/}
                        {/*    <MenubarSubContent>*/}
                        {/*        <MenubarItem onClick={() => openModal(ModalType.OpenPython2)}>Python2</MenubarItem>*/}
                        {/*        <MenubarItem onClick={() => openModal(ModalType.OpenPython3)}>Python3</MenubarItem>*/}
                        {/*        <MenubarItem onClick={() => openModal(ModalType.OpenBasic)}>Basic</MenubarItem>*/}
                        {/*    </MenubarSubContent>*/}
                        {/*</MenubarSub>*/}
                {/*    </MenubarSubContent>*/}
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Import Data</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.ImportExcel)}>
                            Excel...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ImportCSV)}>
                            CSV Data...
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                {/*<MenubarItem onClick={() => openModal(ModalType.SaveAllData)}>Save All Data</MenubarItem>*/}
                <MenubarSub>
                    <MenubarSubTrigger>Export</MenubarSubTrigger>
                    <MenubarSubContent>
                        {/*<MenubarItem*/}
                        {/*  onClick={() => openModal(ModalType.ExportDatabase)}*/}
                        {/*>*/}
                        {/*  Database...*/}
                        {/*</MenubarItem>*/}
                        <MenubarItem onClick={() => openModal(ModalType.ExportExcel)}>
                            Excel...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ExportCSV)}>
                            CSV Data...
                        </MenubarItem>
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportTabDelimited)}>Tab-delimited...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportFixedText)}>Fixed Text...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportSAS)}>SAS...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportStata)}>Stata...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportDBase)}>dBase...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportLotus)}>Lotus...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportCognos)}>Cognos TM1...</MenubarItem>*/}
                        {/*<MenubarItem onClick={() => openModal(ModalType.ExportSYLK)}>SYLK...</MenubarItem>*/}
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                {/*<MenubarItem onClick={() => openModal(ModalType.RenameDataset)}>Rename Dataset...</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.DisplayFileInfo)}>Display Data File Information</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.CacheData)}>Cache Data...</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.CollectVariableInfo)}>Collect Variable Information</MenubarItem>*/}
                {/*<MenubarSeparator />*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.StopProcessor)}>Stop Processor</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.SwitchServer)}>Switch Server...</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.Repository)}>Repository</MenubarItem>*/}
                {/*<MenubarSeparator />*/}
                <MenubarItem onClick={() => openModal(ModalType.Print)}>
                    Print...
                </MenubarItem>
                <MenubarSeparator />
                {/*<MenubarItem onClick={() => openModal(ModalType.WelcomeDialog)}>Welcome Dialog...</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.RecentlyUsedData)}>Recently Used Data</MenubarItem>*/}
                {/*<MenubarItem onClick={() => openModal(ModalType.RecentlyUsedFiles)}>Recently Used Files</MenubarItem>*/}
                {/*<MenubarSeparator />*/}
                <MenubarItem onClick={() => openModal(ModalType.Exit)}>
                    Exit
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default FileMenu;