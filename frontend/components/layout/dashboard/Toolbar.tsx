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
} from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/useMobile";
import { useActions } from '@/hooks/actions';
import { ModalType, useModal } from '@/hooks/useModal';
import { ModeToggle } from "@/components/mode-toggle";

export default function Toolbar() {
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const { isMobile } = useMobile();
    const { handleAction } = useActions();
    const { openModal } = useModal();

    const fileTools = [
        { name: 'Open Data', icon: <FolderOpen size={16} />, onClick: () => openModal(ModalType.OpenData) },
        { name: 'Save Document', icon: <Save size={16} />, onClick: () => handleAction({ actionType: 'Save' }) },
        { name: 'Print', icon: <Printer size={16} />, onClick: () => openModal(ModalType.Print) },
    ];

    const dataTools = [
        { name: 'Locate', icon: <Locate size={16} /> },
        { name: 'Variable', icon: <Variable size={16} /> },
        { name: 'Search', icon: <Search size={16} /> },
    ];

    const ToolGroup = ({ tools }: { tools: { name: string; icon: React.ReactNode; onClick?: () => void }[] }) => (
        <div className="flex">
            {tools.map((tool) => (
                <TooltipProvider key={tool.name} delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`flex items-center justify-center h-8 w-8 text-muted-foreground hover:bg-accent transition-colors
                                ${hoveredTool === tool.name ? 'bg-accent' : ''}`}
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
            ))}
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
            <ModeToggle />
        </div>
    );
}