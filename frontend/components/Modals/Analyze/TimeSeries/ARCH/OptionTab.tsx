import type { FC } from "react";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface OptionTabProps {
    qOrder: number;
    handleQOrder: (value: number) => void;
}

const OptionTab: FC<OptionTabProps> = ({
    qOrder,
    handleQOrder,
}) => {
    return (
        <div className="space-y-6 p-4">
            <div className="space-y-2">
                <Label htmlFor="qOrder">ARCH Order (q)</Label>
                <Input
                    id="qOrder"
                    type="number"
                    min={1}
                    max={5}
                    value={qOrder}
                    onChange={(e) => handleQOrder(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground">
                    Number of lagged squared residual terms (typically 1-2)
                </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Model Specification</h4>
                <p className="text-sm">
                    ARCH({qOrder}) 
                </p>
                <p className="text-xs text-muted-foreground">
                    σ²ₜ = ω + Σαᵢε²ₜ₋ᵢ
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Note: ARCH is a special case of GARCH with p=0
                </p>
            </div>
        </div>
    );
};

export default OptionTab;
