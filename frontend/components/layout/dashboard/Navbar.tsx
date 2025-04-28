"use client";

import React from "react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";

import { useActions } from "@/hooks/actions";
import { ModalType, useModal } from "@/hooks/useModal";
import FileMenu from "@/components/Modals/File/FileMenu";
import EditMenu from "@/components/Modals/Edit/EditMenu";
import DataMenu from "@/components/Modals/Data/DataMenu";

const Navbar: React.FC = () => {
  const { openModal } = useModal();
  const { handleAction } = useActions();

  const commonMenubarClasses = "ml-0 flex px-2 py-1 border-0";

  return (
    <nav className="bg-white border-b border-[#E6E6E6]">
      <div className="flex items-center justify-between px-3 py-1.5">
        {/* Desktop: Single Menubar ONLY */}
        <Menubar className={commonMenubarClasses}>
          <FileMenu />
          <EditMenu />
          <DataMenu />
          <MenubarMenu>
            <MenubarTrigger>Transform</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.ComputeVariable)}>Compute Variable...</MenubarItem>
                <MenubarItem>Programmability Transformation...</MenubarItem>
                <MenubarItem>Count Values within Cases...</MenubarItem>
                <MenubarItem>Shift Values...</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Recode into Same Variables...</MenubarItem>
                <MenubarItem>Recode into Different Variables...</MenubarItem>
                <MenubarItem>Automatic Recode...</MenubarItem>
                <MenubarItem>Create Dummy Variables...</MenubarItem>
                <MenubarItem>Visual Binning...</MenubarItem>
                <MenubarItem>Optimal Binning...</MenubarItem>
                <MenubarItem>Prepare Data for Modeling</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Rank Cases...</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Date and Time Wizard...</MenubarItem>
                <MenubarItem>Create Time Series...</MenubarItem>
                <MenubarItem>Replace Missing Values...</MenubarItem>
                <MenubarItem>Random Number Generators...</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Run Pending Transforms</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Analyze</MenubarTrigger>
            <MenubarContent>
                <MenubarSub>
                    <MenubarSubTrigger>Descriptive Statistics</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.Frequencies)}>Frequencies...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Descriptive)}>Descriptives...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Explore)}>Explore...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Crosstabs)}>Crosstabs...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => openModal(ModalType.Ratio)}>Ratio...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => openModal(ModalType.PPPlots)}>P-P Plots...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.QQPlots)}>Q-Q Plots...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Compare Means</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem>One-Sample T Test...</MenubarItem>
                        <MenubarItem>Independent-Samples T Test...</MenubarItem>
                        <MenubarItem>Paired-Samples T Test...</MenubarItem>
                        <MenubarItem>One-Way ANOVA...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>General Linear Model</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem>Univariate...</MenubarItem>
                        <MenubarItem>Multivariate...</MenubarItem>
                        <MenubarItem>Repeated Measures...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Variance Components...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Correlate</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem>Bivariate...</MenubarItem>
                        <MenubarItem>Partial...</MenubarItem>
                        <MenubarItem>Distances...</MenubarItem>
                        <MenubarItem>Canonical Correlation...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Regression</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.ModalAutomaticLinearModeling)}>Automatic Linear Modeling...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalLinear)}>Linear...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalCurveEstimation)}>Curve Estimation...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalPartialLeastSquares)}>Partial Least Squares...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => openModal(ModalType.ModalBinaryLogistic)}>Binary Logistic...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalMultinomialLogistic)}>Multinomial Logistic...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalOrdinal)}>Ordinal...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalProbit)}>Probit...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => openModal(ModalType.ModalNonlinear)}>Nonlinear...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalWeightEstimation)}>Weight Estimation...</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ModalTwoStageLeastSquares)}>2-Stage Least Squares...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => openModal(ModalType.ModalQuantiles)}>Quantiles...</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => openModal(ModalType.ModalOptimalScaling)}>Optimal Scaling (Catreg)...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Nonparametric Test</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem>One Sample...</MenubarItem>
                        <MenubarItem>Independent Samples...</MenubarItem>
                        <MenubarItem>Related Samples...</MenubarItem>
                        <MenubarSub>
                            <MenubarSubTrigger>Legacy Dialogs</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarItem>Chi-square...</MenubarItem>
                                <MenubarItem>Runs...</MenubarItem>
                                <MenubarItem>2 Independent Samples...</MenubarItem>
                                <MenubarItem>K Independent Samples...</MenubarItem>
                                <MenubarItem>2 Related Samples...</MenubarItem>
                                <MenubarItem onClick={() => openModal(ModalType.KRelatedSamplesTest)}>K Related Samples...</MenubarItem>
                            </MenubarSubContent>
                        </MenubarSub>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Time Series</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={()=>openModal(ModalType.Decomposition)}>Decomposition</MenubarItem>
                        <MenubarItem onClick={()=>openModal(ModalType.Smoothing)}>Smoothing</MenubarItem>
                        <MenubarItem onClick={()=>openModal(ModalType.Autocorrelation)}>Autocorrelation</MenubarItem>
                        <MenubarItem onClick={()=>openModal(ModalType.UnitRootTest)}>Unit Root Test</MenubarItem>
                        <MenubarItem onClick={()=>openModal(ModalType.BoxJenkinsModel)}>Box-Jenkins Model</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Graphs</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.ChartBuilderModal)}>Chart Builder...</MenubarItem>
                <MenubarItem>Graphboard Template Chooser...</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                    <MenubarSubTrigger>Legacy Dialogs</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.SimpleBarModal)}>Bar...</MenubarItem>
                        <MenubarItem>3-D Bar...</MenubarItem>
                        <MenubarItem>Line</MenubarItem>
                        <MenubarItem>Area</MenubarItem>
                        <MenubarItem>Pie</MenubarItem>
                        <MenubarItem>High-Low</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Box-Plot...</MenubarItem>
                        <MenubarItem>Error Bar...</MenubarItem>
                        <MenubarItem>Population Pyramid</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Scatter/Dot...</MenubarItem>
                        <MenubarItem>Histogram...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
        <div className="text-sm font-semibold text-zinc-900">Statify</div>
      </div>
    </nav>
  );
};

export default Navbar;