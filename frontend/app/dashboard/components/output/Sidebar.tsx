"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResultStore } from "@/stores/useResultStore";
import { Log } from "@/types/Result";
import { Analytic } from "@/types/Result";
import { Statistic } from "@/types/Result";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface SidebarItem {
    id?: number;
    type?: 'log' | 'analytic' | 'statistic';
    title: string;
    url?: string;
    items?: SidebarItem[];
    analyticId?: number;
}

const SidebarMenuItem: React.FC<{
    item: SidebarItem;
    depth?: number;
    isOpen: boolean;
    deleteLog: (logId: number) => Promise<void>;
    deleteAnalytic: (analyticId: number) => Promise<void>;
    deleteStatistic: (statisticId: number) => Promise<void>;
}> = ({ item, depth = 0, isOpen, deleteLog, deleteAnalytic, deleteStatistic }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const hasChildren = item.items && item.items.length > 0;
    const isDeletable = item.type !== undefined && item.id !== undefined;

    const handleDelete = async () => {
        if (!item.id) return;
        try {
            if (item.type === 'log' && item.id) {
                await deleteLog(item.id);
            } else if (item.type === 'analytic' && item.id) {
                await deleteAnalytic(item.id);
            } else if (item.type === 'statistic' && item.id) {
                await deleteStatistic(item.id);
            }
            toast({
                title: "Item deleted",
                description: `${item.type?.charAt(0).toUpperCase() + item.type!.slice(1)} "${item.title}" has been deleted.`,
            });
        } catch (error: any) {
            console.error(`Failed to delete ${item.type}:`, error);
            toast({
                variant: "destructive",
                title: "Error deleting item",
                description: `Failed to delete ${item.type} "${item.title}". ${error.message || ''}`,
            });
        }
    };

    const handleToggle = () => {
        if (hasChildren) setOpen(!open);
    };

    const paddingLeft = depth * 4;

    const renderDeleteButton = () => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Trash2 size={14} />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px] bg-popover text-popover-foreground border-border rounded-lg p-4 shadow-lg">
                <AlertDialogHeader className="pb-2">
                    <AlertDialogTitle className="text-lg font-semibold text-popover-foreground">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                        This action cannot be undone. This will permanently delete the {item.type} &quot;{item.title}&quot;
                        {item.type === 'log' && ' and all its associated analytics and statistics.'}
                        {item.type === 'analytic' && ' and all its associated statistics.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-3 sm:justify-end">
                    <AlertDialogCancel className="border border-border hover:bg-accent text-accent-foreground h-8 px-3 text-sm">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 px-3 text-sm">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return (
        <div className="flex flex-col group">
            {hasChildren ? (
                <div className={cn(
                    "flex items-center text-sm text-foreground rounded group relative hover:bg-accent",
                    { "pl-3 pr-1 py-1": depth > 0, "py-2 px-3 pr-1": depth === 0 }
                )}
                    style={{ paddingLeft: `${paddingLeft}px` }}>
                    <button
                        onClick={handleToggle}
                        className="flex items-center grow focus:outline-none"
                    >
                        <span className="truncate mr-1">{item.title}</span>
                        <span className="ml-auto flex-shrink-0 pl-1">
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    </button>
                    {isDeletable && isOpen && (
                        <div className="flex-shrink-0 ml-1">
                            {renderDeleteButton()}
                        </div>
                    )}
                </div>
            ) : (
                <div className={cn(
                    "flex items-center text-sm text-foreground rounded group relative hover:bg-accent",
                    { "pl-6 pr-1 py-1": depth > 0, "py-2 px-3 pr-1": depth === 0 }
                )}
                     style={{ paddingLeft: `${paddingLeft}px` }}>
                    <a
                        href={item.url}
                        className="flex items-center grow truncate mr-1 focus:outline-none"
                    >
                        {item.title}
                    </a>
                    {isDeletable && isOpen && (
                        <div className="flex-shrink-0 ml-1">
                            {renderDeleteButton()}
                        </div>
                    )}
                </div>
            )}
            {/* Nested items rendered outside the clickable area */}
            {open && isOpen && (
                <div className="ml-2">
                    {item.items!.map((child, idx) => (
                        <SidebarMenuItem
                            key={generateKey(child, idx)}
                            item={child}
                            depth={depth + 1}
                            isOpen={isOpen}
                            deleteLog={deleteLog}
                            deleteAnalytic={deleteAnalytic}
                            deleteStatistic={deleteStatistic}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

function buildSidebarData(logs: Log[]): SidebarItem[] {
    const sidebarItems: SidebarItem[] = [];

    logs.forEach((log) => {
        if (!log.analytics || log.analytics.length === 0) {
            return;
        };

        const logItem: SidebarItem = {
            id: log.id,
            title: `Log ${log.id}`,
            type: 'log',
            items: []
        };

        log.analytics.forEach((analytic) => {
            if (!analytic.statistics || analytic.statistics.length === 0) return;

            const analyticItem: SidebarItem = {
                id: analytic.id,
                analyticId: analytic.id,
                title: analytic.title,
                type: 'analytic',
                items: []
            };

            const componentsMap = analytic.statistics.reduce((acc: Record<string, Statistic[]>, stat) => {
                const component = stat.components || "General";
                if (!acc[component]) acc[component] = [];
                acc[component].push(stat);
                return acc;
            }, {});

            Object.keys(componentsMap).forEach((component, componentIndex) => {
                const stats = componentsMap[component];
                if (stats.length > 1) {
                    const componentItem: SidebarItem = {
                        title: component,
                        items: stats.map((stat) => ({
                            id: stat.id,
                            analyticId: analytic.id,
                            type: 'statistic',
                            title: stat.title,
                            url: `#output-${analytic.id}-${stat.id}`
                        }))
                    };
                    analyticItem.items!.push(componentItem);
                } else if (stats.length === 1) {
                    const stat = stats[0];
                    analyticItem.items!.push({
                        id: stat.id,
                        analyticId: analytic.id,
                        type: 'statistic',
                        title: stat.title,
                        url: `#output-${analytic.id}-${stat.id}`
                    });
                }
            });

            if (analyticItem.items!.length > 0) {
                logItem.items!.push(analyticItem);
            }
        });

        if (logItem.items!.length > 0) {
            sidebarItems.push(logItem);
        }
    });

    return sidebarItems;
}

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const { logs, deleteLog, deleteAnalytic, deleteStatistic } = useResultStore();
    const [sidebarData, setSidebarData] = useState<SidebarItem[]>([]);

    useEffect(() => {
        const data = buildSidebarData(logs);
        setSidebarData(data);
    }, [logs]);

    return (
        <div
            className={cn(
                "bg-background border-r border-border transition-all duration-300 flex flex-col h-full",
                isOpen ? "w-64" : "w-20"
            )}
        >
            <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
                {isOpen && <h1 className="text-md font-semibold truncate">Result</h1>}
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setIsOpen(!isOpen)}>
                    <ChevronRight
                        className={cn(
                            "w-4 h-4 transform transition-transform",
                            isOpen ? "rotate-180" : "rotate-0"
                        )}
                    />
                </Button>
            </div>
            <div className="overflow-y-auto flex-grow">
                <nav className="p-2">
                    {sidebarData.map((item, index) => (
                        <SidebarMenuItem
                            key={generateKey(item, index)}
                            item={item}
                            isOpen={isOpen}
                            deleteLog={deleteLog}
                            deleteAnalytic={deleteAnalytic}
                            deleteStatistic={deleteStatistic}
                        />
                    ))}
                </nav>
            </div>
        </div>
    );
};

const generateKey = (item: SidebarItem, index: number): string => {
    if (item.type === 'log' && item.id) return `log-${item.id}`;
    if (item.type === 'analytic' && item.id) return `analytic-${item.id}`;
    if (item.type === 'statistic' && item.id) return `stat-${item.id}`;
    return `item-${item.title}-${index}`;
}

export default Sidebar;