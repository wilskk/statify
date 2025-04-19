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
    const [boxplotOption, setBoxplotOption] = useState(initialOptions.boxplotOption);
    const [showStemAndLeaf, setShowStemAndLeaf] = useState(initialOptions.showStemAndLeaf);
    const [showHistogram, setShowHistogram] = useState(initialOptions.showHistogram);
    const [showNormalityPlots, setShowNormalityPlots] = useState(initialOptions.showNormalityPlots);
    const [spreadVsLevelOption, setSpreadVsLevelOption] = useState(initialOptions.spreadVsLevelOption);
    const [transformationPower, setTransformationPower] = useState(initialOptions.transformationPower);

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
            <DialogContent className="max-w-[500px] p-0 bg-[#EBF2F8] border border-[#000000] shadow-md">
                <DialogHeader className="px-4 py-2 border-b border-[#000000] flex-shrink-0 bg-[#EBF2F8]">
                    <DialogTitle className="text-[16px] font-medium">Explore: Plots</DialogTitle>
                </DialogHeader>

                <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Boxplots section */}
                        <div className="border border-[#000000] p-3 bg-[#EBF2F8]">
                            <div className="text-sm underline font-medium mb-2">Boxplots</div>
                            <RadioGroup
                                value={boxplotOption}
                                onValueChange={setBoxplotOption}
                                className="space-y-2"
                            >
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="factorLevels"
                                        id="factorLevels"
                                        className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                    />
                                    <Label htmlFor="factorLevels" className="text-sm cursor-pointer">Factor levels together</Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="dependents"
                                        id="dependents"
                                        className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                    />
                                    <Label htmlFor="dependents" className="text-sm cursor-pointer">Dependents together</Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="none"
                                        id="noneBox"
                                        className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                    />
                                    <Label htmlFor="noneBox" className="text-sm cursor-pointer">None</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Descriptive section */}
                        <div className="border border-[#000000] p-3 bg-[#EBF2F8]">
                            <div className="text-sm underline font-medium mb-2">Descriptive</div>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="stemAndLeaf"
                                        checked={showStemAndLeaf}
                                        onChange={(e) => setShowStemAndLeaf(e.target.checked)}
                                        className="mr-2 border-[#000000]"
                                    />
                                    <Label htmlFor="stemAndLeaf" className="text-sm cursor-pointer">Stem-and-leaf</Label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="histogram"
                                        checked={showHistogram}
                                        onChange={(e) => setShowHistogram(e.target.checked)}
                                        className="mr-2 border-[#000000]"
                                    />
                                    <Label htmlFor="histogram" className="text-sm cursor-pointer">Histogram</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Normality plots section */}
                    <div className="mt-4 border border-[#000000] p-3 bg-[#EBF2F8]">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="normalityPlots"
                                checked={showNormalityPlots}
                                onChange={(e) => setShowNormalityPlots(e.target.checked)}
                                className="mr-2 border-[#000000]"
                            />
                            <Label htmlFor="normalityPlots" className="text-sm cursor-pointer underline">Normality plots with tests</Label>
                        </div>
                    </div>

                    {/* Spread vs Level with Levene Test section */}
                    <div className="mt-4 border border-[#000000] p-3 bg-[#EBF2F8]">
                        <div className="text-sm underline font-medium mb-2">Spread vs Level with Levene Test</div>
                        <RadioGroup
                            value={spreadVsLevelOption}
                            onValueChange={setSpreadVsLevelOption}
                            className="space-y-2"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="none"
                                    id="noneSpread"
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="noneSpread" className="text-sm cursor-pointer">None</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="power"
                                    id="power"
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="power" className="text-sm cursor-pointer">Power estimation</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="transformed"
                                    id="transformed"
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="transformed" className="text-sm cursor-pointer">Transformed</Label>
                                <Select
                                    value={transformationPower}
                                    onValueChange={setTransformationPower}
                                    disabled={spreadVsLevelOption !== 'transformed'}
                                >
                                    <SelectTrigger className="ml-2 h-7 w-28 border-[#000000]">
                                        <SelectValue placeholder="Power" />
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
                                    className="mr-2 border-[#000000] data-[state=checked]:border-[#000000] data-[state=checked]:bg-[#000000]"
                                />
                                <Label htmlFor="untransformed" className="text-sm cursor-pointer">Untransformed</Label>
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

export default PlotsDialog;