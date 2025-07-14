import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OptionsTabProps } from "../types";

const OptionsTab: FC<OptionsTabProps> = ({
    estimateEffectSize,
    setEstimateEffectSize,
    calculateStandardizer,
    setCalculateStandardizer
}) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 border rounded-md p-4">
                {/* Effect Size Option */}
                <div className="flex items-center mb-2">
                    <Checkbox
                        id="estimate-effect-size"
                        checked={estimateEffectSize}
                        onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                        className="mr-2"
                    />
                    <Label htmlFor="estimate-effect-size">Estimate effect sizes</Label>
                </div>

                {/* Standardizer Options */}
                <div>
                    <Label className="text-sm font-medium mb-2 block">Calculate standardizer using:</Label>
                    <RadioGroup
                        value={
                            calculateStandardizer.standardDeviation ? "standardDeviation" :
                            calculateStandardizer.correctedStandardDeviation ? "correctedStandardDeviation" :
                            calculateStandardizer.averageOfVariances ? "averageOfVariances" : ""
                        }
                        onValueChange={(value) => {
                            setCalculateStandardizer({
                                standardDeviation: value === "standardDeviation",
                                correctedStandardDeviation: value === "correctedStandardDeviation",
                                averageOfVariances: value === "averageOfVariances"
                            });
                        }}
                        className="space-y-2"
                        disabled={!estimateEffectSize}
                    >
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="standardDeviation"
                                id="standard-deviation-option"
                                className="mr-2"
                                disabled={!estimateEffectSize}
                            />
                            <Label 
                                htmlFor="standard-deviation-option" 
                                className={!estimateEffectSize ? "text-muted-foreground" : ""}
                            >
                                Standard deviation of the difference
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="correctedStandardDeviation"
                                id="corrected-standard-deviation-option"
                                className="mr-2"
                                disabled={!estimateEffectSize}
                            />
                            <Label 
                                htmlFor="corrected-standard-deviation-option"
                                className={!estimateEffectSize ? "text-muted-foreground" : ""}
                            >
                                Corrected standard deviation of the difference
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="averageOfVariances"
                                id="average-of-variances-option"
                                className="mr-2"
                                disabled={!estimateEffectSize}
                            />
                            <Label 
                                htmlFor="average-of-variances-option"
                                className={!estimateEffectSize ? "text-muted-foreground" : ""}
                            >
                                Average of variances
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;