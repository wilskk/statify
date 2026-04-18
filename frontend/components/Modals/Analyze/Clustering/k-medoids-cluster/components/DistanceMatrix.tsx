/**
 * Distance Matrix Heatmap Component
 * Visualizes distances between cluster medoids
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MedoidDistanceMatrix } from "../types/output";

interface DistanceMatrixProps {
    matrix: MedoidDistanceMatrix;
    actions?: React.ReactNode;
}

export const DistanceMatrixHeatmap: React.FC<DistanceMatrixProps> = ({ matrix, actions }) => {
    // Find min and max values for color scaling
    const flatDistances = matrix.distances
        .flat()
        .filter(d => d != null && isFinite(d) && d > 0);
    
    const minDist = flatDistances.length > 0 ? flatDistances.reduce((a, b) => a < b ? a : b) : 0;
    const maxDist = flatDistances.length > 0 ? flatDistances.reduce((a, b) => a > b ? a : b) : 0;

    // Color scale function
    const getColor = (value: number): string => {
        if (value === 0) return "bg-gray-200 dark:bg-gray-800";
        
        const normalized = (value - minDist) / (maxDist - minDist);
        
        if (normalized < 0.33) return "bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100";
        if (normalized < 0.67) return "bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100";
        return "bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100";
    };

    const getInterpretation = (value: number): string => {
        if (value === 0) return "Same cluster";
        
        const normalized = (value - minDist) / (maxDist - minDist);
        
        if (normalized < 0.33) return "Very similar";
        if (normalized < 0.67) return "Moderately separated";
        return "Well separated";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distance Matrix Between Medoids</CardTitle>
                <CardDescription>
                    Lower values indicate more similar clusters. Higher values indicate better separation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {actions && <div className="mb-3 flex items-center justify-end gap-2">{actions}</div>}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border border-border p-2 bg-muted"></th>
                                {matrix.clusterLabels.map(label => (
                                    <th key={label} className="border border-border p-2 bg-muted font-semibold">
                                        C{label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.clusterLabels.map((rowLabel, i) => (
                                <tr key={rowLabel}>
                                    <td className="border border-border p-2 bg-muted font-semibold">
                                        C{rowLabel}
                                    </td>
                                    {matrix.clusterLabels.map((colLabel, j) => {
                                        const distance = matrix.distances[i]?.[j];
                                        const safeDistance = distance != null && isFinite(distance) ? distance : 0;
                                        
                                        return (
                                            <td
                                                key={colLabel}
                                                className={`border border-border p-3 text-center font-mono text-sm ${getColor(safeDistance)}`}
                                                title={getInterpretation(safeDistance)}
                                            >
                                                {safeDistance.toFixed(2)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-200 dark:bg-green-900 border border-border"></div>
                        <span>Similar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900 border border-border"></div>
                        <span>Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-200 dark:bg-red-900 border border-border"></div>
                        <span>Separated</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
