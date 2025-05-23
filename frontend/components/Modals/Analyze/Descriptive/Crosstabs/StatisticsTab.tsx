import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface StatisticsTabProps {
    chiSquare: boolean;
    correlations: boolean;
    contingencyCoefficient: boolean;
    phiAndCramersV: boolean;
    lambda: boolean;
    uncertaintyCoefficient: boolean;
    gamma: boolean;
    somersD: boolean;
    kendallTauB: boolean;
    kendallTauC: boolean;
    eta: boolean;
    kappa: boolean;
    risk: boolean;
    mcNemar: boolean;
    cochranMantelHaenszel: boolean;
    commonOddsRatio: string;
    setChiSquare: (value: boolean) => void;
    setCorrelations: (value: boolean) => void;
    setContingencyCoefficient: (value: boolean) => void;
    setPhiAndCramersV: (value: boolean) => void;
    setLambda: (value: boolean) => void;
    setUncertaintyCoefficient: (value: boolean) => void;
    setGamma: (value: boolean) => void;
    setSomersD: (value: boolean) => void;
    setKendallTauB: (value: boolean) => void;
    setKendallTauC: (value: boolean) => void;
    setEta: (value: boolean) => void;
    setKappa: (value: boolean) => void;
    setRisk: (value: boolean) => void;
    setMcNemar: (value: boolean) => void;
    setCochranMantelHaenszel: (value: boolean) => void;
    setCommonOddsRatio: (value: string) => void;
    containerType?: "dialog" | "sidebar";
}

const StatisticsTab: FC<StatisticsTabProps> = ({
                                                   chiSquare,
                                                   correlations,
                                                   contingencyCoefficient,
                                                   phiAndCramersV,
                                                   lambda,
                                                   uncertaintyCoefficient,
                                                   gamma,
                                                   somersD,
                                                   kendallTauB,
                                                   kendallTauC,
                                                   eta,
                                                   kappa,
                                                   risk,
                                                   mcNemar,
                                                   cochranMantelHaenszel,
                                                   commonOddsRatio,
                                                   setChiSquare,
                                                   setCorrelations,
                                                   setContingencyCoefficient,
                                                   setPhiAndCramersV,
                                                   setLambda,
                                                   setUncertaintyCoefficient,
                                                   setGamma,
                                                   setSomersD,
                                                   setKendallTauB,
                                                   setKendallTauC,
                                                   setEta,
                                                   setKappa,
                                                   setRisk,
                                                   setMcNemar,
                                                   setCochranMantelHaenszel,
                                                   setCommonOddsRatio,
                                                   containerType = "dialog"
                                               }) => {
    return (
        <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-md p-4">
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
                </div>

                <div className="bg-card border border-border rounded-md p-4">
                    <div className="flex items-center mb-3">
                        <Checkbox
                            id="cochranMantelHaenszel"
                            checked={cochranMantelHaenszel}
                            onCheckedChange={(checked) => setCochranMantelHaenszel(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="cochranMantelHaenszel" className="text-sm cursor-pointer">
                            Cochran&apos;s and Mantel-Haenszel statistics
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Label htmlFor="commonOddsRatio" className="text-sm mr-2">
                            Test common odds ratio equals:
                        </Label>
                        <Input
                            id="commonOddsRatio"
                            value={commonOddsRatio}
                            onChange={(e) => setCommonOddsRatio(e.target.value)}
                            className="h-8 text-sm w-16"
                            disabled={!cochranMantelHaenszel}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Nominal</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="contingencyCoefficient"
                                checked={contingencyCoefficient}
                                onCheckedChange={(checked) => setContingencyCoefficient(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="contingencyCoefficient" className="text-sm cursor-pointer">
                                Contingency coefficient
                            </Label>
                        </div>

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

                        <div className="flex items-center">
                            <Checkbox
                                id="lambda"
                                checked={lambda}
                                onCheckedChange={(checked) => setLambda(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="lambda" className="text-sm cursor-pointer">
                                Lambda
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="uncertaintyCoefficient"
                                checked={uncertaintyCoefficient}
                                onCheckedChange={(checked) => setUncertaintyCoefficient(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="uncertaintyCoefficient" className="text-sm cursor-pointer">
                                Uncertainty coefficient
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-md p-4">
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
                                id="somersD"
                                checked={somersD}
                                onCheckedChange={(checked) => setSomersD(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="somersD" className="text-sm cursor-pointer">
                                Somers&apos; d
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
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Nominal by Interval</div>
                    <div className="flex items-center">
                        <Checkbox
                            id="eta"
                            checked={eta}
                            onCheckedChange={(checked) => setEta(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="eta" className="text-sm cursor-pointer">
                            Eta
                        </Label>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Agreement</div>
                    <div className="flex items-center">
                        <Checkbox
                            id="kappa"
                            checked={kappa}
                            onCheckedChange={(checked) => setKappa(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="kappa" className="text-sm cursor-pointer">
                            Kappa
                        </Label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
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

                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Test for Paired Samples</div>
                    <div className="flex items-center">
                        <Checkbox
                            id="mcNemar"
                            checked={mcNemar}
                            onCheckedChange={(checked) => setMcNemar(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="mcNemar" className="text-sm cursor-pointer">
                            McNemar
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;