import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionsTabProps } from "../types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const OptionsTab: FC<OptionsTabProps> = ({
    correlationCoefficient,
    setCorrelationCoefficient,
    testOfSignificance,
    setTestOfSignificance,
    flagSignificantCorrelations,
    setFlagSignificantCorrelations,
    showOnlyTheLowerTriangle,
    setShowOnlyTheLowerTriangle,
    showDiagonal,
    setShowDiagonal,
    partialCorrelationKendallsTauB,
    setPartialCorrelationKendallsTauB,
    statisticsOptions,
    setStatisticsOptions,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
    testVariables,
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const correlationCoefficientStepIndex = getStepIndex("correlation-coefficient-section");
    const testOfSignificanceStepIndex = getStepIndex("test-of-significance-section");
    const flagSignificantCorrelationsStepIndex = getStepIndex("flag-significant-correlations-section");
    const showOnlyTheLowerTriangleStepIndex = getStepIndex("show-only-the-lower-triangle-section");
    const showDiagonalStepIndex = getStepIndex("show-diagonal-section");
    const partialCorrelationKendallsTauBStepIndex = getStepIndex("partial-correlation-kendalls-tau-b-section");
    const statisticsOptionsStepIndex = getStepIndex("statistics-options-section");

    return (
        <div className="space-y-6">
            <div id="correlation-coefficient-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Correlation Coefficient</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="pearson"
                            checked={correlationCoefficient.pearson}
                            onCheckedChange={(checked) => 
                                setCorrelationCoefficient({ ...correlationCoefficient, pearson: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="pearson" className="text-sm cursor-pointer">Pearson</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="kendalls-tau-b"
                            checked={correlationCoefficient.kendallsTauB}
                            onCheckedChange={(checked) => 
                                setCorrelationCoefficient({ ...correlationCoefficient, kendallsTauB: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="kendalls-tau-b" className="text-sm cursor-pointer">Kendalls Tau-b</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="spearman"
                            checked={correlationCoefficient.spearman}
                            onCheckedChange={(checked) => 
                                setCorrelationCoefficient({ ...correlationCoefficient, spearman: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="spearman" className="text-sm cursor-pointer">Spearman</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === correlationCoefficientStepIndex} />
            </div>

            <div id="test-of-significance-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Test of Significance</div>    
                    <RadioGroup
                        value={testOfSignificance.twoTailed ? "twoTailed" : "oneTailed"}
                        className="grid grid-cols-2 gap-x-6 gap-y-3"
                        onValueChange={(value) => {
                            setTestOfSignificance({
                                ...testOfSignificance,
                                twoTailed: value === "twoTailed",
                                oneTailed: value === "oneTailed"
                            });
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="twoTailed"
                                id="twoTailed"
                                className="h-4 w-4 text-blue-600"
                            />
                            <Label htmlFor="twoTailed" className="text-sm font-medium text-gray-700">
                                Two-tailed
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="oneTailed"
                                id="oneTailed"
                                className="h-4 w-4 text-blue-600"
                            />
                            <Label htmlFor="oneTailed" className="text-sm font-medium text-gray-700">
                                One-tailed
                            </Label>
                        </div>
                    </RadioGroup>
                <ActiveElementHighlight active={tourActive && currentStep === testOfSignificanceStepIndex} />
            </div>

            <div id="flag-significant-correlations-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="flag-significant-correlations"
                            checked={flagSignificantCorrelations}
                            onCheckedChange={(checked) => 
                                setFlagSignificantCorrelations(!!checked)
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="flag-significant-correlations" className="text-sm cursor-pointer">Flag Significant Correlations</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === flagSignificantCorrelationsStepIndex} />
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="show-only-the-lower-triangle"
                            checked={showOnlyTheLowerTriangle}
                            onCheckedChange={(checked) => 
                                setShowOnlyTheLowerTriangle(!!checked)
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="show-only-the-lower-triangle" className="text-sm cursor-pointer">Show Only the Lower Triangle</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === showOnlyTheLowerTriangleStepIndex} />
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="show-diagonal"
                            checked={showDiagonal}
                            onCheckedChange={(checked) => 
                                setShowDiagonal(!!checked)
                            }
                            className="mr-2"
                            disabled={!showOnlyTheLowerTriangle}
                        />
                        <Label htmlFor="show-diagonal" className="text-sm cursor-pointer">Show Diagonal</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === showDiagonalStepIndex} />
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="partial-correlation-kendalls-tau-b"
                            checked={partialCorrelationKendallsTauB}
                            onCheckedChange={(checked) => setPartialCorrelationKendallsTauB(!!checked)}
                            className="mr-2"
                            disabled={!correlationCoefficient.kendallsTauB || testVariables.length < 3}
                        />
                        <Label htmlFor="partial-correlation-kendalls-tau-b" className="text-sm cursor-pointer">Partial Correlation (Kendalls Tau-b)</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === partialCorrelationKendallsTauBStepIndex} />
                    </div>
                </div>
            </div>
            <div id="statistics-options-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Statistics</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="means-and-standard-deviations"
                            checked={statisticsOptions.meansAndStandardDeviations}
                            onCheckedChange={(checked) => 
                                setStatisticsOptions({ ...statisticsOptions, meansAndStandardDeviations: !!checked })
                            }
                            disabled={!correlationCoefficient.pearson}
                            className="mr-2"
                        />
                        <Label htmlFor="means-and-standard-deviations" className="text-sm cursor-pointer">Means and Standard Deviations</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="cross-product-deviations-and-covariances"
                            checked={statisticsOptions.crossProductDeviationsAndCovariances}
                            onCheckedChange={(checked) => 
                                setStatisticsOptions({ ...statisticsOptions, crossProductDeviationsAndCovariances: !!checked })
                            }
                            disabled={!correlationCoefficient.pearson}
                            className="mr-2"
                        />
                        <Label htmlFor="cross-product-deviations-and-covariances" className="text-sm cursor-pointer">Cross Product Deviations and Covariances</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === statisticsOptionsStepIndex} />
            </div>
            {/* <div className="mb-4">
                <div className="text-sm font-medium mb-2">Missing Values</div>
                <div className="border p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="radio"
                            id="exclude-cases"
                            name="missing-values"
                            checked={true}
                            readOnly
                            className="h-4 w-4 text-black border-[#CCCCCC]"
                        />
                        <Label htmlFor="exclude-cases" className="text-sm">Exclude cases test-by-test</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="exclude-listwise"
                            name="missing-values"
                            checked={false}
                            readOnly
                            className="h-4 w-4 text-black border-[#CCCCCC]"
                        />
                        <Label htmlFor="exclude-listwise" className="text-sm">Exclude cases listwise</Label>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default OptionsTab;