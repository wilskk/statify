"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
    MenuIcon,
    FileIcon,
    EditIcon,
    DatabaseIcon,
    WandIcon,
    BarChartIcon,
    LineChartIcon,
    HelpCircleIcon,
    ChevronRightIcon
} from 'lucide-react';

import { useActions, ActionPayload } from "@/hooks/actions";
import { ModalType, useModal } from "@/hooks/useModal";
// NOTE: We don't need useMobile *inside* this component,
// it will be rendered conditionally by its parent.

// Helper component for simple menu items inside the Accordion
const DrawerMenuItem: React.FC<{onClick?: () => void, children: React.ReactNode, disabled?: boolean}> = ({ onClick, children, disabled }) => (
    <Button
        variant="ghost"
        className="w-full justify-start px-2 py-1 text-xs font-normal h-auto text-left whitespace-normal text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-none border-l-2 border-transparent hover:border-zinc-300"
        onClick={onClick}
        disabled={disabled}
    >
        <ChevronRightIcon className="h-3 w-3 mr-1.5 text-zinc-400" />
        {children}
    </Button>
);

// Helper component for nested Accordion triggers
const NestedAccordionTrigger: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <AccordionTrigger className="text-xs font-medium py-1.5 hover:no-underline text-zinc-800 hover:text-black bg-zinc-50 border-l-2 border-zinc-200">
        <div className="flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 mr-1.5"></div>
            {children}
        </div>
    </AccordionTrigger>
);

// Helper component for separators
const DrawerMenuSeparator = () => <hr className="my-0.5 border-zinc-200" />

const HamburgerMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useActions();

    return (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 bg-white">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-1.5 hover:bg-zinc-100">
                        <MenuIcon className="h-5 w-5 text-zinc-800" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto w-[85vw] sm:w-[300px] p-0 border-r border-zinc-200 bg-white">
                    <SheetHeader className="px-4 py-3 border-b border-zinc-200">
                        <SheetTitle className="text-sm font-medium text-zinc-900">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="py-1 overflow-y-auto">
                        <Accordion type="multiple" className="w-full">

                            {/* --- File Accordion Item --- */}
                            <AccordionItem value="file" className="border-b border-zinc-200">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <FileIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>File</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col space-y-0.5 pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'New' })}>New</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Save' })}>Save</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'SaveAs' })}>Save As...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.OpenData)}>Open Data</DrawerMenuItem>
                                    {/* Import Data Sub-Accordion */}
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="import-data" className="border-0">
                                            <NestedAccordionTrigger>Import Data</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-6 pr-0 pb-1 pt-0 bg-zinc-50">
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ImportExcel)}>Excel...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ImportCSV)}>CSV Data...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                    <DrawerMenuSeparator />
                                    {/* Export Sub-Accordion */}
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="export-data" className="border-0">
                                            <NestedAccordionTrigger>Export</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-6 pr-0 pb-1 pt-0 bg-zinc-50">
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ExportExcel)}>Excel...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ExportCSV)}>CSV Data...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => openModal(ModalType.Print)}>Print...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Exit' })}>Exit</DrawerMenuItem>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- Edit Accordion Item --- */}
                            <AccordionItem value="edit" className="border-b border-zinc-200">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <EditIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>Edit</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col space-y-0.5 pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Undo' })}>Undo</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Redo' })}>Redo</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Cut' })}>Cut</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Copy' })}>Copy</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'CopyWithVariableNames' })} disabled={false}>Copy with Variable Names</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'CopyWithVariableLabels' })} disabled={false}>Copy with Variable Labels</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Paste' })}>Paste</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'PasteVariables' })} disabled={false}>Paste Variables...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'PasteWithVariableNames' })} disabled={false}>Paste with Variable Names</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'Clear' })}>Clear</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'InsertVariable' })} disabled={false}>Insert Variable</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => handleAction({ actionType: 'InsertCases' })} disabled={false}>Insert Cases</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => openModal(ModalType.Find)}>Find...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.Replace)}>Replace...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.GoToCase)}>Go to Case...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.GoToVariable)}>Go to Variable...</DrawerMenuItem>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- Data Accordion Item --- */}
                            <AccordionItem value="data" className="border-b border-zinc-200">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <DatabaseIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>Data</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col space-y-0.5 pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <DrawerMenuItem onClick={() => openModal(ModalType.DefineVarProps)}>Define Variable Properties...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.SetMeasurementLevel)}>Set Measurement Level...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.DefineDateTime)}>Define Date and Time...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => openModal(ModalType.DuplicateCases)}>Identify Duplicate Cases...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.UnusualCases)}>Identify Unusual Cases...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => openModal(ModalType.SortCases)}>Sort Cases...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.SortVars)}>Sort Variables...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.Transpose)}>Transpose...</DrawerMenuItem>
                                    <DrawerMenuItem onClick={() => openModal(ModalType.Aggregate)}>Aggregate...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem onClick={() => openModal(ModalType.WeightCases)}>Weight Cases...</DrawerMenuItem>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- Transform Accordion Item --- */}
                            <AccordionItem value="transform" className="border-b border-zinc-200">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <WandIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>Transform</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col space-y-0.5 pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <DrawerMenuItem onClick={() => openModal(ModalType.ComputeVariable)}>Compute Variable...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Programmability Transformation...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Count Values within Cases...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Shift Values...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem disabled>Recode into Same Variables...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Recode into Different Variables...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Automatic Recode...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Create Dummy Variables...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Visual Binning...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Optimal Binning...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Prepare Data for Modeling</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem disabled>Rank Cases...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem disabled>Date and Time Wizard...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Create Time Series...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Replace Missing Values...</DrawerMenuItem>
                                    <DrawerMenuItem disabled>Random Number Generators...</DrawerMenuItem>
                                    <DrawerMenuSeparator />
                                    <DrawerMenuItem disabled>Run Pending Transforms</DrawerMenuItem>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- Analyze Accordion Item --- */}
                            <AccordionItem value="analyze" className="border-b border-zinc-200">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <BarChartIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>Analyze</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="desc-stats" className="border-0">
                                            <NestedAccordionTrigger>Descriptive Statistics</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-6 pr-0 pb-1 pt-0 bg-zinc-50">
                                                <DrawerMenuItem onClick={() => openModal(ModalType.Frequencies)}>Frequencies...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.Descriptive)}>Descriptives...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.Explore)}>Explore...</DrawerMenuItem>
                                                {/* <DrawerMenuItem onClick={() => openModal(ModalType.Crosstabs)}>Crosstabs...</DrawerMenuItem> */}
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem onClick={() => openModal(ModalType.Ratio)}>Ratio...</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem onClick={() => openModal(ModalType.PPPlots)}>P-P Plots...</DrawerMenuItem>
                                                {/* <DrawerMenuItem onClick={() => openModal(ModalType.QQPlots)}>Q-Q Plots...</DrawerMenuItem> */}
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="compare-means" className="border-0">
                                            <NestedAccordionTrigger>Compare Means</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-3 pr-0 pb-1 pt-0">
                                                <DrawerMenuItem disabled>One-Sample T Test...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Independent-Samples T Test...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Paired-Samples T Test...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>One-Way ANOVA...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="glm" className="border-0">
                                            <NestedAccordionTrigger>General Linear Model</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-3 pr-0 pb-1 pt-0">
                                                <DrawerMenuItem disabled>Univariate...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Multivariate...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Repeated Measures...</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem disabled>Variance Components...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="correlate" className="border-0">
                                            <NestedAccordionTrigger>Correlate</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-3 pr-0 pb-1 pt-0">
                                                <DrawerMenuItem disabled>Bivariate...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Partial...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Distances...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Canonical Correlation...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="regression" className="border-0">
                                            <NestedAccordionTrigger>Regression</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-3 pr-0 pb-1 pt-0">
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalAutomaticLinearModeling)}>Automatic Linear Modeling...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalLinear)}>Linear...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalCurveEstimation)}>Curve Estimation...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalPartialLeastSquares)}>Partial Least Squares...</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalBinaryLogistic)}>Binary Logistic...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalMultinomialLogistic)}>Multinomial Logistic...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalOrdinal)}>Ordinal...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalProbit)}>Probit...</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalNonlinear)}>Nonlinear...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalWeightEstimation)}>Weight Estimation...</DrawerMenuItem>
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalTwoStageLeastSquares)}>2-Stage Least Squares...</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalQuantiles)}>Quantiles...</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ModalOptimalScaling)}>Optimal Scaling (Catreg)...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="nonparametric" className="border-0">
                                            <NestedAccordionTrigger>Nonparametric Test</NestedAccordionTrigger>
                                            <AccordionContent className="pl-3 pr-0 pb-1 pt-0">
                                                <Accordion type="multiple" className="w-full">
                                                    <AccordionItem value="nonparam-main" className="border-0">
                                                        {/* Direct items for Nonparametric */}
                                                        <AccordionContent className="flex flex-col space-y-0.5">
                                                            <DrawerMenuItem disabled>One Sample...</DrawerMenuItem>
                                                            <DrawerMenuItem disabled>Independent Samples...</DrawerMenuItem>
                                                            <DrawerMenuItem disabled>Related Samples...</DrawerMenuItem>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="nonparam-legacy" className="border-0">
                                                        <NestedAccordionTrigger>Legacy Dialogs</NestedAccordionTrigger>
                                                        <AccordionContent className="flex flex-col space-y-0.5 pl-3 pr-0 pb-1 pt-0">
                                                            <DrawerMenuItem disabled>Chi-square...</DrawerMenuItem>
                                                            <DrawerMenuItem disabled>Runs...</DrawerMenuItem>
                                                            <DrawerMenuItem disabled>2 Independent Samples...</DrawerMenuItem>
                                                            <DrawerMenuItem disabled>K Independent Samples...</DrawerMenuItem>
                                                            <DrawerMenuItem disabled>2 Related Samples...</DrawerMenuItem>
                                                            <DrawerMenuItem onClick={() => openModal(ModalType.KRelatedSamples)}>K Related Samples...</DrawerMenuItem>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="timeseries" className="border-0">
                                            <NestedAccordionTrigger>Time Series</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-3 pr-0 pb-1 pt-0">
                                                <DrawerMenuItem onClick={()=>openModal(ModalType.Decomposition)}>Decomposition</DrawerMenuItem>
                                                <DrawerMenuItem onClick={()=>openModal(ModalType.Smoothing)}>Smoothing</DrawerMenuItem>
                                                <DrawerMenuItem onClick={()=>openModal(ModalType.Autocorrelation)}>Autocorrelation</DrawerMenuItem>
                                                <DrawerMenuItem onClick={()=>openModal(ModalType.UnitRootTest)}>Unit Root Test</DrawerMenuItem>
                                                <DrawerMenuItem onClick={()=>openModal(ModalType.BoxJenkinsModel)}>Box-Jenkins Model</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- Graphs Accordion Item --- */}
                            <AccordionItem value="graphs" className="border-b border-zinc-200">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <LineChartIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>Graphs</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="graphs-main" className="border-0">
                                            {/* Direct items for Graphs */}
                                            <AccordionContent className="flex flex-col space-y-0.5">
                                                <DrawerMenuItem onClick={() => openModal(ModalType.ChartBuilderModal)}>Chart Builder...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Graphboard Template Chooser...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="graphs-legacy" className="border-0">
                                            <NestedAccordionTrigger>Legacy Dialogs</NestedAccordionTrigger>
                                            <AccordionContent className="flex flex-col space-y-0.5 pl-6 pr-0 pb-1 pt-0 bg-zinc-50">
                                                <DrawerMenuItem onClick={() => openModal(ModalType.SimpleBarModal)}>Bar...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>3-D Bar...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Line</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Area</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Pie</DrawerMenuItem>
                                                <DrawerMenuItem disabled>High-Low</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem disabled>Box-Plot...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Error Bar...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Population Pyramid</DrawerMenuItem>
                                                <DrawerMenuSeparator />
                                                <DrawerMenuItem disabled>Scatter/Dot...</DrawerMenuItem>
                                                <DrawerMenuItem disabled>Histogram...</DrawerMenuItem>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- Help Accordion Item --- */}
                            <AccordionItem value="help" className="border-b-0">
                                <AccordionTrigger className="px-4 py-2 text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 bg-white">
                                    <div className="flex items-center">
                                        <HelpCircleIcon className="h-4 w-4 mr-2 text-zinc-700" />
                                        <span>Help</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-4 pr-0 pb-1 pt-0 bg-white">
                                    <DrawerMenuItem disabled>Help Topics...</DrawerMenuItem>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </SheetContent>
            </Sheet>
            <div className="text-sm font-semibold text-zinc-900">Statify</div>
        </div>
    );
};

export default HamburgerMenu;