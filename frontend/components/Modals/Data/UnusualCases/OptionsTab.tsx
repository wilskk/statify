import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface OptionsTabProps {
    identificationCriteria: string;
    setIdentificationCriteria: (value: string) => void;
    percentageValue: string;
    setPercentageValue: (value: string) => void;
    fixedNumber: string;
    setFixedNumber: (value: string) => void;
    useMinimumValue: boolean;
    setUseMinimumValue: (value: boolean) => void;
    cutoffValue: string;
    setCutoffValue: (value: string) => void;
    minPeerGroups: string;
    setMinPeerGroups: (value: string) => void;
    maxPeerGroups: string;
    setMaxPeerGroups: (value: string) => void;
    maxReasons: string;
    setMaxReasons: (value: string) => void;
}

const OptionsTab: React.FC<OptionsTabProps> = ({
                                                   identificationCriteria,
                                                   setIdentificationCriteria,
                                                   percentageValue,
                                                   setPercentageValue,
                                                   fixedNumber,
                                                   setFixedNumber,
                                                   useMinimumValue,
                                                   setUseMinimumValue,
                                                   cutoffValue,
                                                   setCutoffValue,
                                                   minPeerGroups,
                                                   setMinPeerGroups,
                                                   maxPeerGroups,
                                                   setMaxPeerGroups,
                                                   maxReasons,
                                                   setMaxReasons
                                               }) => {
    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 min-w-0">
                <div className="w-full lg:w-3/5 flex-1 min-w-0 border border-border rounded-md p-6">
                    <div className="text-sm font-medium mb-4">Criteria for Identifying Unusual Cases</div>

                    <div className="space-y-4">
                        <RadioGroup value={identificationCriteria} onValueChange={setIdentificationCriteria} className="space-y-4">
                            <div>
                                <div className="flex items-center">
                                    <RadioGroupItem value="percentage" id="percentageCriteria" className="mr-2" />
                                    <Label htmlFor="percentageCriteria" className="text-sm cursor-pointer">
                                        Percentage of cases with highest anomaly index values
                                    </Label>
                                </div>
                                <div className="ml-6 mt-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="percentageValue" className="text-xs mr-2">
                                            Percentage:
                                        </Label>
                                        <Input
                                            id="percentageValue"
                                            value={percentageValue}
                                            onChange={(e) => setPercentageValue(e.target.value)}
                                            className="h-8 text-sm w-24"
                                            disabled={identificationCriteria !== "percentage"}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center">
                                    <RadioGroupItem value="fixed" id="fixedNumberCriteria" className="mr-2" />
                                    <Label htmlFor="fixedNumberCriteria" className="text-sm cursor-pointer">
                                        Fixed number of cases with highest anomaly index values
                                    </Label>
                                </div>
                                <div className="ml-6 mt-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="fixedNumber" className="text-xs mr-2">
                                            Number:
                                        </Label>
                                        <Input
                                            id="fixedNumber"
                                            value={fixedNumber}
                                            onChange={(e) => setFixedNumber(e.target.value)}
                                            className="h-8 text-sm w-24"
                                            disabled={identificationCriteria !== "fixed"}
                                        />
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>

                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="useMinimumValue"
                                    checked={useMinimumValue}
                                    onCheckedChange={(checked) => setUseMinimumValue(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="useMinimumValue" className="text-sm cursor-pointer">
                                    Identify only cases whose anomaly index value meets or exceeds a minimum value
                                </Label>
                            </div>
                            <div className="ml-6 mt-2">
                                <div className="flex items-center">
                                    <Label htmlFor="cutoffValue" className="text-xs mr-2">
                                        Cutoff:
                                    </Label>
                                    <Input
                                        id="cutoffValue"
                                        value={cutoffValue}
                                        onChange={(e) => setCutoffValue(e.target.value)}
                                        className="h-8 text-sm w-24"
                                        disabled={!useMinimumValue}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/5 flex-1 min-w-0 border border-border rounded-md p-6">
                    <div className="text-sm font-medium mb-4">Number of Peer Groups</div>

                    <div className="space-y-4">
                        <div className="flex items-center">
                            <Label htmlFor="minPeerGroups" className="text-xs mr-2 w-16">
                                Minimum:
                            </Label>
                            <Input
                                id="minPeerGroups"
                                value={minPeerGroups}
                                onChange={(e) => setMinPeerGroups(e.target.value)}
                                className="h-8 text-sm w-24"
                            />
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="maxPeerGroups" className="text-xs mr-2 w-16">
                                Maximum:
                            </Label>
                            <Input
                                id="maxPeerGroups"
                                value={maxPeerGroups}
                                onChange={(e) => setMaxPeerGroups(e.target.value)}
                                className="h-8 text-sm w-24"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center">
                    <Label htmlFor="maxReasons" className="text-sm mr-2">
                        Maximum Number of Reasons:
                    </Label>
                    <Input
                        id="maxReasons"
                        value={maxReasons}
                        onChange={(e) => setMaxReasons(e.target.value)}
                        className="h-8 text-sm w-24"
                    />
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                    Specify the number of reasons reported in output and added to the active dataset if reason variables are saved. The value
                    is adjusted downward if it exceeds the number of analysis variables.
                </p>
            </div>
        </>
    );
};

export default OptionsTab;