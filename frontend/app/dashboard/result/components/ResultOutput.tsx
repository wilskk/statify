"use client";
import React, { useState, useEffect } from "react";
import DataTableRenderer from "@/components/Output/Table/DataTableRenderer";
import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { useResultStore } from "@/stores/useResultStore";
import GeneralChartContainer from "@/components/Output/Chart/GeneralChartContainer";
const TiptapEditor = dynamic(
  () => import("@/components/Output/Editor/TiptapEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-md p-2 min-h-[120px] bg-background w-full" />
    ),
  }
);
import { Edit } from "lucide-react";
import TextRenderer from "@/components/Output/text/text-renderer";

const ResultOutput: React.FC = () => {
  const { logs, updateStatistic } = useResultStore();
  console.log("ResultOutput rendering with logs:", logs);

  const [editingDescriptionId, setEditingDescriptionId] = useState<
    number | null
  >(null);
  const [descriptionValues, setDescriptionValues] = useState<
    Record<number, string>
  >({});
  const [saveStatus, setSaveStatus] = useState<Record<number, string>>({});

  // Effect to load results when component mounts
  useEffect(() => {
    const loadResults = async () => {
      try {
        await useResultStore.getState().loadResults();
        console.log("Results loaded successfully");
      } catch (error) {
        console.error("Failed to load results:", error);
      }
    };
    loadResults();
  }, []);

  // Effect to scroll to a specific log when the page loads with a hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Use a timeout to ensure the element is rendered before scrolling
    const timer = setTimeout(() => {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    return () => clearTimeout(timer); // Cleanup the timeout
  }, [logs]); // Rerunning when logs change ensures we can scroll to new content

  const handleDescriptionChange = (statId: number, value: string) => {
    // Hanya hapus spasi kosong berlebih di awal/akhir, biarkan paragraf kosong untuk jeda baris
    const trimmed = value.trim();

    setDescriptionValues((prev) => ({
      ...prev,
      [statId]: trimmed,
    }));
  };

  const handleSaveDescription = async (statId: number) => {
    try {
      const description = descriptionValues[statId];
      if (description !== undefined) {
        setSaveStatus((prev) => ({ ...prev, [statId]: "saving" }));
        // Simpan ke database
        await updateStatistic(statId, { description });
        // Update status
        setSaveStatus((prev) => ({ ...prev, [statId]: "saved" }));
        // Reset status dan mode edit setelah beberapa detik
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [statId]: "" }));
          setEditingDescriptionId(null);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to update description:", error);
      setSaveStatus((prev) => ({ ...prev, [statId]: "error" }));
    }
  };

  const handleEditClick = (statId: number, currentDescription: string) => {
    setDescriptionValues((prev) => ({
      ...prev,
      [statId]: currentDescription || "",
    }));
    setEditingDescriptionId(statId);
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-full">
      {logs.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          No data available
        </div>
      ) : (
        <div className="space-y-10">
          {logs.map((log) => (
            <div
              key={log.id}
              id={`log-${log.id}`}
              className="space-y-6 scroll-mt-20"
            >
              <div className="text-sm font-medium text-muted-foreground px-1">
                Log {log.id}: {log.log}
              </div>
              {log.analytics?.map((analytic) => (
                <Card
                  key={analytic.id}
                  className="p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-primary/20"
                >
                  <div className="text-xl font-bold text-card-foreground mb-4 border-b pb-2">
                    {analytic.title}
                  </div>
                  {analytic.note && (
                    <div className="text-sm italic text-muted-foreground mb-6 bg-muted/30 p-2 rounded-md">
                      {analytic.note}
                    </div>
                  )}
                  {(() => {
                    const renderedComponents = new Set<string>();
                    return (
                      analytic.statistics?.map((stat) => {
                        const isFirstAppearance = !renderedComponents.has(
                          stat.components
                        );
                        if (isFirstAppearance) {
                          renderedComponents.add(stat.components);
                        }
                        const statId = stat.id || 0;
                        const isEditing = editingDescriptionId === statId;
                        const status = saveStatus[statId] || "";
                        return (
                          <div key={stat.id} className="space-y-4">
                            {isFirstAppearance && (
                              <div className="text-base font-semibold text-card-foreground mt-8 mb-3 flex items-center">
                                <div className="h-4 w-1 bg-primary rounded-full mr-2"></div>
                                {stat.components}
                              </div>
                            )}
                            <div
                              id={`output-${analytic.id}-${stat.id}`}
                              className={`mb-6 rounded-md ${
                                !isFirstAppearance ? "mt-8" : ""
                              }`}
                            >
                              {(() => {
                                let parsedData;
                                try {
                                  parsedData =
                                    typeof stat.output_data === "string"
                                      ? JSON.parse(stat.output_data)
                                      : stat.output_data;
                                  console.log("ParsedData", parsedData);
                                } catch (error) {
                                  console.error(
                                    "Failed to parse output_data:",
                                    error
                                  );
                                  return (
                                    <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                                      Data tidak valid: Format JSON tidak sesuai
                                    </div>
                                  );
                                }

                                if (parsedData.tables) {
                                  return (
                                    <div className="overflow-x-auto pb-2">
                                      <DataTableRenderer
                                        data={stat.output_data}
                                      />
                                    </div>
                                  );
                                } else if (parsedData.charts) {
                                  return (
                                    <GeneralChartContainer
                                      data={stat.output_data}
                                    />
                                  );
                                } else if (parsedData.text) {
                                  return (
                                    <TextRenderer textData={parsedData.text} />
                                  );
                                } else {
                                  return (
                                    <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                                      Data tidak valid: Format tidak dikenali
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                            <div className="mt-4 mb-10 relative">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Deskripsi
                                </div>
                                {!isEditing ? (
                                  <button
                                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50"
                                    onClick={() =>
                                      handleEditClick(
                                        statId,
                                        stat.description || ""
                                      )
                                    }
                                    type="button"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </button>
                                ) : (
                                  <div className="text-xs">
                                    {status === "saving" && (
                                      <span className="text-yellow-500">
                                        Menyimpan...
                                      </span>
                                    )}
                                    {status === "saved" && (
                                      <span className="text-green-500">
                                        Tersimpan!
                                      </span>
                                    )}
                                    {status === "error" && (
                                      <span className="text-red-500">
                                        Gagal menyimpan
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <TiptapEditor
                                value={
                                  isEditing
                                    ? descriptionValues[statId] || ""
                                    : stat.description || ""
                                }
                                onChange={(value) =>
                                  handleDescriptionChange(statId, value)
                                }
                                editable={isEditing}
                                onSave={
                                  isEditing
                                    ? () => handleSaveDescription(statId)
                                    : undefined
                                }
                                placeholder="Tulis deskripsi statistik di sini..."
                                id={`editor-${statId}`}
                              />
                            </div>
                          </div>
                        );
                      }) || null
                    );
                  })()}
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultOutput;
