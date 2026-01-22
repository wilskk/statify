import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/Variable";
import { OrdinalLocationParams } from "../types/ordinal";

interface Props { factors: Variable[], covariates: Variable[], params: OrdinalLocationParams, onChange: (params: OrdinalLocationParams) => void; }
export const LocationTab: React.FC<Props> = ({ factors, covariates, params, onChange }) => {
    const allVars = [...factors, ...covariates];
    const handleAdd = (v: Variable) => onChange({ locationModel: [...params.locationModel, v] });
    const handleRemove = (v: Variable) => onChange({ locationModel: params.locationModel.filter(vm => vm.id !== v.id) });
    return (
        <div className="flex gap-4 h-full">
            <Card className="w-1/3"><CardHeader><CardTitle>Factors/covariates</CardTitle></CardHeader><CardContent>{allVars.map(v => <div key={v.id} className="p-2">{v.name}</div>)}</CardContent></Card>
            <div className="flex flex-col justify-center"><Button>&gt;</Button></div>
            <Card className="flex-1"><CardHeader><CardTitle>Location model</CardTitle></CardHeader><CardContent>{params.locationModel.map(v => <div key={v.id} className="p-2">{v.name}</div>)}</CardContent></Card>
        </div>
    );
};