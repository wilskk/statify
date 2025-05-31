import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface OptionsTabProps {
    primaryCaseIndicator: "last" | "first";
    setPrimaryCaseIndicator: (value: "last" | "first") => void;
    primaryName: string;
    setPrimaryName: (value: string) => void;
    filterByIndicator: boolean;
    setFilterByIndicator: (value: boolean) => void;
    sequentialCount: boolean;
    setSequentialCount: (value: boolean) => void;
    sequentialName: string;
    setSequentialName: (value: string) => void;
    moveMatchingToTop: boolean;
    setMoveMatchingToTop: (value: boolean) => void;
    displayFrequencies: boolean;
    setDisplayFrequencies: (value: boolean) => void;
    containerType?: "dialog" | "sidebar";
}

const OptionsTab: FC<OptionsTabProps> = ({
                                             primaryCaseIndicator,
                                             setPrimaryCaseIndicator,
                                             primaryName,
                                             setPrimaryName,
                                             filterByIndicator,
                                             setFilterByIndicator,
                                             sequentialCount,
                                             setSequentialCount,
                                             sequentialName,
                                             setSequentialName,
                                             moveMatchingToTop,
                                             setMoveMatchingToTop,
                                             displayFrequencies,
                                             setDisplayFrequencies,
                                             containerType = "dialog"
                                         }) => {
    return (
        <>
            <div className="border border-border rounded-md p-6 mb-6 bg-card">
                <div className="text-sm font-medium mb-4 text-card-foreground">Variables to Create</div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="primaryIndicator"
                                    checked={true}
                                    className="mr-2"
                                    disabled={true}
                                />
                                <Label htmlFor="primaryIndicator" className="text-sm font-medium cursor-pointer text-card-foreground">
                                    Indicator of primary cases (1=unique or primary, 0=duplicate)
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Creates a variable that identifies primary cases (1) and duplicate cases (0)
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="primaryName" className="text-xs whitespace-nowrap mr-2 text-card-foreground">
                                Name:
                            </Label>
                            <Input
                                id="primaryName"
                                value={primaryName}
                                onChange={(e) => setPrimaryName(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    <div className="ml-6 space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="last"
                                checked={primaryCaseIndicator === "last"}
                                onCheckedChange={() => setPrimaryCaseIndicator("last")}
                                className="mr-2"
                            />
                            <Label htmlFor="last" className="text-sm cursor-pointer text-card-foreground">
                                Last case in each group is primary
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox
                                id="first"
                                checked={primaryCaseIndicator === "first"}
                                onCheckedChange={() => setPrimaryCaseIndicator("first")}
                                className="mr-2"
                            />
                            <Label htmlFor="first" className="text-sm cursor-pointer text-card-foreground">
                                First case in each group is primary
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox
                                id="filterIndicator"
                                checked={filterByIndicator}
                                onCheckedChange={(checked) => setFilterByIndicator(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="filterIndicator" className="text-sm cursor-pointer text-card-foreground">
                                Filter by indicator values
                            </Label>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="sequentialCount"
                                    checked={sequentialCount}
                                    onCheckedChange={(checked) => setSequentialCount(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="sequentialCount" className="text-sm font-medium cursor-pointer text-card-foreground">
                                    Sequential count of matching case in each group (0=nonmatching case)
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Sequential count of matching cases in each group (0=nonmatching case)
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="sequentialName" className="text-xs whitespace-nowrap mr-2 text-card-foreground">
                                Name:
                            </Label>
                            <Input
                                id="sequentialName"
                                value={sequentialName}
                                onChange={(e) => setSequentialName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!sequentialCount}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-border rounded-md p-6 bg-card">
                <div className="text-sm font-medium mb-4 text-card-foreground">Additional Options</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="moveToTop"
                            checked={moveMatchingToTop}
                            onCheckedChange={(checked) => setMoveMatchingToTop(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="moveToTop" className="text-sm cursor-pointer text-card-foreground">
                            Move matching cases to the top of the file
                        </Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="displayFrequencies"
                            checked={displayFrequencies}
                            onCheckedChange={(checked) => setDisplayFrequencies(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="displayFrequencies" className="text-sm cursor-pointer text-card-foreground">
                            Display frequencies for created variables
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OptionsTab;