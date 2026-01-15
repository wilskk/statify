import type { FC } from "react";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue 
} from "@/components/ui/select";

interface OptionTabProps {
    pOrder: number;
    qOrder: number;
    modelType: string;
    handlePOrder: (value: number) => void;
    handleQOrder: (value: number) => void;
    handleModelType: (value: string) => void;
}

const OptionTab: FC<OptionTabProps> = ({
    pOrder,
    qOrder,
    modelType,
    handlePOrder,
    handleQOrder,
    handleModelType,
}) => {
    return (
        <div className="space-y-6 p-4">
            <div className="space-y-2">
                <Label htmlFor="modelType">Model Type</Label>
                <Select value={modelType} onValueChange={handleModelType}>
                    <SelectTrigger id="modelType">
                        <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GARCH">GARCH - Generalized ARCH</SelectItem>
                        <SelectItem value="EGARCH">EGARCH - Exponential GARCH</SelectItem>
                        <SelectItem value="TGARCH">TGARCH/GJR - Threshold GARCH</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Select the type of GARCH model to estimate
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="pOrder">GARCH Order (p)</Label>
                <Input
                    id="pOrder"
                    type="number"
                    min={0}
                    max={5}
                    value={pOrder}
                    onChange={(e) => handlePOrder(Math.max(0, Math.min(5, parseInt(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground">
                    Number of lagged variance terms (typically 1-2)
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="qOrder">ARCH Order (q)</Label>
                <Input
                    id="qOrder"
                    type="number"
                    min={0}
                    max={5}
                    value={qOrder}
                    onChange={(e) => handleQOrder(Math.max(0, Math.min(5, parseInt(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground">
                    Number of lagged squared residual terms (typically 1-2)
                </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Model Specification</h4>
                <p className="text-sm">
                    {modelType}({pOrder},{qOrder}) 
                </p>
                <p className="text-xs text-muted-foreground">
                    {modelType === "GARCH" && "σ²ₜ = ω + Σαᵢε²ₜ₋ᵢ + Σβⱼσ²ₜ₋ⱼ"}
                    {modelType === "EGARCH" && "log(σ²ₜ) = ω + Σαᵢg(zₜ₋ᵢ) + Σβⱼlog(σ²ₜ₋ⱼ)"}
                    {modelType === "TGARCH" && "σ²ₜ = ω + Σ(αᵢ + γᵢIₜ₋ᵢ)ε²ₜ₋ᵢ + Σβⱼσ²ₜ₋ⱼ"}
                </p>
            </div>
        </div>
    );
};

export default OptionTab;
