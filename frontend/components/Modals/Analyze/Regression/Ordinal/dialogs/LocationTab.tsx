import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/Variable";
import { LocationInteraction, LocationModelTerm, OrdinalLocationParams } from "../types/ordinal";

interface Props {
    factors: Variable[];
    covariates: Variable[];
    params: OrdinalLocationParams;
    onChange: (params: OrdinalLocationParams) => void;
}

const isInteraction = (term: LocationModelTerm): term is LocationInteraction =>
    typeof term === "object" && "kind" in term && term.kind === "interaction";

const getVariableKey = (variable: Variable) => `${variable.id ?? "no-id"}-${variable.columnIndex}`;

const buildInteractionId = (variables: Variable[]) => {
    const keys = variables.map(getVariableKey).sort();
    return `interaction-${keys.join("::")}`;
};

const buildInteractionName = (variables: Variable[], allVars: Variable[]) => {
    const indexByKey = new Map(allVars.map((v, index) => [getVariableKey(v), index]));
    const ordered = [...variables].sort((a, b) => {
        const aIndex = indexByKey.get(getVariableKey(a)) ?? 0;
        const bIndex = indexByKey.get(getVariableKey(b)) ?? 0;
        return aIndex - bIndex;
    });
    return ordered.map((v) => v.name).join("*");
};

const buildInteractionTerm = (variables: Variable[], allVars: Variable[]): LocationInteraction => {
    const name = buildInteractionName(variables, allVars);
    return {
        kind: "interaction",
        id: buildInteractionId(variables),
        name,
        variables,
    };
};

export const LocationTab: React.FC<Props> = ({ factors, covariates, params, onChange }) => {
    const allVars = useMemo(() => [...factors, ...covariates], [factors, covariates]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [interactionMode, setInteractionMode] = useState(false);

    const selectedVariables = useMemo(
        () => allVars.filter((v) => selectedKeys.has(getVariableKey(v))),
        [allVars, selectedKeys]
    );

    const handleVariableClick = (event: React.MouseEvent<HTMLDivElement>, variable: Variable) => {
        const key = getVariableKey(variable);
        if (event.ctrlKey || event.shiftKey) {
            const nextKeys = new Set(selectedKeys);
            if (nextKeys.has(key)) {
                nextKeys.delete(key);
            } else {
                nextKeys.add(key);
            }
            setSelectedKeys(nextKeys);
            setInteractionMode(nextKeys.size >= 2);
        } else {
            const nextKeys = new Set<string>();
            nextKeys.add(key);
            setSelectedKeys(nextKeys);
            setInteractionMode(false);
        }
    };

    const handleAddSelection = () => {
        if (selectedVariables.length === 0) return;

        const existingKeys = new Set(
            params.locationModel.map((term) => (isInteraction(term) ? term.id : getVariableKey(term)))
        );

        if (interactionMode && selectedVariables.length >= 2) {
            const interaction = buildInteractionTerm(selectedVariables, allVars);
            if (!existingKeys.has(interaction.id)) {
                onChange({ locationModel: [...params.locationModel, interaction] });
            }
        } else {
            const variable = selectedVariables[0];
            const key = getVariableKey(variable);
            if (!existingKeys.has(key)) {
                onChange({ locationModel: [...params.locationModel, variable] });
            }
        }
    };

    const handleRemove = (term: LocationModelTerm) => {
        if (isInteraction(term)) {
            onChange({ locationModel: params.locationModel.filter((item) => !isInteraction(item) || item.id !== term.id) });
            return;
        }
        onChange({ locationModel: params.locationModel.filter((item) => isInteraction(item) || getVariableKey(item) !== getVariableKey(term)) });
    };

    return (
        <div className="flex gap-4 h-full">
            <Card className="w-1/3">
                <CardHeader>
                    <CardTitle>Factors/covariates</CardTitle>
                </CardHeader>
                <CardContent>
                    {allVars.map((variable) => {
                        const key = getVariableKey(variable);
                        const isSelected = selectedKeys.has(key);
                        return (
                            <div
                                key={key}
                                className={`p-2 rounded cursor-pointer ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
                                onClick={(event) => handleVariableClick(event, variable)}
                            >
                                {variable.name}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
            <div className="flex flex-col justify-center">
                <Button onClick={handleAddSelection}>&gt;</Button>
            </div>
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Location model</CardTitle>
                </CardHeader>
                <CardContent>
                    {params.locationModel.map((term) => (
                        <div
                            key={isInteraction(term) ? term.id : getVariableKey(term)}
                            className="p-2 rounded cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRemove(term)}
                        >
                            {isInteraction(term) ? term.name : term.name}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};