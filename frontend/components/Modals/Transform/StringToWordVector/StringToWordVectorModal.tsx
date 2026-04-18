import React from "react";
import { BaseModalProps } from "@/types/modalTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStringToWordVector } from "./hooks/useStringToWordVector";
import { VariablesTab } from "./VariablesTab";
import { OptionsTab } from "./OptionsTab";
import { toast } from "sonner"; // For validation alerts if needed

/**
 * Komponen Content 
 * Berisi tabulasi dan logic, namun TIDAK membungkus dirinya sendiri dengan `Dialog`.
 * Ini agar Sidebar bisa merendernya dengan lebar penuh dengan rapi!.
 */
const StringToWordVectorContent: React.FC<BaseModalProps> = ({ onClose }) => {
    const { 
        availableVariables,
        selectedVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToTarget,
        removeTarget,
        config, 
        setConfig 
    } = useStringToWordVector();
    
    // UI state similar to Binary Logistic
    const [activeTab, setActiveTab] = React.useState("variables");

    const handleRun = () => {
        if (!selectedVariable) {
            toast.error("Please select a target variable first.");
            return;
        }
        console.log("Menjalankan worker dengan config:", config, "Target:", selectedVariable);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-grow px-6 py-3 overflow-y-auto min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                        <TabsTrigger value="options">Options</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex-grow min-h-0 overflow-hidden">
                        <TabsContent value="variables" className="h-full mt-0 pt-2">
                            <VariablesTab 
                                availableVariables={availableVariables}
                                selectedVariable={selectedVariable}
                                highlightedVariable={highlightedVariable}
                                setHighlightedVariable={setHighlightedVariable}
                                onMoveToTarget={moveToTarget}
                                onRemoveTarget={removeTarget}
                            />
                        </TabsContent>
                        
                        <TabsContent value="options" className="h-full mt-0 pt-2">
                            <OptionsTab 
                                config={config}
                                setConfig={setConfig}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Footer Form Action Buttons */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0 space-x-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleRun}>Run Computation</Button>
            </div>
        </div>
    );
};

/**
 * Entry Wrapper:
 * Mengidentifikasi apakah dipanggil mode "dialog" atau "sidebar"
 * berdasarkan logic yang dieksekusi modal manager.
 */
const StringToWordVectorModal: React.FC<BaseModalProps> = (props) => {
    // Mode Sidebar Kanan (default sekarang)
    if (props.containerType === "sidebar") {
        return <StringToWordVectorContent {...props} />;
    }

    // Fallback bila dibuka mode dialog tengah
    return (
        <Dialog open onOpenChange={props.onClose}>
            <DialogContent className="max-w-4xl p-0 h-[80vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>String to Word Vector</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden relative">
                    <StringToWordVectorContent {...props} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StringToWordVectorModal;
