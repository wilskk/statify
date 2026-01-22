import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OrdinalOutputParams } from "../types/ordinal";

interface Props { params: OrdinalOutputParams, onChange: (params: Partial<OrdinalOutputParams>) => void; }
export const OutputTab: React.FC<Props> = ({ params, onChange }) => {
    const handleDisplayChange = (key: keyof typeof params.display, checked: boolean) => {
        onChange({ display: { ...params.display, [key]: checked } });
    };
    const handleSavedChange = (key: keyof typeof params.savedVariables, checked: boolean) => {
        onChange({ savedVariables: { ...params.savedVariables, [key]: checked } });
    };
    return (
        <div className="grid grid-cols-2 gap-8 py-4 h-full overflow-y-auto">
            <div className="space-y-6">
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">
                      Display
                    </h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="gof" checked={params.display.goodnessOfFit} onCheckedChange={(c) => handleDisplayChange('goodnessOfFit', !!c)} />
                            <Label htmlFor="gof">Goodness of fit statistics</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sum" checked={params.display.summaryStatistics} onCheckedChange={(c) => handleDisplayChange('summaryStatistics', !!c)} />
                            <Label htmlFor="sum">Summary statistics</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                         <Checkbox id="param" checked={params.display.parameterEstimates} onCheckedChange={(c) => handleDisplayChange('parameterEstimates', !!c)} />
                            <Label htmlFor="param">Parameter estimates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="parallel" checked={params.display.testOfParallelLines} onCheckedChange={(c) => handleDisplayChange('testOfParallelLines', !!c)} />
                            <Label htmlFor="parallel">Test of parallel lines</Label>
                    </div>
            </div>
            <div className="space-y-6">
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">
                      Saved Variables
                    </h4>
                    <div className="flex items-center space-x-2">
                    <Checkbox id="predCat" checked={params.savedVariables.predictedCategory} onCheckedChange={(c) => handleSavedChange('predictedCategory', !!c)} />
                        <Label htmlFor="predCat">Predicted Category</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Checkbox id="predProb" checked={params.savedVariables.predictedProbability} onCheckedChange={(c) => handleSavedChange('predictedProbability', !!c)} />
                        <Label htmlFor="predProb">Predicted Probability</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                         <Checkbox id="param" checked={params.display.parameterEstimates} onCheckedChange={(c) => handleDisplayChange('parameterEstimates', !!c)} />
                            <Label htmlFor="param">Parameter estimates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="parallel" checked={params.display.testOfParallelLines} onCheckedChange={(c) => handleDisplayChange('testOfParallelLines', !!c)} />
                            <Label htmlFor="parallel">Test of parallel lines</Label>
                    </div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">
                      Print Log-Likelihood
                    </h4>
                    <div className="flex items-center space-x-2">
                    <RadioGroup value={params.printLogLikelihood} onValueChange={(value: any) => onChange({ printLogLikelihood: value })}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Including" id="including" /><Label htmlFor="including">Including multinomial constant</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Excluding" id="excluding" /><Label htmlFor="excluding">Excluding multinomial constant</Label></div>
                    </RadioGroup>
                    </div>
            </div>
        </div>
    );
};