import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Variable } from "@/types/Variable";
import { BinaryLogisticCategoricalParams } from "../types/binary-logistic";

interface CategoricalTabProps {
  covariates: Variable[];
  factors: Variable[]; // [FIX] Tambahkan properti ini
  params: BinaryLogisticCategoricalParams;
  onChange: (p: BinaryLogisticCategoricalParams) => void;
}

export const CategoricalTab: React.FC<CategoricalTabProps> = ({
  covariates,
  factors,
  params,
  onChange,
}) => {
  const toggleCovariate = (name: string) => {
    const current = params.covariates;
    if (current.includes(name)) {
      onChange({ ...params, covariates: current.filter((c) => c !== name) });
    } else {
      onChange({ ...params, covariates: [...current, name] });
    }
  };

  // Gabungkan factors dan covariates untuk ditampilkan (biasanya factors yang butuh kontras)
  const allVariables = [...factors, ...covariates];

  return (
    <div className="grid grid-cols-2 gap-6 py-4 h-full">
      {/* Kiri: List Covariates */}
      <div className="flex flex-col h-full">
        <Label className="mb-2 font-semibold">Covariates:</Label>
        <div className="border rounded-md flex-1 bg-background overflow-hidden">
          <ScrollArea className="h-[400px] p-2">
            {allVariables.map((v) => (
              <div
                key={v.id}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
              >
                <Checkbox
                  id={`cat-${v.name}`}
                  checked={params.covariates.includes(v.name)}
                  onCheckedChange={() => toggleCovariate(v.name)}
                />
                <label
                  htmlFor={`cat-${v.name}`}
                  className="text-sm cursor-pointer w-full"
                >
                  {v.name}
                </label>
              </div>
            ))}
            {allVariables.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">
                No covariates selected in main tab.
              </p>
            )}
          </ScrollArea>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Select covariates to treat as categorical.
        </p>
      </div>

      {/* Kanan: Settings */}
      <div className="space-y-6">
        <div className="space-y-4 border p-4 rounded-md">
          <Label className="font-semibold">Contrast Method</Label>
          <Select
            value={params.contrast}
            onValueChange={(val: any) => onChange({ ...params, contrast: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Indicator">Indicator</SelectItem>
              <SelectItem value="Simple">Simple</SelectItem>
              <SelectItem value="Difference">Difference</SelectItem>
              <SelectItem value="Helmert">Helmert</SelectItem>
              <SelectItem value="Repeated">Repeated</SelectItem>
              <SelectItem value="Polynomial">Polynomial</SelectItem>
              <SelectItem value="Deviation">Deviation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 border p-4 rounded-md">
          <Label className="font-semibold">Reference Category</Label>
          <RadioGroup
            value={params.referenceCategory}
            onValueChange={(val: any) =>
              onChange({ ...params, referenceCategory: val })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Last" id="ref-last" />
              <Label htmlFor="ref-last">Last (highest value)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="First" id="ref-first" />
              <Label htmlFor="ref-first">First (lowest value)</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};
