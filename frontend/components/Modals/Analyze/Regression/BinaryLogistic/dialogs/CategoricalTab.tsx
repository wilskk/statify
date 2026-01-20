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
import { Badge } from "@/components/ui/badge";
import { Variable } from "@/types/Variable";
import { BinaryLogisticCategoricalParams } from "../types/binary-logistic";

interface CategoricalTabProps {
  covariates: Variable[];
  factors: Variable[];
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

  // Gabungkan factors dan covariates untuk ditampilkan
  const allVariables = [...factors, ...covariates];

  // --- LOGIKA: Cek apakah metode butuh referensi ---
  const methodsWithoutReference = [
    "Difference",
    "Helmert",
    "Repeated",
    "Polynomial",
  ];

  const isReferenceDisabled = methodsWithoutReference.includes(params.contrast);

  return (
    <div className="grid grid-cols-2 gap-6 py-4 h-full min-h-0">
      {/* Kiri: List Covariates */}
      <div className="flex flex-col h-full min-h-0">
        <Label className="mb-2 font-semibold">
          Categorical Covariates:
        </Label>
        {/* Container ScrollArea harus memiliki min-h-0 agar flexbox bekerja dengan benar */}
        <div className="border rounded-md flex-1 bg-background min-h-0 relative">
          <ScrollArea className="h-full p-2 w-full">
            <div className="pr-3">
              {allVariables.map((v) => {
                const isCategoricalType =
                  v.measure?.toLowerCase() === "nominal" ||
                  v.measure?.toLowerCase() === "ordinal";

                return (
                  <div
                    key={v.id}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md transition-colors border-b last:border-0"
                  >
                    <Checkbox
                      id={`cat-${v.name}`}
                      checked={params.covariates.includes(v.name)}
                      onCheckedChange={() => toggleCovariate(v.name)}
                    />
                    <div
                      className="flex flex-col cursor-pointer flex-grow"
                      onClick={() => toggleCovariate(v.name)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Label
                          htmlFor={`cat-${v.name}`}
                          className="text-sm cursor-pointer font-medium"
                        >
                          {v.name}
                        </Label>
                        {isCategoricalType && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5 font-normal ml-2"
                          >
                            {v.measure}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {allVariables.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 min-h-[200px]">
                  <p className="text-sm text-muted-foreground">
                    No covariates selected in main tab.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Kanan: Settings */}
      {/* Kita juga berikan scroll area di kanan jika layarnya sangat pendek */}
      <div className="flex flex-col h-full min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-2">
            <div className="space-y-4 border p-4 rounded-md bg-card shadow-sm">
              <Label className="font-semibold">Contrast Method</Label>
              <Select
                value={params.contrast}
                onValueChange={(val: any) =>
                  onChange({ ...params, contrast: val })
                }
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
              <p className="text-[11px] text-muted-foreground">
                Determines how the categorical variable levels are compared.
              </p>
            </div>

            <div
              className={`space-y-4 border p-4 rounded-md bg-card shadow-sm transition-all duration-200 ${
                isReferenceDisabled
                  ? "opacity-50 pointer-events-none grayscale"
                  : "opacity-100"
              }`}
            >
              <Label className="font-semibold">Reference Category</Label>
              <RadioGroup
                value={params.referenceCategory}
                onValueChange={(val: any) =>
                  onChange({ ...params, referenceCategory: val })
                }
                disabled={isReferenceDisabled}
              >
                <div className="flex items-center space-x-2 border p-2 rounded hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="Last" id="ref-last" />
                  <Label
                    htmlFor="ref-last"
                    className="cursor-pointer flex-grow"
                  >
                    Last (highest value)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-2 rounded hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="First" id="ref-first" />
                  <Label
                    htmlFor="ref-first"
                    className="cursor-pointer flex-grow"
                  >
                    First (lowest value)
                  </Label>
                </div>
              </RadioGroup>
              {isReferenceDisabled && (
                <p className="text-[10px] text-muted-foreground italic">
                  *Reference category is not applicable for the selected
                  contrast method.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
