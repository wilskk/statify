import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  KNNFeaturesProps,
  KNNFeaturesType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverArrow } from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FieldHelp } from "./field-help";

export const KNNFeatures = ({
  updateFormData,
  data,
  hasTarget,
  showFieldHelp = false,
}: KNNFeaturesProps) => {
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);

  useEffect(() => {
    const usedVariables = [...(data.ForcedEntryVar ?? [])].filter(Boolean);

    const updatedVariables = (data.ForwardSelection ?? []).filter(
      (variable) => !usedVariables.includes(variable),
    );

    setAvailableVariables(updatedVariables);
  }, [data.ForwardSelection, data.ForcedEntryVar]);

  useEffect(() => {
    const forcedCount = (data.ForcedEntryVar ?? []).length;
    const forwardCount = (data.ForwardSelection ?? []).filter(
      (variable) => !(data.ForcedEntryVar ?? []).includes(variable),
    ).length;

    if (data.FeaturesToEvaluate !== forwardCount) {
      updateFormData("FeaturesToEvaluate", forwardCount);
    }

    if (data.ForcedFeatures !== forcedCount) {
      updateFormData("ForcedFeatures", forcedCount);
    }
  }, [
    data.ForwardSelection,
    data.ForcedEntryVar,
    data.FeaturesToEvaluate,
    data.ForcedFeatures,
    updateFormData,
  ]);

  useEffect(() => {
    if (
      data.PerformSelection &&
      data.MaxReached &&
      (data.MaxToSelect === null || data.MaxToSelect === undefined)
    ) {
      updateFormData("MaxToSelect", 1);
    }
  }, [data.PerformSelection, data.MaxReached, data.MaxToSelect, updateFormData]);

  const handleChange = (
    field: keyof KNNFeaturesType,
    value: CheckedState | number | boolean | string | null,
  ) => {
    updateFormData(field, value);
  };

  const handleDrop = (target: string, variable: string) => {
    if (!variable || (data.ForcedEntryVar ?? []).includes(variable)) return;

    updateFormData("ForcedEntryVar", [
      ...(data.ForcedEntryVar ?? []),
      variable,
    ]);
  };

  const handleRemoveVariable = (target: string, variable?: string) => {
    if (target === "ForcedEntryVar") {
      const updated = (data.ForcedEntryVar ?? []).filter(
        (item) => item !== variable,
      );

      updateFormData("ForcedEntryVar", updated);
    }
  };

  const handleCriterionGrp = (value: string) => {
    updateFormData("MaxReached", value === "MaxReached");
    updateFormData("BelowMin", value === "BelowMin");
  };

  const canUseFeatureSelection =
    hasTarget && (data.ForwardSelection ?? []).length > 0;

  const isSelectionActive = data.PerformSelection && canUseFeatureSelection;

  const forwardCount = availableVariables.length;
  const forcedCount = (data.ForcedEntryVar ?? []).length;

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      <div className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4 w-full">
          <div className="w-full max-w-2xl rounded-lg border md:min-w-[200px]">
            <section className="border-b">
              <div className="flex flex-col gap-2 p-2 w-full">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="PerformSelection"
                      checked={data.PerformSelection}
                      disabled={!canUseFeatureSelection}
                      onCheckedChange={(checked) =>
                        handleChange("PerformSelection", checked)
                      }
                    />
                    <label
                      htmlFor="PerformSelection"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Perform Feature Selection
                    </label>
                    <FieldHelp
                      show={showFieldHelp}
                      text="Aktifkan pemilihan fitur otomatis untuk mengevaluasi fitur mana yang paling membantu model."
                    />
                  </div>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost">
                          <Info />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverArrow />
                        <div className="p-2">
                          <p className="text-sm">
                            Forward selection is used to evaluate features for
                            inclusions. To force a feature to be included in the
                            model, enter the feature name in the Forced Entry
                            box.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="font-bold">Forward Selection:</Label>
                        <FieldHelp
                          show={showFieldHelp}
                          text="Daftar fitur kandidat yang akan dievaluasi oleh prosedur forward selection."
                        />
                      </div>
                      <div className="w-full h-[150px] p-2 border rounded overflow-hidden">
                        <ScrollArea>
                          <div className="flex flex-col h-[130px] gap-1 justify-start items-start">
                            {availableVariables.map(
                              (variable: string, index: number) => (
                                <Badge
                                  key={index}
                                  className="w-full text-start text-sm font-light p-2 cursor-pointer"
                                  variant="outline"
                                  draggable={isSelectionActive}
                                  onDragStart={(e) =>
                                    e.dataTransfer.setData("text", variable)
                                  }
                                >
                                  {variable}
                                </Badge>
                              ),
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Features to evaluate: {forwardCount}
                      </p>
                    </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <div
                      className="flex flex-col w-full gap-2"
                      onDragOver={(e) => {
                        if (!isSelectionActive) return;
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (!isSelectionActive) return;
                        const variable = e.dataTransfer.getData("text");
                        handleDrop("ForcedEntryVar", variable);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Label className="font-bold">Forced Entry:</Label>
                        <FieldHelp
                          show={showFieldHelp}
                          text="Fitur yang wajib masuk ke model dan tidak dikeluarkan oleh proses seleksi."
                        />
                      </div>
                      <div className="w-full h-[150px] p-2 border rounded overflow-hidden">
                        <ScrollArea>
                          <div className="w-full h-[130px]">
                            {data.ForcedEntryVar &&
                            data.ForcedEntryVar.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {data.ForcedEntryVar.map((variable, index) => (
                                  <Badge
                                    key={index}
                                    className="text-start text-sm font-light p-2 cursor-pointer"
                                    variant="outline"
                                    onClick={() => {
                                      if (!isSelectionActive) return;
                                      handleRemoveVariable(
                                        "ForcedEntryVar",
                                        variable,
                                      );
                                    }}
                                  >
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm font-light text-gray-500">
                                Drop variables here.
                              </span>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                      <input
                        type="hidden"
                        value={data.ForcedEntryVar ?? ""}
                        name="Independents"
                      />
                      <p className="text-sm text-muted-foreground">
                        Features to force: {forcedCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <RadioGroup
                value={data.MaxReached ? "MaxReached" : "BelowMin"}
                disabled={!data.PerformSelection}
                onValueChange={handleCriterionGrp}
              >
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-bold">Stopping Criterion</Label>
                    <FieldHelp
                      show={showFieldHelp}
                      text="Aturan kapan proses pemilihan fitur harus berhenti."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="MaxReached" id="MaxReached" />
                      <Label htmlFor="MaxReached">
                        Stop when the specified number of features is reached
                      </Label>
                      <FieldHelp
                        show={showFieldHelp}
                        text="Hentikan seleksi saat jumlah fitur terpilih mencapai batas yang ditentukan."
                      />
                    </div>
                    <div className="flex flex-col space-x-2 pl-4">
                      <div className="flex items-center space-x-2 pl-2">
                        <Label className="w-[150px]">Number to Select:</Label>
                        <FieldHelp
                          show={showFieldHelp}
                          text="Jumlah maksimum fitur yang boleh dipilih oleh proses seleksi."
                        />
                        <div className="w-[75px]">
                          <Input
                            id="MaxToSelect"
                            type="number"
                            placeholder=""
                            value={data.MaxToSelect ?? ""}
                            disabled={!data.MaxReached}
                            onChange={(e) =>
                              handleChange(
                                "MaxToSelect",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BelowMin" id="BelowMin" />
                      <Label htmlFor="BelowMin">
                        Stop when the change in the absolute error ratio is less
                        than or equal to minimum
                      </Label>
                      <FieldHelp
                        show={showFieldHelp}
                        text="Hentikan seleksi ketika penurunan error sudah terlalu kecil."
                      />
                    </div>
                    <div className="flex flex-col space-x-2 pl-4 gap-1">
                      <div className="flex items-center space-x-2 pl-2">
                        <Label className="w-[150px]">Minimum Change:</Label>
                        <FieldHelp
                          show={showFieldHelp}
                          text="Ambang minimum perubahan error ratio agar fitur berikutnya masih dianggap berguna."
                        />
                        <div className="w-[75px]">
                          <Input
                            id="MinChange"
                            type="number"
                            placeholder=""
                            value={data.MinChange ?? ""}
                            disabled={!data.BelowMin}
                            onChange={(e) =>
                              handleChange("MinChange", Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
