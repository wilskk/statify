import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatisticsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const StatisticsTab: FC<StatisticsTabProps> = ({
    chiSquare,
    correlations,
    phiAndCramersV,
    gamma,
    kendallTauB,
    kendallTauC,
    risk,
    setChiSquare,
    setCorrelations,
    setPhiAndCramersV,
    setGamma,
    setKendallTauB,
    setKendallTauC,
    setRisk,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const chiSquareStep = getStepIndex('crosstabs-chi-square-correlations');
    const nominalStep = getStepIndex('crosstabs-nominal-statistics');
    const ordinalStep = getStepIndex('crosstabs-ordinal-statistics');

    return (
        <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
                <div id="crosstabs-chi-square-correlations" className="bg-card border border-border rounded-md p-4 relative">
                    <div className="flex items-center mb-3">
                        <Checkbox
                            id="chiSquare"
                            checked={chiSquare}
                            onCheckedChange={(checked) => setChiSquare(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="chiSquare" className="text-sm cursor-pointer">
                            Chi-square
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="correlations"
                            checked={correlations}
                            onCheckedChange={(checked) => setCorrelations(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="correlations" className="text-sm cursor-pointer">
                            Correlations
                        </Label>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === chiSquareStep} />
                </div>

                <div id="crosstabs-nominal-statistics" className="bg-card border border-border rounded-md p-4 relative">
                    <div className="text-sm font-medium mb-3">Nominal</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="phiAndCramersV"
                                checked={phiAndCramersV}
                                onCheckedChange={(checked) => setPhiAndCramersV(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="phiAndCramersV" className="text-sm cursor-pointer">
                                Phi and Cramer&apos;s V
                            </Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === nominalStep} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
                <div id="crosstabs-ordinal-statistics" className="bg-card border border-border rounded-md p-4 relative">
                    <div className="text-sm font-medium mb-3">Ordinal</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="gamma"
                                checked={gamma}
                                onCheckedChange={(checked) => setGamma(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="gamma" className="text-sm cursor-pointer">
                                Gamma
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="kendallTauB"
                                checked={kendallTauB}
                                onCheckedChange={(checked) => setKendallTauB(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="kendallTauB" className="text-sm cursor-pointer">
                                Kendall&apos;s tau-b
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="kendallTauC"
                                checked={kendallTauC}
                                onCheckedChange={(checked) => setKendallTauC(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="kendallTauC" className="text-sm cursor-pointer">
                                Kendall&apos;s tau-c
                            </Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === ordinalStep} />
                </div>

                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Strength of Association</div>
                    <div className="flex items-center">
                        <Checkbox
                            id="risk"
                            checked={risk}
                            onCheckedChange={(checked) => setRisk(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="risk" className="text-sm cursor-pointer">
                            Risk
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;