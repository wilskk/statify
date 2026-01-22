import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/Variable";
import { OrdinalScaleParams } from "../types/ordinal";

interface Props { factors: Variable[], covariates: Variable[], params: OrdinalScaleParams, onChange: (params: OrdinalScaleParams) => void; }
export const ScaleTab: React.FC<Props> = ({ factors, covariates, params, onChange }) => {
    const allVars = [...factors, ...covariates];
    const handleAdd = (v: Variable) => onChange({ scaleModel: [...params.scaleModel, v] });
    const handleRemove = (v: Variable) => onChange({ scaleModel: params.scaleModel.filter(vm => vm.id !== v.id) });
    return (
        <div className="flex gap-4 h-full">
            <Card className="w-1/3"><CardHeader><CardTitle>Factors/covariates</CardTitle></CardHeader><CardContent>{allVars.map(v => <div key={v.id} className="p-2">{v.name}</div>)}</CardContent></Card>
            <div className="flex flex-col justify-center"><Button>&gt;</Button></div>
            <Card className="flex-1"><CardHeader><CardTitle>Scale model</CardTitle></CardHeader><CardContent>{params.scaleModel.map(v => <div key={v.id} className="p-2">{v.name}</div>)}</CardContent></Card>
        </div>
    );
};