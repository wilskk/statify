import React from "react";
import { BaseModalProps } from "@/types/modalTypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const GARCH: React.FC<BaseModalProps> = ({ onClose }) => {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>GARCH Model</DialogTitle>
                    <DialogDescription>
                        Generalized Autoregressive Conditional Heteroskedasticity Model analysis.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4 text-center">
                    <p className="text-muted-foreground">This feature is currently under development.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GARCH;
