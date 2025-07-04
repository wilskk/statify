"use client";

import React, { useState } from 'react';
import {
    FolderOpen,
    Save,
    Printer,
    Undo,
    Redo,
    Locate,
    Variable,
    Search,
    ArrowRightLeft,
} from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/useMobile";
import { useFileMenuActions } from '@/components/Modals/File/hooks/useFileMenuActions';
import { ModalType, useModal } from '@/hooks/useModal';
// import { ModeToggle } from "@/components/mode-toggle";
import { useTableRefStore } from '@/stores/useTableRefStore';
import { usePathname } from 'next/navigation';

export default function Toolbar() {
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const { isMobile } = useMobile();
    const pathname = usePathname();
    const { handleAction: handleFileAction } = useFileMenuActions();
    const { openModal } = useModal();
    const { viewMode, toggleViewMode } = useTableRefStore();

    const isDataPage = pathname === '/dashboard/data';

    const fileTools = [
        { name: 'Open Data', icon: <FolderOpen size={16} />, onClick: () => openModal(ModalType.OpenData) },
        { name: 'Save Document', icon: <Save size={16} />, onClick: () => handleFileAction({ actionType: 'Save' }) },
        { name: 'Print', icon: <Printer size={16} />, onClick: () => openModal(ModalType.Print) },
    ];

    const dataTools = [
        { name: 'Locate', icon: <Locate size={16} /> },
        { name: 'Variable', icon: <Variable size={16} /> },
        { name: 'Search', icon: <Search size={16} /> },
        { name: 'Toggle View', icon: <ArrowRightLeft size={16} />, onClick: toggleViewMode },
    ];

    const ToolGroup = ({ tools }: { tools: { name: string; icon: React.ReactNode; onClick?: () => void }[] }) => (
        <div className="flex">
            {tools.map((tool) => {
                const isActive = tool.name === 'Toggle View' && viewMode === 'label' && isDataPage;

                return (
                    <TooltipProvider key={tool.name} delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className={`flex items-center justify-center h-8 w-8 text-muted-foreground hover:bg-accent transition-colors ${
                                        hoveredTool === tool.name || isActive ? 'bg-accent' : ''
                                    }`}
                                    onMouseEnter={() => setHoveredTool(tool.name)}
                                    onMouseLeave={() => setHoveredTool(null)}
                                    aria-label={tool.name}
                                    onClick={tool.onClick}
                                >
                                    {tool.icon}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs py-1 px-2">
                                {tool.name}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );

    return (
        <div className="bg-background px-4 py-1 border-b border-border flex justify-between items-center overflow-hidden shadow-md">
            <div className={`flex ${isMobile ? 'w-full overflow-x-auto' : ''}`}>
                <div className="flex space-x-2 min-w-max">
                    <ToolGroup tools={fileTools} />
                    <Separator orientation="vertical" className="h-6 my-auto" />
                    <ToolGroup tools={dataTools} />
                </div>
            </div>
            {/* <ModeToggle /> */}
        </div>
    );
}