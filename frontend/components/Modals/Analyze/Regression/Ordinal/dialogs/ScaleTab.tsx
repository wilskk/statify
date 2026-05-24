import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/Variable";
import { OrdinalScaleParams } from "../types/ordinal";

interface Props { factors: Variable[], covariates: Variable[], params: OrdinalScaleParams, onChange: (params: OrdinalScaleParams) => void; }
export const ScaleTab: React.FC<Props> = ({ factors, covariates, params, onChange }) => {
    const allVars = useMemo(() => [...factors, ...covariates], [factors, covariates]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    const getVariableKey = (variable: Variable) => `${variable.id ?? "no-id"}-${variable.columnIndex}`;

    const selectedVariables = useMemo(
        () => allVars.filter((v) => selectedKeys.has(getVariableKey(v))),
        [allVars, selectedKeys]
    );

    const handleVariableClick = (event: React.MouseEvent<HTMLDivElement>, variable: Variable) => {
        const key = getVariableKey(variable);
        if (event.ctrlKey || event.shiftKey) {
            const nextKeys = new Set(selectedKeys);
            if (nextKeys.has(key)) {
                nextKeys.delete(key);
            } else {
                nextKeys.add(key);
            }
            setSelectedKeys(nextKeys);
        } else {
            const nextKeys = new Set<string>();
            nextKeys.add(key);
            setSelectedKeys(nextKeys);
        }
    };

    const handleAddSelection = () => {
        if (selectedVariables.length === 0) return;
        const existingKeys = new Set(params.scaleModel.map(getVariableKey));
        const nextScale = [...params.scaleModel];

        for (const variable of selectedVariables) {
            const key = getVariableKey(variable);
            if (!existingKeys.has(key)) {
                existingKeys.add(key);
                nextScale.push(variable);
            }
        }

        onChange({ scaleModel: nextScale });
    };

    const handleRemove = (variable: Variable) => {
        const key = getVariableKey(variable);
        onChange({ scaleModel: params.scaleModel.filter((item) => getVariableKey(item) !== key) });
    };
    return (
        <div className="flex gap-4 h-full">
            <Card className="w-1/3">
                <CardHeader>
                    <CardTitle>Factors/covariates</CardTitle>
                </CardHeader>
                <CardContent>
                    {allVars.map((variable) => {
                        const key = getVariableKey(variable);
                        const isSelected = selectedKeys.has(key);
                        return (
                            <div
                                key={key}
                                className={`p-2 rounded cursor-pointer ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
                                onClick={(event) => handleVariableClick(event, variable)}
                            >
                                {variable.name}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
            <div className="flex flex-col justify-center">
                <Button onClick={handleAddSelection}>&gt;</Button>
            </div>
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Scale model</CardTitle>
                </CardHeader>
                <CardContent>
                    {params.scaleModel.map((variable) => (
                        <div
                            key={getVariableKey(variable)}
                            className="p-2 rounded cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRemove(variable)}
                        >
                            {variable.name}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};