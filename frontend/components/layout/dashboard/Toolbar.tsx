"use client";

import React, { useState } from 'react';
import {
    FolderOpen,
    Save,
    Printer,
    History,
    Undo,
    Redo,
    Locate,
    Variable,
    Search,
    TableRowsSplit,
    ChevronDown,
} from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/useMobile";

export default function Toolbar() {
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const { isMobile } = useMobile();

    const fileTools = [
        { name: 'Open Data', icon: <FolderOpen size={16} /> },
        { name: 'Save Document', icon: <Save size={16} /> },
        { name: 'Print', icon: <Printer size={16} /> },
    ];

    const historyTools = [
        { name: 'History', icon: <History size={16} /> },
        { name: 'Undo', icon: <Undo size={16} /> },
        { name: 'Redo', icon: <Redo size={16} /> },
    ];

    const dataTools = [
        { name: 'Locate', icon: <Locate size={16} /> },
        { name: 'Variable', icon: <Variable size={16} /> },
        { name: 'Search', icon: <Search size={16} /> },
        { name: 'Split File', icon: <TableRowsSplit size={16} /> },
    ];

    const ToolGroup = ({ tools }: { tools: { name: string; icon: React.ReactNode }[] }) => (
        <div className="flex">
            {tools.map((tool) => (
                <TooltipProvider key={tool.name} delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`flex items-center justify-center h-8 w-8 text-gray-700 hover:bg-[#F7F7F7] transition-colors
                                ${hoveredTool === tool.name ? 'bg-[#F7F7F7]' : ''}`}
                                onMouseEnter={() => setHoveredTool(tool.name)}
                                onMouseLeave={() => setHoveredTool(null)}
                                aria-label={tool.name}
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
        <div className="bg-white px-4 py-1 border-b border-[#E6E6E6] flex justify-between items-center overflow-hidden">
            <div className={`flex ${isMobile ? 'w-full overflow-x-auto' : ''}`}>
                <div className="flex space-x-2 min-w-max">
                    <ToolGroup tools={fileTools} />
                    <Separator orientation="vertical" className="h-6 my-auto" />
                    <ToolGroup tools={historyTools} />
                    <Separator orientation="vertical" className="h-6 my-auto" />
                    <ToolGroup tools={dataTools} />
                </div>
            </div>
        </div>
    );
}