import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ErrorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errorMessage: string | null;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
    open,
    onOpenChange,
    errorMessage
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="w-full p-0 border border-border rounded-md"
                style={{ 
                    maxWidth: "450px",
                    width: "100%",
                    maxHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-3 py-2 flex-shrink-0">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-sm font-semibold">
                            Error
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />
                <div className="p-3 flex-grow overflow-y-auto">
                    <div className="flex gap-3 items-start">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs">{errorMessage}</p>
                    </div>
                </div>
                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-3 py-2 flex-shrink-0">
                    <div className="flex ml-auto">
                        <Button 
                            size="sm" 
                            className="h-7 text-xs" 
                            onClick={() => onOpenChange(false)}
                        >
                            OK
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { ErrorDialog }