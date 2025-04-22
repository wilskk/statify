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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlotsDialogProps {
    initialOptions: {
        boxplotOption: string;
        showStemAndLeaf: boolean;
        showHistogram: boolean;
        showNormalityPlots: boolean;
        spreadVsLevelOption: string;
        transformationPower: string;
    };
    onClose: () => void;
    onSubmit: (options: any) => void;
}

const PlotsDialog: FC<PlotsDialogProps> = ({ initialOptions, onClose, onSubmit }) => {
    const [boxplotOption, setBoxplotOption] = useState<string>(initialOptions.boxplotOption || "factorLevels");
    const [showStemAndLeaf, setShowStemAndLeaf] = useState<boolean>(initialOptions.showStemAndLeaf === undefined ? true : initialOptions.showStemAndLeaf);
    const [showHistogram, setShowHistogram] = useState<boolean>(initialOptions.showHistogram || false);
    const [showNormalityPlots, setShowNormalityPlots] = useState<boolean>(initialOptions.showNormalityPlots || false);
    const [spreadVsLevelOption, setSpreadVsLevelOption] = useState<string>(initialOptions.spreadVsLevelOption || "none");
    const [transformationPower, setTransformationPower] = useState<string>(initialOptions.transformationPower || "natural");

    const handleSubmit = () => {
        onSubmit({
            boxplotOption,
            showStemAndLeaf,
            showHistogram,
            showNormalityPlots,
            spreadVsLevelOption,
            transformationPower
        });
    };

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[550px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md">
                <DialogHeader className="px-4 py-3 border-b border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <DialogTitle className="text-lg font-semibold">Explore: Plots</DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-5">
                        <div className="border border-[#E6E6E6] rounded-md p-4 bg-white">
                            <h3 className="text-sm font-medium mb-3 text-[#333333] underline">Boxplots</h3>
                            <RadioGroup
                                value={boxplotOption}
                                onValueChange={setBoxplotOption}
                                className="space-y-2"
                            >
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="factorLevels"
                                        id="factorLevels"
                                        className="mr-2 border-[#CCCCCC] h-4 w-4"
                                    />
                                    <Label htmlFor="factorLevels" className="text-sm cursor-pointer">Factor levels together</Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="dependents"
                                        id="dependents"
                                        className="mr-2 border-[#CCCCCC] h-4 w-4"
                                    />
                                    <Label htmlFor="dependents" className="text-sm cursor-pointer">Dependents together</Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="none"
                                        id="noneBox"
                                        className="mr-2 border-[#CCCCCC] h-4 w-4"
                                    />
                                    <Label htmlFor="noneBox" className="text-sm cursor-pointer">None</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="border border-[#E6E6E6] rounded-md p-4 bg-white">
                            <h3 className="text-sm font-medium mb-3 text-[#333333] underline">Descriptive</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="stemAndLeaf"
                                        checked={showStemAndLeaf}
                                        onChange={(e) => setShowStemAndLeaf(e.target.checked)}
                                        className="mr-2 border-[#CCCCCC] h-4 w-4"
                                    />
                                    <Label htmlFor="stemAndLeaf" className="text-sm cursor-pointer">Stem-and-leaf</Label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="histogram"
                                        checked={showHistogram}
                                        onChange={(e) => setShowHistogram(e.target.checked)}
                                        className="mr-2 border-[#CCCCCC] h-4 w-4"
                                    />
                                    <Label htmlFor="histogram" className="text-sm cursor-pointer">Histogram</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-4 bg-white mb-5">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="normalityPlots"
                                checked={showNormalityPlots}
                                onChange={(e) => setShowNormalityPlots(e.target.checked)}
                                className="mr-2 border-[#CCCCCC] h-4 w-4"
                            />
                            <Label htmlFor="normalityPlots" className="text-sm cursor-pointer underline">Normality plots with tests</Label>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-4 bg-white">
                        <h3 className="text-sm font-medium mb-3 text-[#333333] underline">Spread vs Level with Levene Test</h3>
                        <RadioGroup
                            value={spreadVsLevelOption}
                            onValueChange={setSpreadVsLevelOption}
                            className="space-y-2"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="none"
                                    id="noneSpread"
                                    className="mr-2 border-[#CCCCCC] h-4 w-4"
                                />
                                <Label htmlFor="noneSpread" className="text-sm cursor-pointer">None</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="power"
                                    id="power"
                                    className="mr-2 border-[#CCCCCC] h-4 w-4"
                                />
                                <Label htmlFor="power" className="text-sm cursor-pointer">Power estimation</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="transformed"
                                    id="transformed"
                                    className="mr-2 border-[#CCCCCC] h-4 w-4"
                                />
                                <Label htmlFor="transformed" className="text-sm cursor-pointer">Transformed</Label>
                                <Label className="text-sm ml-2 mr-1">Power:</Label>
                                <Select
                                    value={transformationPower}
                                    onValueChange={setTransformationPower}
                                    disabled={spreadVsLevelOption !== 'transformed'}
                                >
                                    <SelectTrigger className="h-7 w-28 border-[#CCCCCC] text-xs">
                                        <SelectValue placeholder="Select power" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="natural">Natural log</SelectItem>
                                        <SelectItem value="log10">Log base 10</SelectItem>
                                        <SelectItem value="sqrt">Square root</SelectItem>
                                        <SelectItem value="recip">Reciprocal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="untransformed"
                                    id="untransformed"
                                    className="mr-2 border-[#CCCCCC] h-4 w-4"
                                />
                                <Label htmlFor="untransformed" className="text-sm cursor-pointer">Untransformed</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter className="px-4 py-3 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <div className="flex justify-end space-x-2">
                        <Button
                            className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                            onClick={handleSubmit}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        >
                            Help
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PlotsDialog;