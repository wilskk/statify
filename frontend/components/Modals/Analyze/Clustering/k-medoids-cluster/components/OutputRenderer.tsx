/**
 * K-Medoids Comprehensive Output Renderer
 * Main component that displays all analysis results
 * Integrates with existing ResultOutput infrastructure
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import type { KMedoidsOutput } from "../types/output";
import { KMedoidsSummaryCards } from "./SummaryCards";
import { ClusterProfilesComponent } from "./ClusterProfiles";
import { DistanceMatrixHeatmap } from "./DistanceMatrix";
import { 
    formatScatterPlotData, 
    formatDonutChartData, 
    formatRadarChartData,
    formatConvergenceChartData,
    formatSilhouetteBarChartData,
    formatElbowChartData,
    ChartCard 
} from "./ChartFormatters";
import { KMedoidsRadarChart } from "./RadarChart";
import { ClusterScatterPlot } from "./ClusterScatterPlot";
import { PCAClusterPlot } from "./PCAClusterPlot";
import { ClusterSizeDistribution } from "./ClusterSizeDistribution";
import { SilhouetteBarChart } from "./SilhouetteBarChart";
import { SilhouettePerObjectChart } from "./SilhouettePerObjectChart";
import { ElbowChart } from "./ElbowChart";
import { ConvergenceChart } from "./ConvergenceChart";
import { IterationDetailsTable } from "./IterationDetailsTable";
import { ConvergenceAlgorithmPanel } from "./ConvergenceAlgorithmPanel";
import DataTableRenderer from "@/components/Output/Table/DataTableRenderer";
import GeneralChartContainer from "@/components/Output/Chart/GeneralChartContainer";

interface KMedoidsOutputRendererProps {
    output: KMedoidsOutput;
    variables: { name: string; label?: string }[];
}

// Max data points to render in SVG charts (display only – analysis uses all data)
const MAX_DISPLAY_POINTS = 500;
const ASSIGNMENTS_PAGE_SIZE = 100;

/** Stratified sample: pick up to `max` points while preserving cluster ratios. */
function samplePoints<T extends { cluster: number }>(pts: T[], max: number): T[] {
    if (pts.length <= max) return pts;
    const byCluster = new Map<number, T[]>();
    for (const p of pts) {
        if (!byCluster.has(p.cluster)) byCluster.set(p.cluster, []);
        byCluster.get(p.cluster)!.push(p);
    }
    const result: T[] = [];
    byCluster.forEach((clusterPts) => {
        const quota = Math.max(1, Math.round((clusterPts.length / pts.length) * max));
        const step = clusterPts.length / quota;
        for (let i = 0; i < quota; i++) {
            result.push(clusterPts[Math.floor(i * step)]);
        }
    });
    return result;
}

type ExportFormat = "svg" | "png";

function cloneNodeWithInlineStyles(source: HTMLElement): HTMLElement {
    const clone = source.cloneNode(true) as HTMLElement;

    const applyStyles = (src: Element, dst: Element) => {
        if (!(dst instanceof HTMLElement)) return;
        const computed = window.getComputedStyle(src);
        const dstStyle = dst.style as CSSStyleDeclaration;
        for (const prop of Array.from(computed)) {
            try {
                dstStyle.setProperty(prop, computed.getPropertyValue(prop));
            } catch {
                // Ignore non-writable computed properties
            }
        }

        const srcChildren = Array.from(src.children);
        const dstChildren = Array.from(dst.children);
        for (let i = 0; i < srcChildren.length; i++) {
            if (dstChildren[i]) applyStyles(srcChildren[i], dstChildren[i]);
        }
    };

    applyStyles(source, clone);
    return clone;
}

function sanitizeFilename(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const KMedoidsOutputRenderer: React.FC<KMedoidsOutputRendererProps> = ({ output, variables }) => {
    const pcaChartRef = useRef<HTMLDivElement>(null);
    const scatterChartRef = useRef<HTMLDivElement>(null);
    const sizeDistChartRef = useRef<HTMLDivElement>(null);
    const radarChartRef = useRef<HTMLDivElement>(null);
    const distanceMatrixRef = useRef<HTMLDivElement>(null);
    const silhouetteObjRef = useRef<HTMLDivElement>(null);
    const silhouetteClusterRef = useRef<HTMLDivElement>(null);
    const convergenceChartRef = useRef<HTMLDivElement>(null);

    // Use variables from output if not provided as prop
    const effectiveVariables = (variables && variables.length > 0
        ? variables
        : output?.variables || []);

    const [selectedXVar, setSelectedXVar] = useState(effectiveVariables[0]?.name || "");
    const [selectedYVar, setSelectedYVar] = useState(effectiveVariables[1]?.name || effectiveVariables[0]?.name || "");
    const [currentAssignmentsPage, setCurrentAssignmentsPage] = useState(1);
    const showPCAProjection =
        (output?.visualizationOptions?.showPCAProjection ?? true) &&
        effectiveVariables.length > 2;
    const showClusterScatterPlot =
        output?.visualizationOptions?.showClusterScatterPlot ?? true;
    const showClusterSizeDistribution =
        output?.visualizationOptions?.showClusterSizeDistribution ?? true;
    const showClusterAttributeProfile =
        output?.visualizationOptions?.showClusterAttributeProfile ?? true;
    const showDistanceMatrixBetweenMedoids =
        output?.visualizationOptions?.showDistanceMatrixBetweenMedoids ?? true;
    const showClusterMedoids =
        output?.visualizationOptions?.showClusterMedoids ?? true;
    const showObjectAssignments =
        output?.visualizationOptions?.showObjectAssignments ?? true;
    const showSilhouettePerObject =
        output?.visualizationOptions?.showSilhouettePerObject ?? false;
    const showSilhouetteByCluster =
        output?.visualizationOptions?.showSilhouetteByCluster ?? true;
    const showOverallQualityAssessment =
        output?.visualizationOptions?.showOverallQualityAssessment ?? true;
    const showConvergenceAlgorithm =
        output?.visualizationOptions?.showConvergenceAlgorithm ?? true;
    const hasVisualizationContent =
        showPCAProjection ||
        showClusterScatterPlot ||
        showClusterSizeDistribution ||
        showClusterAttributeProfile ||
        showDistanceMatrixBetweenMedoids;

    const totalAssignmentsRows = output?.assignments?.length ?? 0;
    const totalAssignmentsPages = Math.max(
        1,
        Math.ceil(totalAssignmentsRows / ASSIGNMENTS_PAGE_SIZE)
    );

    useEffect(() => {
        setCurrentAssignmentsPage(1);
    }, [totalAssignmentsRows]);

    // Memoize PCA points to avoid recreating on every render
    const pcaPoints = useMemo(() => {
        if (!output?.assignments) return [];
        return samplePoints(
            output.assignments
                .filter(a => !a.isMedoid)
                .map(a => ({
                    features: effectiveVariables.map(v => {
                        const n = Number(a.attributes?.[v.name]);
                        return isFinite(n) ? n : 0;
                    }),
                    cluster: a.clusterLabel,
                    label: `Case ${a.objectId}`,
                })),
            MAX_DISPLAY_POINTS
        );
    }, [output?.assignments, effectiveVariables]);

    const pcaMedoids = useMemo(() => {
        if (!output?.assignments) return [];
        return output.assignments
            .filter(a => a.isMedoid)
            .map(a => ({
                features: effectiveVariables.map(v => {
                    const n = Number(a.attributes?.[v.name]);
                    return isFinite(n) ? n : 0;
                }),
                cluster: a.clusterLabel,
            }));
    }, [output?.assignments, effectiveVariables]);

    const scatterPoints = useMemo(() => {
        if (!output?.assignments) return [];
        return samplePoints(
            output.assignments
                .filter(a => isFinite(Number(a.attributes?.[selectedXVar])) && isFinite(Number(a.attributes?.[selectedYVar])))
                .map(a => ({
                    x: Number(a.attributes?.[selectedXVar]),
                    y: Number(a.attributes?.[selectedYVar]),
                    cluster: a.clusterLabel,
                    label: `Case ${a.objectId}`,
                })),
            MAX_DISPLAY_POINTS
        );
    }, [output?.assignments, selectedXVar, selectedYVar]);

    const scatterMedoids = useMemo(() => {
        if (!output?.assignments) return [];
        return output.assignments
            .filter(a => a.isMedoid && isFinite(Number(a.attributes?.[selectedXVar])) && isFinite(Number(a.attributes?.[selectedYVar])))
            .map(a => ({
                x: Number(a.attributes?.[selectedXVar]),
                y: Number(a.attributes?.[selectedYVar]),
                cluster: a.clusterLabel,
            }));
    }, [output?.assignments, selectedXVar, selectedYVar]);

    const pagedAssignments = useMemo(() => {
        if (!output?.assignments) return [];
        const start = (currentAssignmentsPage - 1) * ASSIGNMENTS_PAGE_SIZE;
        return output.assignments.slice(start, start + ASSIGNMENTS_PAGE_SIZE);
    }, [output?.assignments, currentAssignmentsPage]);

    // Keep Convergence card consistent with the convergence panel/history.
    // History shape: [Init, Iter 1, Iter 2, ...] so visible iterations = len - 1.
    const historyIterations = Array.isArray(output?.iterationHistory)
        ? Math.max(output.iterationHistory.length - 1, 0)
        : 0;
    const normalizedIterations =
        output?.summary?.totalIterations > 0
            ? output.summary.totalIterations
            : historyIterations;
    const summaryForCards = {
        ...output.summary,
        totalIterations: normalizedIterations,
    };

    // Memoize assignments table JSON to avoid re-serializing on every render
    const assignmentsTableJson = useMemo(() => {
        if (!output?.assignments) return "{}";
        const hasStandardizedAssignmentData = output.assignments.some(
            a => a.standardizedAttributes && Object.keys(a.standardizedAttributes).length > 0
        );
        return JSON.stringify({ tables: [
            {
                key: "assignments",
                title: "Cluster Assignments",
                columnHeaders: [
                    { header: "ID" },
                    { header: "Cluster" },
                    { header: "Distance" },
                    { header: "Silhouette" },
                    ...effectiveVariables.map(v => ({ header: v.label || v.name, key: v.name })),
                    ...(hasStandardizedAssignmentData
                        ? effectiveVariables.map(v => ({
                              header: `${v.label || v.name} (Z-score)`,
                              key: `${v.name}_zscore`,
                          }))
                        : [])
                ],
                rows: pagedAssignments.map(a => ({
                    rowHeader: [],
                    ID: a.isMedoid ? `★ ${a.objectId}` : a.objectId,
                    Cluster: a.clusterLabel,
                    Distance: typeof a.distanceToMedoid === 'number' ? a.distanceToMedoid.toFixed(4) : 'N/A',
                    Silhouette: typeof a.silhouetteScore === 'number' ? a.silhouetteScore.toFixed(3) : 'N/A',
                    ...Object.fromEntries(
                        effectiveVariables.map(v => [v.name, a.attributes[v.name] ?? 'N/A'])
                    ),
                    ...Object.fromEntries(
                        hasStandardizedAssignmentData
                            ? effectiveVariables.map(v => {
                                  const standardizedValue = a.standardizedAttributes?.[v.name];
                                  return [
                                      `${v.name}_zscore`,
                                      typeof standardizedValue === 'number' && isFinite(standardizedValue)
                                          ? standardizedValue.toFixed(4)
                                          : 'N/A',
                                  ];
                              })
                            : []
                    ),
                }))
            }
        ]});
    }, [output?.assignments, pagedAssignments, effectiveVariables]);

    // Memoize medoids table JSON
    const medoidsTableJson = useMemo(() => {
        if (!output?.tables) return "{}";
        return JSON.stringify({ tables: output.tables.filter(t => t.key === "medoids") });
    }, [output?.tables]);

    const buildSvgFromContainer = useCallback((container: HTMLDivElement): { svgText: string; width: number; height: number } | null => {
        const svgElement = container.querySelector("svg");

        if (svgElement) {
            const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
            if (!clonedSvg.getAttribute("xmlns")) {
                clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }

            const rect = svgElement.getBoundingClientRect();
            const viewBox = clonedSvg.viewBox?.baseVal;
            const width = Math.ceil(
                (viewBox && viewBox.width > 0 ? viewBox.width : rect.width) || Number(clonedSvg.getAttribute("width")) || 800
            );
            const height = Math.ceil(
                (viewBox && viewBox.height > 0 ? viewBox.height : rect.height) || Number(clonedSvg.getAttribute("height")) || 500
            );

            clonedSvg.setAttribute("width", String(width));
            clonedSvg.setAttribute("height", String(height));
            if (!clonedSvg.getAttribute("viewBox")) {
                clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            }

            return {
                svgText: new XMLSerializer().serializeToString(clonedSvg),
                width,
                height,
            };
        }

        const rect = container.getBoundingClientRect();
        const width = Math.max(320, Math.ceil(rect.width));
        const height = Math.max(200, Math.ceil(rect.height));
        const clonedContainer = cloneNodeWithInlineStyles(container);
        const wrapper = document.createElement("div");
        wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;
        wrapper.style.background = "#ffffff";
        wrapper.style.boxSizing = "border-box";
        wrapper.appendChild(clonedContainer);

        const svgText =
            `<?xml version="1.0" encoding="UTF-8"?>` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
            `<foreignObject width="100%" height="100%">${wrapper.outerHTML}</foreignObject>` +
            `</svg>`;

        return { svgText, width, height };
    }, []);

    const handleDownloadVisualization = useCallback(async (
        containerRef: React.RefObject<HTMLDivElement | null>,
        baseFileName: string,
        format: ExportFormat
    ) => {
        const container = containerRef.current;
        if (!container) return;

        const built = buildSvgFromContainer(container);
        if (!built) return;

        const safeName = sanitizeFilename(baseFileName);

        if (format === "svg") {
            const blob = new Blob([built.svgText], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeName}.svg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            return;
        }

        const svgBlob = new Blob([built.svgText], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Failed to load SVG for PNG export"));
                img.src = svgUrl;
            });

            const canvas = document.createElement("canvas");
            canvas.width = built.width;
            canvas.height = built.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const pngBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/png");
            });
            if (!pngBlob) return;

            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `${safeName}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(pngUrl);
        } finally {
            URL.revokeObjectURL(svgUrl);
        }
    }, [buildSvgFromContainer]);

    const renderDownloadActions = useCallback((
        targetRef: React.RefObject<HTMLDivElement | null>,
        fileName: string
    ) => (
        <div className="mb-3 flex items-center justify-end gap-2">
            <button
                className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-100"
                onClick={() => void handleDownloadVisualization(targetRef, fileName, "svg")}
                title="Download as SVG"
                type="button"
            >
                <Download className="w-4 h-4 inline-block mr-1" />
                <span className="text-xs">SVG</span>
            </button>
            <button
                className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-100"
                onClick={() => void handleDownloadVisualization(targetRef, fileName, "png")}
                title="Download as PNG"
                type="button"
            >
                <Download className="w-4 h-4 inline-block mr-1" />
                <span className="text-xs">PNG</span>
            </button>
        </div>
    ), [handleDownloadVisualization]);

    // Validate input
    if (!output) {
        return (
            <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
                Error: No output data available
            </div>
        );
    }

    // Check if we have variables to display
    if (effectiveVariables.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
                No variable information available for visualization. Analysis data may be loading...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <KMedoidsSummaryCards summary={summaryForCards} />

            {/* Tabbed Content */}
            <Tabs defaultValue={hasVisualizationContent ? "visualization" : "profiles"} className="w-full">
                <TabsList
                    className={`grid w-full ${
                        hasVisualizationContent
                            ? showConvergenceAlgorithm
                                ? "grid-cols-5"
                                : "grid-cols-4"
                            : showConvergenceAlgorithm
                                ? "grid-cols-4"
                                : "grid-cols-3"
                    }`}
                >
                    {hasVisualizationContent && <TabsTrigger value="visualization">Visualization</TabsTrigger>}
                    <TabsTrigger value="profiles">Cluster Profiles</TabsTrigger>
                    <TabsTrigger value="tables">Data Tables</TabsTrigger>
                    <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                    {showConvergenceAlgorithm && <TabsTrigger value="convergence">Convergence</TabsTrigger>}
                </TabsList>

                {/* VISUALIZATION TAB */}
                {hasVisualizationContent && <TabsContent value="visualization" className="space-y-4">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* PCA Projection */}
                        {showPCAProjection && <Card>
                            <CardHeader>
                                <CardTitle>PCA Projection</CardTitle>
                                <CardDescription>
                                    Seluruh variabel direduksi ke 2D menggunakan PCA.
                                    Setiap titik diwarnai sesuai klasternya; bintang (★) menandai medoid.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderDownloadActions(pcaChartRef, "pca-projection")}
                                {output.assignments.length > MAX_DISPLAY_POINTS && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Menampilkan sampel {MAX_DISPLAY_POINTS} dari {output.assignments.length} observasi (proporsi per klaster).
                                    </p>
                                )}
                                <div ref={pcaChartRef}>
                                    <PCAClusterPlot
                                        points={pcaPoints}
                                        medoids={pcaMedoids}
                                        variableNames={effectiveVariables.map(v => v.label || v.name)}
                                        title="PCA Projection of K-Medoids Clusters"
                                        height={420}
                                    />
                                </div>
                            </CardContent>
                        </Card>}

                        {/* Scatter Plot */}
                        {showClusterScatterPlot && <Card>
                            <CardHeader>
                                <CardTitle>Cluster Scatter Plot</CardTitle>
                                <CardDescription>
                                    2D visualization of clusters. Centroids marked with ⊗
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderDownloadActions(scatterChartRef, "cluster-scatter-plot")}
                                {/* Variable selectors */}
                                <div className="flex gap-2 mb-4">
                                    <select
                                        value={selectedXVar}
                                        onChange={(e) => setSelectedXVar(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                    >
                                        {effectiveVariables.map(v => (
                                            <option key={v.name} value={v.name}>{v.label || v.name}</option>
                                        ))}
                                    </select>
                                    <span className="flex items-center text-muted-foreground">vs</span>
                                    <select
                                        value={selectedYVar}
                                        onChange={(e) => setSelectedYVar(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                    >
                                        {effectiveVariables.map(v => (
                                            <option key={v.name} value={v.name}>{v.label || v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {output.assignments.length > MAX_DISPLAY_POINTS && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Menampilkan sampel {Math.min(MAX_DISPLAY_POINTS, scatterPoints.length)} dari {output.assignments.length} observasi.
                                    </p>
                                )}
                                {/* Cluster Scatter Plot */}
                                <div ref={scatterChartRef}>
                                    <ClusterScatterPlot
                                        points={scatterPoints}
                                        medoids={scatterMedoids}
                                        xLabel={effectiveVariables.find(v => v.name === selectedXVar)?.label || selectedXVar}
                                        yLabel={effectiveVariables.find(v => v.name === selectedYVar)?.label || selectedYVar}
                                        title="K-Medoids Cluster Visualization"
                                        subtitle={`${output.summary.numClusters} cluster(s) — ${output.assignments.length} observations`}
                                        height={420}
                                    />
                                </div>
                            </CardContent>
                        </Card>}

                        {/* Cluster Size Distribution — donut chart */}
                        {showClusterSizeDistribution && <Card>
                            <CardHeader>
                                <CardTitle>Cluster Size Distribution</CardTitle>
                                <CardDescription>
                                    Proportion of cases in each cluster
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderDownloadActions(sizeDistChartRef, "cluster-size-distribution")}
                                <div ref={sizeDistChartRef}>
                                    <ClusterSizeDistribution
                                        profiles={output.clusterProfiles}
                                        width={480}
                                        height={400}
                                    />
                                </div>
                            </CardContent>
                        </Card>}

                        {/* Radar Chart */}
                        {showClusterAttributeProfile && <Card>
                            <CardHeader>
                                <CardTitle>Profil Atribut Klaster</CardTitle>
                                <CardDescription>
                                    Rata-rata nilai atribut per klaster (min–max normalized)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderDownloadActions(radarChartRef, "profil-atribut-klaster")}
                                <div className="flex items-center justify-center">
                                    {effectiveVariables.length >= 2 ? (
                                        <div ref={radarChartRef}>
                                            <KMedoidsRadarChart
                                                output={output}
                                                variables={effectiveVariables}
                                                width={520}
                                                height={480}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                                            Radar chart membutuhkan minimal 2 variabel.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>}

                        {/* Distance Matrix */}
                        {showDistanceMatrixBetweenMedoids && <div>
                            <div ref={distanceMatrixRef}>
                                <DistanceMatrixHeatmap
                                    matrix={output.medoidDistanceMatrix}
                                    actions={renderDownloadActions(distanceMatrixRef, "distance-matrix-between-medoids")}
                                />
                            </div>
                        </div>}
                    </div>
                </TabsContent>}

                {/* CLUSTER PROFILES TAB */}
                <TabsContent value="profiles" className="space-y-4">
                    <ClusterProfilesComponent profiles={output.clusterProfiles} variables={effectiveVariables} />
                </TabsContent>

                {/* DATA TABLES TAB */}
                <TabsContent value="tables" className="space-y-4">
                    {/* Medoids Table */}
                    {showClusterMedoids && <Card>
                        <CardHeader>
                            <CardTitle>Cluster Medoids</CardTitle>
                            <CardDescription>
                                Representative objects (medoids) for each cluster
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTableRenderer data={medoidsTableJson} align="left" />
                        </CardContent>
                    </Card>}

                    {/* Assignments Table */}
                    {showObjectAssignments && <Card>
                        <CardHeader>
                            <CardTitle>Object Assignments</CardTitle>
                            <CardDescription>
                                All objects with cluster assignments and distances. Medoids marked with ★
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-3 flex flex-col items-center gap-2 text-xs text-muted-foreground">
                                <span className="text-center">
                                    Rows {totalAssignmentsRows === 0 ? 0 : (currentAssignmentsPage - 1) * ASSIGNMENTS_PAGE_SIZE + 1}
                                    -{Math.min(currentAssignmentsPage * ASSIGNMENTS_PAGE_SIZE, totalAssignmentsRows)} of {totalAssignmentsRows}
                                </span>
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentAssignmentsPage((p) => Math.max(1, p - 1))}
                                        disabled={currentAssignmentsPage <= 1}
                                    >
                                        Prev
                                    </Button>
                                    <span>Page {currentAssignmentsPage} / {totalAssignmentsPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentAssignmentsPage((p) => Math.min(totalAssignmentsPages, p + 1))
                                        }
                                        disabled={currentAssignmentsPage >= totalAssignmentsPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                            <DataTableRenderer data={assignmentsTableJson} />
                        </CardContent>
                    </Card>}
                </TabsContent>

                {/* EVALUATION TAB */}
                <TabsContent value="evaluation" className="space-y-4">

                    {/* Silhouette per Object — full-width */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Silhouette per Object */}
                        {showSilhouettePerObject && <Card>
                            <CardHeader>
                                <CardTitle>Silhouette Score per Objek</CardTitle>
                                <CardDescription>
                                    Setiap batang mewakili satu objek, dikelompokkan per klaster dan diurutkan menurun.
                                    Batang merah menandakan nilai negatif.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderDownloadActions(silhouetteObjRef, "silhouette-score-per-objek")}
                                <div ref={silhouetteObjRef}>
                                    <SilhouettePerObjectChart
                                        assignments={output.assignments}
                                        overall={output.silhouetteScores?.overall ?? 0}
                                        width={520}
                                    />
                                </div>
                            </CardContent>
                        </Card>}

                        {/* Silhouette Bar Chart */}
                        {showSilhouetteByCluster && <Card>
                            <CardHeader>
                                <CardTitle>Silhouette Scores by Cluster</CardTitle>
                                <CardDescription>
                                    Higher scores indicate better-defined clusters
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderDownloadActions(silhouetteClusterRef, "silhouette-scores-by-cluster")}
                                <div ref={silhouetteClusterRef}>
                                    <SilhouetteBarChart
                                        perCluster={output.silhouetteScores?.perCluster ?? []}
                                        overall={output.silhouetteScores?.overall ?? 0}
                                        width={520}
                                        height={Math.max(300, (output.silhouetteScores?.perCluster?.length ?? 1) * 90 + 88)}
                                    />
                                </div>
                            </CardContent>
                        </Card>}

                        {/* Elbow Chart (if available) */}
                        {output.elbowData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Elbow Method</CardTitle>
                                    <CardDescription>
                                        Optimal K selection visualization
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ElbowChart
                                        data={output.elbowData}
                                        currentK={output.summary.numClusters}
                                        width={520}
                                        height={400}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Silhouette Interpretation */}
                        {showOverallQualityAssessment && <Card>
                            <CardHeader>
                                <CardTitle>Overall Quality Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Overall Silhouette Score</div>
                                        <div className="text-3xl font-bold">{output.silhouetteScores?.overall != null ? output.silhouetteScores.overall.toFixed(3) : 'N/A'}</div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Interpretation Guide:</div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                                <span>0.7 - 1.0: Very strong cluster structure</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                                <span>0.5 - 0.7: Strong cluster structure</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                                                <span>0.3 - 0.5: Moderate cluster structure</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                                <span>&lt; 0.3: Weak cluster structure</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>}
                    </div>
                </TabsContent>

                {/* CONVERGENCE TAB */}
                {showConvergenceAlgorithm && (
                    <TabsContent value="convergence" className="space-y-4">
                        {/* Tabel iterasi Init → Konvergen */}
                        <Card>
                            <CardContent className="pt-6">
                                <ConvergenceAlgorithmPanel
                                    data={output.iterationHistory}
                                    medoids={output.medoids}
                                    converged={output.summary.converged}
                                />
                            </CardContent>
                        </Card>

                        {/* Grafik konvergensi dual-axis (Total Cost + Improvement) */}
                        {output.iterationHistory && output.iterationHistory.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Grafik Konvergensi</CardTitle>
                                    <CardDescription>
                                        Total Cost (biru) dan Improvement per iterasi (kuning) — dari Init hingga konvergen
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {renderDownloadActions(convergenceChartRef, "grafik-konvergensi")}
                                    <div ref={convergenceChartRef}>
                                        <ConvergenceChart
                                            data={output.iterationHistory}
                                            converged={output.summary.converged}
                                            width={580}
                                            height={340}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tabel histori detail per iterasi */}
                        {output.iterationHistory && output.iterationHistory.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Histori Iterasi</CardTitle>
                                    <CardDescription>
                                        Rincian perubahan Total Cost, Improvement, dan jumlah Swap dari Init sampai konvergen
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <IterationDetailsTable
                                        data={output.iterationHistory}
                                        converged={output.summary.converged}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
