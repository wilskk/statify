import React, { FC, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StatisticsTabProps {
    centralTendencyOptions: {
        median: boolean;
        mean: boolean;
        weightedMean: boolean;
        confidenceIntervals: boolean;
    };
    setCentralTendencyOptions: React.Dispatch<React.SetStateAction<{
        median: boolean;
        mean: boolean;
        weightedMean: boolean;
        confidenceIntervals: boolean;
    }>>;
    confidenceLevel: string;
    setConfidenceLevel: React.Dispatch<React.SetStateAction<string>>;
    dispersionOptions: {
        aad: boolean;
        cov: boolean;
        prd: boolean;
        medianCenteredCOV: boolean;
        meanCenteredCOV: boolean;
        standardDeviation: boolean;
        range: boolean;
        minimum: boolean;
        maximum: boolean;
    };
    setDispersionOptions: React.Dispatch<React.SetStateAction<{
        aad: boolean;
        cov: boolean;
        prd: boolean;
        medianCenteredCOV: boolean;
        meanCenteredCOV: boolean;
        standardDeviation: boolean;
        range: boolean;
        minimum: boolean;
        maximum: boolean;
    }>>;
}

const StatisticsTab: FC<StatisticsTabProps> = ({
                                                   centralTendencyOptions,
                                                   setCentralTendencyOptions,
                                                   confidenceLevel,
                                                   setConfidenceLevel,
                                                   dispersionOptions,
                                                   setDispersionOptions
                                               }) => {
    // State for concentration index section
    const [lowProportion, setLowProportion] = useState("");
    const [highProportion, setHighProportion] = useState("");
    const [pairs, setPairs] = useState<string[]>([]);
    const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);

    const [percentageOfMedian, setPercentageOfMedian] = useState("");
    const [percentages, setPercentages] = useState<string[]>([]);
    const [selectedPercentageIndex, setSelectedPercentageIndex] = useState<number | null>(null);

    // Handlers for pairs
    const handleAddPair = () => {
        if (lowProportion && highProportion) {
            setPairs([...pairs, `${lowProportion} - ${highProportion}`]);
            setLowProportion("");
            setHighProportion("");
        }
    };

    const handleChangePair = () => {
        if (selectedPairIndex !== null && lowProportion && highProportion) {
            const newPairs = [...pairs];
            newPairs[selectedPairIndex] = `${lowProportion} - ${highProportion}`;
            setPairs(newPairs);
            setSelectedPairIndex(null);
            setLowProportion("");
            setHighProportion("");
        }
    };

    const handleRemovePair = () => {
        if (selectedPairIndex !== null) {
            const newPairs = pairs.filter((_, index) => index !== selectedPairIndex);
            setPairs(newPairs);
            setSelectedPairIndex(null);
        }
    };

    // Handlers for percentages
    const handleAddPercentage = () => {
        if (percentageOfMedian) {
            setPercentages([...percentages, percentageOfMedian]);
            setPercentageOfMedian("");
        }
    };

    const handleChangePercentage = () => {
        if (selectedPercentageIndex !== null && percentageOfMedian) {
            const newPercentages = [...percentages];
            newPercentages[selectedPercentageIndex] = percentageOfMedian;
            setPercentages(newPercentages);
            setSelectedPercentageIndex(null);
            setPercentageOfMedian("");
        }
    };

    const handleRemovePercentage = () => {
        if (selectedPercentageIndex !== null) {
            const newPercentages = percentages.filter((_, index) => index !== selectedPercentageIndex);
            setPercentages(newPercentages);
            setSelectedPercentageIndex(null);
        }
    };

    return (
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
                {/* Central Tendency Section */}
                <div className="border border-[#E6E6E6] rounded-md p-4 bg-[#F7F7F7]">
                    <div className="text-sm font-medium mb-3 text-[#666666]">Central Tendency</div>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="median"
                                checked={centralTendencyOptions.median}
                                onCheckedChange={(checked) =>
                                    setCentralTendencyOptions({...centralTendencyOptions, median: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="median" className="text-sm cursor-pointer">Median</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="mean"
                                checked={centralTendencyOptions.mean}
                                onCheckedChange={(checked) =>
                                    setCentralTendencyOptions({...centralTendencyOptions, mean: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="mean" className="text-sm cursor-pointer">Mean</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="weightedMean"
                                checked={centralTendencyOptions.weightedMean}
                                onCheckedChange={(checked) =>
                                    setCentralTendencyOptions({...centralTendencyOptions, weightedMean: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="weightedMean" className="text-sm cursor-pointer">Weighted Mean</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="confidenceIntervals"
                                checked={centralTendencyOptions.confidenceIntervals}
                                onCheckedChange={(checked) =>
                                    setCentralTendencyOptions({...centralTendencyOptions, confidenceIntervals: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="confidenceIntervals" className="text-sm cursor-pointer">
                                Confidence intervals:
                            </Label>
                        </div>

                        <div className="flex items-center pl-6">
                            <Label htmlFor="confidenceLevel" className="text-sm w-24">
                                Level (%):
                            </Label>
                            <Input
                                id="confidenceLevel"
                                value={confidenceLevel}
                                onChange={(e) => setConfidenceLevel(e.target.value)}
                                className="h-8 w-16 text-sm border-[#CCCCCC]"
                                disabled={!centralTendencyOptions.confidenceIntervals}
                            />
                        </div>
                    </div>
                </div>

                {/* Dispersion Section */}
                <div className="border border-[#E6E6E6] rounded-md p-4 bg-[#F7F7F7]">
                    <div className="text-sm font-medium mb-3 text-[#666666]">Dispersion</div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="aad"
                                checked={dispersionOptions.aad}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, aad: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="aad" className="text-sm cursor-pointer">AAD</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="standardDeviation"
                                checked={dispersionOptions.standardDeviation}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, standardDeviation: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="standardDeviation" className="text-sm cursor-pointer">
                                Standard deviation
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="cov"
                                checked={dispersionOptions.cov}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, cov: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="cov" className="text-sm cursor-pointer">COV</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="range"
                                checked={dispersionOptions.range}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, range: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="range" className="text-sm cursor-pointer">Range</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="prd"
                                checked={dispersionOptions.prd}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, prd: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="prd" className="text-sm cursor-pointer">PRD</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="minimum"
                                checked={dispersionOptions.minimum}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, minimum: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="minimum" className="text-sm cursor-pointer">Minimum</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="medianCenteredCOV"
                                checked={dispersionOptions.medianCenteredCOV}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, medianCenteredCOV: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="medianCenteredCOV" className="text-sm cursor-pointer">
                                Median Centered COV
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="maximum"
                                checked={dispersionOptions.maximum}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, maximum: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="maximum" className="text-sm cursor-pointer">Maximum</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="meanCenteredCOV"
                                checked={dispersionOptions.meanCenteredCOV}
                                onCheckedChange={(checked) =>
                                    setDispersionOptions({...dispersionOptions, meanCenteredCOV: !!checked})
                                }
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="meanCenteredCOV" className="text-sm cursor-pointer">
                                Mean Centered COV
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Concentration Index Section */}
            <div className="border border-[#E6E6E6] rounded-md p-4 mt-6 bg-[#F7F7F7]">
                <div className="text-sm font-medium mb-3 text-[#666666]">Concentration Index</div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Between Proportions Subsection - Updated Layout */}
                    <div className="border border-[#E6E6E6] rounded-md p-3 bg-white space-y-3">
                        <div className="text-sm font-medium">Between Proportions</div>

                        <div className="grid grid-cols-2 gap-2">
                            <Label htmlFor="lowProportion" className="text-sm self-center">
                                Low Proportion:
                            </Label>
                            <Input
                                id="lowProportion"
                                value={lowProportion}
                                onChange={(e) => setLowProportion(e.target.value)}
                                className="h-8 text-sm border-[#CCCCCC]"
                            />
                            <Label htmlFor="highProportion" className="text-sm self-center">
                                High Proportion:
                            </Label>
                            <Input
                                id="highProportion"
                                value={highProportion}
                                onChange={(e) => setHighProportion(e.target.value)}
                                className="h-8 text-sm border-[#CCCCCC]"
                            />
                        </div>

                        <div className="flex items-start gap-2">
                            <div className="w-20 flex-shrink-0 space-y-1">
                                <Label className="text-sm mb-1 block invisible">Actions</Label>
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm border-[#CCCCCC] bg-[#F7F7F7]"
                                    onClick={handleAddPair}
                                    disabled={!lowProportion || !highProportion}
                                >
                                    Add
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm border-[#CCCCCC] bg-[#F7F7F7]"
                                    onClick={handleChangePair}
                                    disabled={selectedPairIndex === null || !lowProportion || !highProportion}
                                >
                                    Change
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm border-[#CCCCCC] bg-[#F7F7F7]"
                                    onClick={handleRemovePair}
                                    disabled={selectedPairIndex === null}
                                >
                                    Remove
                                </Button>
                            </div>

                            <div className="flex-grow">
                                <Label className="text-sm mb-1 block">Pairs:</Label>
                                <div className="border border-[#CCCCCC] h-[100px] overflow-y-auto bg-white rounded-md">
                                    {pairs.length === 0 && <p className="p-2 text-xs text-gray-400 italic">No pairs added</p>}
                                    {pairs.map((pair, index) => (
                                        <div
                                            key={index}
                                            className={`p-1 text-sm cursor-pointer ${selectedPairIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                                            onClick={() => setSelectedPairIndex(index)}
                                        >
                                            {pair}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Within Percentage of Median Subsection - Updated Layout */}
                    <div className="border border-[#E6E6E6] rounded-md p-3 bg-white space-y-3">
                        <div className="text-sm font-medium">Within Percentage of Median</div>

                        <div className="grid grid-cols-2 gap-2">
                            <Label htmlFor="percentageOfMedian" className="text-sm self-center">
                                Percentage of median:
                            </Label>
                            <Input
                                id="percentageOfMedian"
                                value={percentageOfMedian}
                                onChange={(e) => setPercentageOfMedian(e.target.value)}
                                className="h-8 text-sm border-[#CCCCCC]"
                            />
                        </div>

                        <div className="flex items-start gap-2">
                            <div className="w-20 flex-shrink-0 space-y-1">
                                <Label className="text-sm mb-1 block invisible">Actions</Label>
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm border-[#CCCCCC] bg-[#F7F7F7]"
                                    onClick={handleAddPercentage}
                                    disabled={!percentageOfMedian}
                                >
                                    Add
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm border-[#CCCCCC] bg-[#F7F7F7]"
                                    onClick={handleChangePercentage}
                                    disabled={selectedPercentageIndex === null || !percentageOfMedian}
                                >
                                    Change
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm border-[#CCCCCC] bg-[#F7F7F7]"
                                    onClick={handleRemovePercentage}
                                    disabled={selectedPercentageIndex === null}
                                >
                                    Remove
                                </Button>
                            </div>

                            <div className="flex-grow">
                                <Label className="text-sm mb-1 block">Percentages:</Label>
                                <div className="border border-[#CCCCCC] h-[100px] overflow-y-auto bg-white rounded-md">
                                    {percentages.length === 0 && <p className="p-2 text-xs text-gray-400 italic">No percentages added</p>}
                                    {percentages.map((percentage, index) => (
                                        <div
                                            key={index}
                                            className={`p-1 text-sm cursor-pointer ${selectedPercentageIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                                            onClick={() => setSelectedPercentageIndex(index)}
                                        >
                                            {percentage}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;