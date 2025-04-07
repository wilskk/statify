import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SaveTabProps {
    saveOption: "ADD" | "CREATE" | "WRITE";
    setSaveOption: (value: "ADD" | "CREATE" | "WRITE") => void;
    datasetName: string;
    setDatasetName: (value: string) => void;
    filePath: string;
    setFilePath: (value: string) => void;
}

const SaveTab: FC<SaveTabProps> = ({
                                       saveOption,
                                       setSaveOption,
                                       datasetName,
                                       setDatasetName,
                                       filePath,
                                       setFilePath
                                   }) => {
    return (
        <div className="border p-2 rounded-md">
            <div className="text-xs font-semibold mb-2">Save</div>
            <div className="space-y-3">
                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        className="w-3 h-3"
                        value="ADD"
                        checked={saveOption === "ADD"}
                        onChange={() => setSaveOption("ADD")}
                    />
                    <span className="text-xs">Add aggregated variables to active dataset</span>
                </label>

                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        className="w-3 h-3"
                        value="CREATE"
                        checked={saveOption === "CREATE"}
                        onChange={() => setSaveOption("CREATE")}
                    />
                    <span className="text-xs">Create a new dataset containing only the aggregated variables</span>
                </label>

                {saveOption === "CREATE" && (
                    <div className="ml-5 flex items-center gap-2">
                        <Label className="text-xs">Dataset name:</Label>
                        <Input
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            className="h-6 text-xs w-36"
                        />
                    </div>
                )}

                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        className="w-3 h-3"
                        value="WRITE"
                        checked={saveOption === "WRITE"}
                        onChange={() => setSaveOption("WRITE")}
                    />
                    <span className="text-xs">Write a new data file containing only the aggregated variables</span>
                </label>

                {saveOption === "WRITE" && (
                    <div className="ml-5 flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => {
                                // In a real implementation, this would open a file picker
                                // For now, we'll just alert
                                alert("File picker would open here");
                            }}
                        >
                            File...
                        </Button>
                        <span className="text-xs truncate">{filePath}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SaveTab;