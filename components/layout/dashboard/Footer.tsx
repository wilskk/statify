"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DatabaseIcon, VariableIcon, BarChartIcon, KeyboardIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

    const isDataActive = pathname.startsWith('/data');
    const isVariableActive = pathname.startsWith('/variable');
    const isResultActive = pathname.startsWith('/result');

    useEffect(() => {
        const handleConnectionChange = () => {
            setConnectionStatus(navigator.onLine ? 'online' : 'offline');
        };

        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);

        return () => {
            window.removeEventListener('online', handleConnectionChange);
            window.removeEventListener('offline', handleConnectionChange);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch (e.key) {
                    case 'd': router.push('/data'); break;
                    case 'v': router.push('/variable'); break;
                    case 'r': router.push('/result'); break;
                    default: break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    const tabStyle = "py-1 px-2.5 flex items-center gap-1.5 text-sm transition-colors";
    const activeTabStyle = "bg-black text-white";
    const inactiveTabStyle = "text-[#444444] hover:bg-[#F7F7F7]";

    return (
        <footer className="w-full bg-white border-t border-[#E6E6E6] py-1 px-3 flex items-center justify-between flex-shrink-0">
            <TooltipProvider>
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`${tabStyle} ${isDataActive ? activeTabStyle : inactiveTabStyle}`}
                                onClick={() => router.push('/data')}
                            >
                                <DatabaseIcon size={14} />
                                <span>Data</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>View and edit dataset (Alt+D)</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`${tabStyle} ${isVariableActive ? activeTabStyle : inactiveTabStyle}`}
                                onClick={() => router.push('/variable')}
                            >
                                <VariableIcon size={14} />
                                <span>Variable</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>Configure variables (Alt+V)</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`${tabStyle} ${isResultActive ? activeTabStyle : inactiveTabStyle}`}
                                onClick={() => router.push('/result')}
                            >
                                <BarChartIcon size={14} />
                                <span>Result</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>View analysis results (Alt+R)</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    {connectionStatus === 'offline' && (
                        <span className="flex items-center text-[#888888]">
                            <span className="inline-block w-2 h-2 rounded-full bg-[#888888] mr-1"></span>
                            Offline mode
                        </span>
                    )}

                    <span className="text-[#888888]">Current dataset: <span className="font-medium">sample_data</span></span>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="p-1 rounded hover:bg-[#F7F7F7]">
                                <KeyboardIcon size={14} className="text-[#888888]" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>Keyboard shortcuts</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </footer>
    );
}