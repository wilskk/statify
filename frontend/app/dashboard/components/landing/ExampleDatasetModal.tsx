"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { File, Database, Loader2 } from 'lucide-react';
import { useExampleDatasetLoader } from './hooks/useExampleDatasetLoader';
import { exampleFiles } from './example-datasets';

interface ExampleDatasetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const renderFileList = (
    files: { name: string; path: string }[],
    handleFileClick: (path: string) => void,
    isLoading: boolean
) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
        {files.map((file) => (
            <Button
                key={file.path}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleFileClick(file.path)}
                disabled={isLoading}
            >
                <File className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate text-sm">{file.name}</span>
            </Button>
        ))}
    </div>
);

export const ExampleDatasetModal: React.FC<ExampleDatasetModalProps> = ({ isOpen, onClose }) => {
    const { isLoading, error, loadDataset } = useExampleDatasetLoader(onClose);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[525px] bg-popover text-popover-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Database className="h-5 w-5 mr-2 text-primary"/> Dataset Contoh
                    </DialogTitle>
                    <DialogDescription>
                        Pilih dataset contoh (.sav) untuk memulai analisis. Data akan dimuat ke dalam proyek baru.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {isLoading && (
                        <div className="absolute inset-0 bg-popover/70 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-popover-foreground" />
                        </div>
                    )}
                    {error && (
                        <p className="text-destructive-foreground text-sm px-4 py-2 bg-destructive rounded border border-destructive/50">{error}</p>
                    )}
                    <div className="mt-6">
                        <DialogTitle className="text-lg font-medium text-popover-foreground">Dataset SPSS (.sav)</DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-muted-foreground mb-4">
                            Pilih salah satu dataset contoh untuk memulai analisis.
                        </DialogDescription>
                        {renderFileList(exampleFiles.sav, loadDataset, isLoading)}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};