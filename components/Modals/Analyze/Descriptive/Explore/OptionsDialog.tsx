"use client";
import React, { FC, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OptionsDialogProps {
    initialOptions: {
        missingValuesOption: string;
    };
    onClose: () => void;
    onSubmit: (options: any) => void;
}

const OptionsDialog: FC<OptionsDialogProps> = ({ initialOptions, onClose, onSubmit }) => {
    const [missingValuesOption, setMissingValuesOption] = useState(initialOptions.missingValuesOption);

    const handleSubmit = () => {
        onSubmit({
            missingValuesOption
        });
    };

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[400px] p-0 bg-[#EBF2F8] border border-[#000000] shadow-md">
                <DialogHeader className="px-4 py-2 border-b border-[#000000] flex-shrink-0 bg-[#EBF2F8]">
                    <DialogTitle className="text-[16px] font-medium">Explore: Options</DialogTitle>
                </DialogHeader>

                <div className="p-4">
                    <div className="border border-[#000000] p-3 bg-[#EBF2F8]">
                        <div className="text-sm underline font-medium mb-2">Missing values</div>
                        <RadioGroup
                            value={missingValuesOption}
                            onValueChange={setMissingValuesOption}
                            className="space-y-2"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="excludeListwise"
                                    id="excludeListwise"
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="excludeListwise" className="text-sm cursor-pointer underline">Exclude cases listwise</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="excludePairwise"
                                    id="excludePairwise"
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="excludePairwise" className="text-sm cursor-pointer underline">Exclude cases pairwise</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="reportValues"
                                    id="reportValues"
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="reportValues" className="text-sm cursor-pointer underline">Report values</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter className="px-4 py-2 border-t border-[#000000] bg-[#EBF2F8] flex-shrink-0">
                    <div className="flex justify-end space-x-2">
                        <Button
                            className="px-6 py-1 h-8 bg-[#ADD8E6] border border-[#000000] hover:bg-[#87CEEB] text-black"
                            onClick={handleSubmit}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-1 h-8 bg-[#ADD8E6] border border-[#000000] hover:bg-[#87CEEB] text-black"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-1 h-8 bg-[#ADD8E6] border border-[#000000] hover:bg-[#87CEEB] text-black"
                        >
                            Help
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OptionsDialog;