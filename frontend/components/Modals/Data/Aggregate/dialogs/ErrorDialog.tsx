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
            <DialogContent className="max-w-[450px] p-3">
                <DialogHeader className="p-0 mb-2">
                    <DialogTitle>IBM SPSS Statistics 25</DialogTitle>
                </DialogHeader>
                <div className="flex gap-4">
                    <AlertCircle className="h-10 w-10 text-primary" />
                    <div>
                        <p className="text-sm mt-2 text-foreground">{errorMessage}</p>
                    </div>
                </div>

                <DialogFooter className="flex justify-center mt-4">
                    <Button
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => onOpenChange(false)}
                    >
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { ErrorDialog }