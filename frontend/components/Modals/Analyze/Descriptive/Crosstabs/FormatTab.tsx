import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormatTabProps } from "./types";

const FormatTab: FC<FormatTabProps> = ({
    rowOrder,
    setRowOrder,
    containerType = "dialog"
}) => {
    return (
        <div className="p-6">
            <div className="bg-card border border-border rounded-md p-6">
                <div className="text-sm font-medium mb-4">Row Order</div>
                <RadioGroup
                    value={rowOrder}
                    onValueChange={(value) => setRowOrder(value as typeof rowOrder)}
                    className="space-y-4"
                >
                    <div className="flex items-center">
                        <RadioGroupItem
                            value="ascending"
                            id="ascending"
                        />
                        <Label htmlFor="ascending" className="text-sm ml-2 cursor-pointer">
                            Ascending
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            value="descending"
                            id="descending"
                        />
                        <Label htmlFor="descending" className="text-sm ml-2 cursor-pointer">
                            Descending
                        </Label>
                    </div>
                </RadioGroup>

                <div className="mt-4 text-xs text-muted-foreground">
                    <p>Determines the sort order of values for categorical row variables in the crosstabulation.</p>
                </div>
            </div>
        </div>
    );
};

export default FormatTab;