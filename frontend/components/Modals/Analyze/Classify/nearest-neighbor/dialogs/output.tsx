import React, { useEffect, useRef } from "react";
import type {
  KNNOutputProps,
  KNNOutputType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldHelp } from "./field-help";

export const KNNOutput = ({
  updateFormData,
  data,
  focalCaseVar,
  isAutoK,
  isFeatureSelectionActive,
  showFieldHelp = false,
}: KNNOutputProps) => {
  const wasFeatureSelectionActive = useRef(isFeatureSelectionActive);

  const outputState: KNNOutputType = {
    ...data,
    CaseSummary: data.CaseSummary ?? true,
    FeatureSelectionSummary: data.FeatureSelectionSummary ?? true,
    KSelectionChart: data.KSelectionChart ?? true,
    PredictorSpace: data.PredictorSpace ?? true,
    PredictionResults: data.PredictionResults ?? true,
    ConfusionMatrix: data.ConfusionMatrix ?? true,
    ShowNeighborDetail: data.ShowNeighborDetail ?? false,
    ChartAndTable: data.ChartAndTable ?? true,
  };

  const handleChange = (
    field: keyof KNNOutputType,
    value: CheckedState | undefined | boolean | string | null,
  ) => {
    const nextValue =
      value === "indeterminate" || typeof value === "undefined" ? false : value;

    if (field === "KSelectionChart" && !isAutoK && nextValue) {
      return;
    }

    if (
      field === "FeatureSelectionSummary" &&
      !isFeatureSelectionActive &&
      nextValue
    ) {
      return;
    }

    updateFormData(field, nextValue);

    if (field === "ExportModelXML" && !nextValue) {
      updateFormData("XMLFilePath", null);
    }

    if (field === "ExportDistance" && !nextValue) {
      updateFormData("CreateDataset", false);
      updateFormData("WriteDataFile", false);
      updateFormData("DatasetName", null);
      updateFormData("NewDataFilePath", null);
    }
  };

  const handleExportDistGrp = (value: string) => {
    updateFormData("CreateDataset", value === "CreateDataset");
    updateFormData("WriteDataFile", value === "WriteDataFile");
  };

  const canExportDistance = !!focalCaseVar;
  const exportDistanceEnabled = canExportDistance && outputState.ExportDistance;

  useEffect(() => {
    if (!isAutoK && data.KSelectionChart) {
      updateFormData("KSelectionChart", false);
    }
  }, [data.KSelectionChart, isAutoK, updateFormData]);

  useEffect(() => {
    if (
      isFeatureSelectionActive &&
      (!wasFeatureSelectionActive.current ||
        data.FeatureSelectionSummary === undefined) &&
      !data.FeatureSelectionSummary
    ) {
      updateFormData("FeatureSelectionSummary", true);
    }

    wasFeatureSelectionActive.current = isFeatureSelectionActive;
  }, [
    data.FeatureSelectionSummary,
    isFeatureSelectionActive,
    updateFormData,
  ]);

  const viewerOutputOptions: Array<{
    field: keyof KNNOutputType;
    label: string;
    help: string;
    disabled?: boolean;
  }> = [
    {
      field: "CaseSummary",
      label: "Case Processing Summary",
      help: "Menampilkan ringkasan jumlah kasus valid, missing, dan diproses.",
    },
    {
      field: "FeatureSelectionSummary",
      label: "Feature Selection Summary",
      help: "Menampilkan ringkasan proses dan hasil pemilihan fitur.",
      disabled: !isFeatureSelectionActive,
    },
    {
      field: "KSelectionChart",
      label: "K Selection Chart",
      help: "Menampilkan chart pemilihan nilai k saat auto selection aktif.",
      disabled: !isAutoK,
    },
    {
      field: "PredictorSpace",
      label: "Predictor Space Scatter Plot",
      help: "Menampilkan plot ruang prediktor untuk melihat posisi kasus.",
    },
    {
      field: "PredictionResults",
      label: "Classification / Prediction Result",
      help: "Menampilkan hasil klasifikasi atau prediksi untuk model KNN.",
    },
    {
      field: "ConfusionMatrix",
      label: "Confusion Matrix and Metrics",
      help: "Menampilkan confusion matrix dan metrik evaluasi klasifikasi.",
    },
    {
      field: "ShowNeighborDetail",
      label: "Neighbor Detail",
      help: "Menampilkan detail tetangga terdekat untuk kasus terkait.",
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      <div className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4 w-full">
          <div className="w-full max-w-xl rounded-lg border md:min-w-[200px]">
            <section className="flex flex-col gap-1 p-2 border-b">
                <Label className="font-bold">Viewer Output</Label>
                {viewerOutputOptions.map(({ field, label, help, disabled }) => (
                  <div className="flex items-center space-x-2" key={field}>
                    <Checkbox
                      id={field}
                      checked={disabled ? false : Boolean(outputState[field])}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        handleChange(field, checked)
                      }
                    />
                    <label
                      htmlFor={field}
                      className={`text-sm font-medium leading-none ${
                        disabled ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    >
                      {label}
                    </label>
                    <FieldHelp show={showFieldHelp} text={help} />
                  </div>
                ))}
            </section>

            <section className="flex flex-col gap-2 p-2">
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
                    <FieldHelp
                      show={showFieldHelp}
                      text="Menyimpan spesifikasi model KNN ke file XML."
                    />
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
                      checked={exportDistanceEnabled}
                      disabled={!canExportDistance}
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
                    <FieldHelp
                      show={showFieldHelp}
                      text="Mengekspor jarak antara focal case dan tetangga terdekatnya."
                    />
                  </div>
                  <div className="pl-6">
                    <RadioGroup
                      value={
                        outputState.CreateDataset
                          ? "CreateDataset"
                          : "WriteDataFile"
                      }
                      disabled={!exportDistanceEnabled}
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
                          <FieldHelp
                            show={showFieldHelp}
                            text="Simpan hasil jarak sebagai dataset baru di aplikasi."
                          />
                        </div>
                        <div className="flex items-center space-x-2 pl-6">
                          <Label className="w-[75px]" htmlFor="DatasetName">
                            Name:
                          </Label>
                          <FieldHelp
                            show={showFieldHelp}
                            text="Nama dataset baru yang akan berisi hasil jarak."
                          />
                          <Input
                            id="DatasetName"
                            type="text"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={outputState.DatasetName ?? ""}
                            disabled={
                              !exportDistanceEnabled ||
                              !outputState.CreateDataset
                            }
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
                          <FieldHelp
                            show={showFieldHelp}
                            text="Simpan hasil jarak ke file data baru."
                          />
                        </div>
                        <div className="flex items-center space-x-2 pl-6">
                          <Input
                            id="NewDataFilePath"
                            type="file"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={outputState.NewDataFilePath ?? ""}
                            disabled={
                              !exportDistanceEnabled ||
                              !outputState.WriteDataFile
                            }
                            onChange={(e) =>
                              handleChange("NewDataFilePath", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
