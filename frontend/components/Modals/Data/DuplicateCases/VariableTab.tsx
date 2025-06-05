import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";
import { Variable } from "@/types/Variable";
import { VariableTabProps } from "./types";

const VariableTab: FC<VariableTabProps> = ({
                                               sourceVariables,
                                               matchingVariables,
                                               sortingVariables,
                                               highlightedVariable,
                                               setHighlightedVariable,
                                               sortOrder,
                                               setSortOrder,
                                               handleMoveVariable,
                                               handleReorderVariable,
                                               getVariableIcon,
                                               getDisplayName,
                                               containerType = "dialog"
                                           }) => {
    // Konfigurasi untuk variabel matching
    const matchingListConfig: TargetListConfig = {
        id: 'matching',
        title: 'Define matching cases by:',
        variables: matchingVariables,
        height: '150px',
        droppable: true,
        draggableItems: true
    };

    // Konfigurasi untuk variabel sorting
    const sortingListConfig: TargetListConfig = {
        id: 'sorting',
        title: 'Sort within matching groups by:',
        variables: sortingVariables,
        height: '100px',
        droppable: true,
        draggableItems: true
    };

    // Render additional footer for sorting list
    const renderListFooter = (listId: string) => {
        if (listId === 'sorting') {
            return (
                <div className="flex items-center mt-2">
                    <div className="ml-auto flex items-center space-x-4">
                        <div className="flex items-center">
                            <Checkbox
                                id="ascending"
                                checked={sortOrder === "ascending"}
                                onCheckedChange={() => setSortOrder("ascending")}
                                className="mr-2"
                            />
                            <Label htmlFor="ascending" className="text-xs cursor-pointer text-foreground">
                                Ascending
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox
                                id="descending"
                                checked={sortOrder === "descending"}
                                onCheckedChange={() => setSortOrder("descending")}
                                className="mr-2"
                            />
                            <Label htmlFor="descending" className="text-xs cursor-pointer text-foreground">
                                Descending
                            </Label>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full">
            <VariableListManager
                availableVariables={sourceVariables}
                targetLists={[matchingListConfig, sortingListConfig]}
                variableIdKey="tempId"
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariable}
                getVariableIcon={getVariableIcon}
                getDisplayName={getDisplayName}
                renderListFooter={renderListFooter}
                showArrowButtons={true}
                availableListHeight="300px"
            />
        </div>
    );
};

export default VariableTab;