"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { File, Database, Loader2, Info } from 'lucide-react';
import { useExampleDatasetLogic } from './hooks/useExampleDatasetLogic';
import { exampleFiles } from './example-datasets';
import { BaseModalProps } from '@/types/modalTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ExampleDataset } from './types';

const renderFileList = (
    files: ExampleDataset[],
    handleFileClick: (path: string) => void,
    isLoading: boolean
) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {files.map((file) => (
            <Button
                key={file.path}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 hover:bg-accent/50 transition-colors group"
                onClick={() => handleFileClick(file.path)}
                disabled={isLoading}
                title={file.description || file.name}
            >
                <File className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:whitespace-normal group-hover:break-words">
                        {file.name}
                    </div>
                    {file.description && (
                        <div className="text-xs text-muted-foreground truncate group-hover:whitespace-normal group-hover:break-words mt-1">
                            {file.description}
                        </div>
                    )}
                </div>
                {file.description && (
                    <Info className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
            </Button>
        ))}
    </div>
);

export const ExampleDatasetModal: React.FC<BaseModalProps> = ({ onClose }) => {
    const { isLoading, error, loadDataset } = useExampleDatasetLogic({ onClose });
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

    const filteredFiles = exampleFiles.sav.filter(file =>
        selectedTags.length === 0 || selectedTags.some(tag => file.tags?.includes(tag))
    );

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <Database size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground">
                        Example Data
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Select an example dataset (.sav) to get started with your analysis.
                    </p>
                </div>
            </div>

            <div className="relative p-6 flex-grow overflow-y-auto">
                <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                    {Array.from(new Set(exampleFiles.sav.flatMap(f => f.tags))).map(tag => (
                        <Button 
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() => setSelectedTags(prev =>
                                prev.includes(tag) 
                                    ? prev.filter(t => t !== tag) 
                                    : [...prev, tag]
                            )}
                        >
                            {tag}
                        </Button>
                    ))}
                </div>
                
                {isLoading && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
                        <Loader2
                            className="h-8 w-8 animate-spin text-foreground"
                            data-testid="loading-spinner"
                            role="status"
                            aria-label="loading"
                        />
                    </div>
                )}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <h4 className="text-base font-semibold text-popover-foreground mb-1">SPSS Datasets (.sav)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                    Select one of the example datasets to start your analysis.
                </p>
                {renderFileList(filteredFiles, loadDataset, isLoading)}
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>
            </div>
        </div>
    );
};
