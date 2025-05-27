import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SaveTabProps {
    saveAnomalyIndex: boolean;
    setSaveAnomalyIndex: (value: boolean) => void;
    anomalyIndexName: string;
    setAnomalyIndexName: (value: string) => void;
    savePeerGroups: boolean;
    setSavePeerGroups: (value: boolean) => void;
    peerGroupsRootName: string;
    setPeerGroupsRootName: (value: string) => void;
    saveReasons: boolean;
    setSaveReasons: (value: boolean) => void;
    reasonsRootName: string;
    setReasonsRootName: (value: string) => void;
    replaceExisting: boolean;
    setReplaceExisting: (value: boolean) => void;
    exportFilePath: string;
    setExportFilePath: (value: string) => void;
}

const SaveTab: React.FC<SaveTabProps> = ({
                                             saveAnomalyIndex,
                                             setSaveAnomalyIndex,
                                             anomalyIndexName,
                                             setAnomalyIndexName,
                                             savePeerGroups,
                                             setSavePeerGroups,
                                             peerGroupsRootName,
                                             setPeerGroupsRootName,
                                             saveReasons,
                                             setSaveReasons,
                                             reasonsRootName,
                                             setReasonsRootName,
                                             replaceExisting,
                                             setReplaceExisting,
                                             exportFilePath,
                                             setExportFilePath
                                         }) => {
    return (
        <>
            <div className="border border-border rounded-md p-6 mb-6">
                <div className="text-sm font-medium mb-4">Save Variables</div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="saveAnomalyIndex"
                                    checked={saveAnomalyIndex}
                                    onCheckedChange={(checked) => setSaveAnomalyIndex(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="saveAnomalyIndex" className="text-sm font-medium cursor-pointer">
                                    Anomaly index
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Measures the unusualness of each case with respect to its peer
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="anomalyIndexName" className="text-xs whitespace-nowrap mr-2">
                                Name:
                            </Label>
                            <Input
                                id="anomalyIndexName"
                                value={anomalyIndexName}
                                onChange={(e) => setAnomalyIndexName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!saveAnomalyIndex}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="savePeerGroups"
                                    checked={savePeerGroups}
                                    onCheckedChange={(checked) => setSavePeerGroups(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="savePeerGroups" className="text-sm font-medium cursor-pointer">
                                    Peer groups
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Three variables are saved per peer group: ID, case count, and size
                                as a percentage of cases in the analysis.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="peerGroupsRootName" className="text-xs whitespace-nowrap mr-2">
                                Root Name:
                            </Label>
                            <Input
                                id="peerGroupsRootName"
                                value={peerGroupsRootName}
                                onChange={(e) => setPeerGroupsRootName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!savePeerGroups}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="saveReasons"
                                    checked={saveReasons}
                                    onCheckedChange={(checked) => setSaveReasons(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="saveReasons" className="text-sm font-medium cursor-pointer">
                                    Reasons
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Four variables are saved per reason: name of reason variable,
                                value of reason variable, peer group norm, and impact measure for
                                the reason variable.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="reasonsRootName" className="text-xs whitespace-nowrap mr-2">
                                Root Name:
                            </Label>
                            <Input
                                id="reasonsRootName"
                                value={reasonsRootName}
                                onChange={(e) => setReasonsRootName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!saveReasons}
                            />
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <div className="flex items-center">
                            <Checkbox
                                id="replaceExisting"
                                checked={replaceExisting}
                                onCheckedChange={(checked) => setReplaceExisting(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="replaceExisting" className="text-sm cursor-pointer">
                                Replace existing variables that have the same name or root name
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-border rounded-md p-6">
                <div className="text-sm font-medium mb-4">Export Model File</div>
                <div className="flex items-center">
                    <Label htmlFor="exportFile" className="text-xs whitespace-nowrap mr-2">
                        File:
                    </Label>
                    <Input
                        id="exportFile"
                        value={exportFilePath}
                        onChange={(e) => setExportFilePath(e.target.value)}
                        className="h-8 text-sm mr-2"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                    >
                        Browse...
                    </Button>
                </div>
            </div>
        </>
    );
};

export default SaveTab;