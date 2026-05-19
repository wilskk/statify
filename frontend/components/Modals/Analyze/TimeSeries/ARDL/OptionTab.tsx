import type { FC } from "react";
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Variable } from "@/types/Variable";

interface OptionTabProps {
    pOrder: number;
    qOrders: number[];
    independentVariables: Variable[];
    handlePOrder: (value: number) => void;
    handleQOrders: (value: number[]) => void;
}

const OptionTab: FC<OptionTabProps> = ({
    pOrder,
    qOrders,
    independentVariables,
    handlePOrder,
    handleQOrders,
}) => {
    // Auto-update qOrders when number of X variables changes
    useEffect(() => {
        const nVars = independentVariables.length;
        if (nVars > 0 && qOrders.length !== nVars) {
            // Fill with default value of 1 or keep existing values
            const newQOrders = Array(nVars).fill(0).map((_, i) => qOrders[i] || 1);
            handleQOrders(newQOrders);
        }
    }, [independentVariables.length]);

    const handleQOrderChange = (index: number, value: number) => {
        const newQOrders = [...qOrders];
        newQOrders[index] = value;
        handleQOrders(newQOrders);
    };

    return (
        <div className="space-y-6 p-4">
            <div className="space-y-2">
                <Label htmlFor="pOrder">AR Order (p) for Y</Label>
                <Input
                    id="pOrder"
                    type="number"
                    min={0}
                    max={5}
                    value={pOrder}
                    onChange={(e) => handlePOrder(Math.max(0, Math.min(5, parseInt(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground">
                    Number of lags of dependent variable Y (typically 1-2)
                </p>
            </div>

            {independentVariables.length > 0 && (
                <div className="space-y-4">
                    <Label>DL Orders (q) for X variables</Label>
                    {independentVariables.map((xVar, index) => (
                        <div key={xVar.columnIndex} className="space-y-2">
                            <Label htmlFor={`qOrder${index}`} className="text-sm">
                                q{index + 1} for {xVar.name}
                            </Label>
                            <Input
                                id={`qOrder${index}`}
                                type="number"
                                min={0}
                                max={5}
                                value={qOrders[index] || 1}
                                onChange={(e) => handleQOrderChange(index, Math.max(0, Math.min(5, parseInt(e.target.value) || 1)))}
                            />
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                        Number of lags for each X variable (typically 1-2)
                    </p>
                </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Model Specification</h4>
                {independentVariables.length > 0 ? (
                    <>
                        <p className="text-sm">
                            ARDL({pOrder}, {qOrders.join(', ')})
                        </p>
                        <p className="text-xs text-muted-foreground">
                            ΔYₜ = α + Σβᵢ·ΔYₜ₋ᵢ + Σγⱼ·ΔXⱼₜ + δ·Yₜ₋₁ + θⱼ·Xⱼₜ₋₁ + εₜ
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Variables: {independentVariables.length} independent variable{independentVariables.length > 1 ? 's' : ''}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Select independent variables to configure lag orders
                    </p>
                )}
            </div>
        </div>
    );
};

export default OptionTab;
