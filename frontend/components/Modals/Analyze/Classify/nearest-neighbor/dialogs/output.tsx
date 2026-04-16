import React, { useEffect, useState } from "react";
import type {
  KNNOutputProps,
  KNNOutputType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const KNNOutput = ({
  updateFormData,
  data,
}: KNNOutputProps) => {
  const [outputState, setOutputState] = useState<KNNOutputType>({ ...data });

  useEffect(() => {
      setOutputState({ ...data });
  }, [data]);

  const handleChange = (
    field: keyof KNNOutputType,
    value: CheckedState | undefined | number | boolean | string | null,
  ) => {
    setOutputState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleExportDistGrp = (value: string) => {
    setOutputState((prevState) => ({
      ...prevState,
      CreateDataset: value === "CreateDataset",
      WriteDataFile: value === "WriteDataFile",
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[325px] max-w-xl rounded-lg border md:min-w-[200px]"
          >
            <ResizablePanel defaultSize={22}>
              <div className="flex flex-col gap-1 p-2">
                <Label className="font-bold">Viewer Output</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="CaseSummary"
                    checked={outputState.CaseSummary}
                    onCheckedChange={(checked) =>
                      handleChange("CaseSummary", checked)
                    }
                  />
                  <label
                    htmlFor="CaseSummary"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Case Processing Summary
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ChartAndTable"
                    checked={outputState.ChartAndTable}
                    onCheckedChange={(checked) =>
                      handleChange("ChartAndTable", checked)
                    }
                  />
                  <label
                    htmlFor="ChartAndTable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Charts and Tables
                  </label>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={78}>
              <div className="flex flex-col gap-2 p-2">
                <Label className="font-bold">Files</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ExportModelXML"
                      checked={outputState.ExportModelXML}
                      onCheckedChange={(checked) =>
                        handleChange("ExportModelXML", checked)
                      }
                    />
                    <label
                      htmlFor="ExportModelXML"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Export Model to XML File
                    </label>
                  </div>
                  <div className="pl-6">
                    <Input
                      id="XMLFilePath"
                      type="file"
                      disabled={!outputState.ExportModelXML}
                      onChange={(e) =>
                        handleChange("XMLFilePath", e.target.value)
                      }
                      placeholder="Enter file path"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ExportDistance"
                      checked={outputState.ExportDistance}
                      onCheckedChange={(checked) =>
                        handleChange("ExportDistance", checked)
                      }
                    />
                    <label
                      htmlFor="ExportDistance"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Export Distances between Focal Cases and k Nearest
                      Neighbors
                    </label>
                  </div>
                  <div className="pl-6">
                    <RadioGroup
                      value={
                        outputState.CreateDataset
                          ? "CreateDataset"
                          : "WriteDataFile"
                      }
                      disabled={!outputState.ExportDistance}
                      onValueChange={handleExportDistGrp}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="CreateDataset"
                            id="CreateDataset"
                          />
                          <Label className="w-[175px]" htmlFor="CreateDataset">
                            Create a new dataset
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 pl-6">
                          <Label className="w-[75px]" htmlFor="DatasetName">
                            Name:
                          </Label>
                          <Input
                            id="DatasetName"
                            type="text"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={outputState.DatasetName ?? ""}
                            disabled={!outputState.CreateDataset}
                            onChange={(e) =>
                              handleChange("DatasetName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="WriteDataFile"
                            id="WriteDataFile"
                          />
                          <Label className="w-[175px]" htmlFor="WriteDataFile">
                            Write a new data file
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 pl-6">
                          <Input
                            id="NewDataFilePath"
                            type="file"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={outputState.NewDataFilePath ?? ""}
                            disabled={!outputState.WriteDataFile}
                            onChange={(e) =>
                              handleChange("NewDataFilePath", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};
