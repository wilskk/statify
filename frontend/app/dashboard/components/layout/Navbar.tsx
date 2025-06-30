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

import { ModalType, useModal } from "@/hooks/useModal";
import FileMenu from "@/components/Modals/File/FileMenu";
import EditMenu from "@/components/Modals/Edit/EditMenu";
import DataMenu from "@/components/Modals/Data/DataMenu";
import GeneralLinearModelMenu from "@/components/Modals/Analyze/general-linear-model/general-linear-model-menu";
import ClassifyMenu from "@/components/Modals/Analyze/classify/classify-menu";
import DimensionReductionMenu from "@/components/Modals/Analyze/dimension-reduction/dimension-reduction-menu";
import TransformMenu from "@/components/Modals/Transform/TransformMenu";

const Navbar: React.FC = () => {
  const { openModal } = useModal();

  const commonMenubarClasses = "ml-0 flex px-2 py-1 border-0";

  return (
    <nav className="bg-background border-b border-border">
      <div className="flex items-center justify-between px-3 py-1.5">
        {/* Desktop: Single Menubar ONLY */}
        <Menubar className={commonMenubarClasses}>
          <FileMenu />
          <EditMenu />
          <DataMenu />
          <TransformMenu />
          <MenubarMenu>
            <MenubarTrigger>Analyze</MenubarTrigger>
            <MenubarContent>
                <MenubarSub>
                    <MenubarSubTrigger>Descriptive Statistics</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.Frequencies)}>Frequencies</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Descriptives)}>Descriptives</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Explore)}>Explore</MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Crosstabs)}>Crosstabs</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Compare Means</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem disabled>One-Sample T Test</MenubarItem>
                        <MenubarItem disabled>Independent-Samples T Test</MenubarItem>
                        <MenubarItem disabled>Paired-Samples T Test</MenubarItem>
                        <MenubarItem disabled>One-Way ANOVA</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                    <GeneralLinearModelMenu />
                </MenubarSub>
                <MenubarSub>
                    <ClassifyMenu />
                </MenubarSub>
                <MenubarSub>
                    <DimensionReductionMenu />
                </MenubarSub>
                <MenubarSub>
                    <MenubarSubTrigger>Correlate</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem disabled>Bivariate...</MenubarItem>
                        <MenubarItem disabled>Partial...</MenubarItem>
                        <MenubarItem disabled>Distances...</MenubarItem>
                        <MenubarItem disabled>Canonical Correlation...</MenubarItem>
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
                        <MenubarItem disabled>One Sample...</MenubarItem>
                        <MenubarItem disabled>Independent Samples...</MenubarItem>
                        <MenubarItem disabled>Related Samples...</MenubarItem>
                        <MenubarSub>
                            <MenubarSubTrigger>Legacy Dialogs</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarItem disabled>Chi-square...</MenubarItem>
                                <MenubarItem disabled>Runs...</MenubarItem>
                                <MenubarItem disabled>2 Independent Samples...</MenubarItem>
                                <MenubarItem disabled>K Independent Samples...</MenubarItem>
                                <MenubarItem disabled>2 Related Samples...</MenubarItem>
                                <MenubarItem disabled>K Related Samples...</MenubarItem>
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
                <MenubarItem disabled>Graphboard Template Chooser...</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                    <MenubarSubTrigger>Legacy Dialogs</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.SimpleBarModal)}>Bar...</MenubarItem>
                        <MenubarItem disabled>3-D Bar...</MenubarItem>
                        <MenubarItem disabled>Line</MenubarItem>
                        <MenubarItem disabled>Area</MenubarItem>
                        <MenubarItem disabled>Pie</MenubarItem>
                        <MenubarItem disabled>High-Low</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem disabled>Box-Plot...</MenubarItem>
                        <MenubarItem disabled>Error Bar...</MenubarItem>
                        <MenubarItem disabled>Population Pyramid</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem disabled>Scatter/Dot...</MenubarItem>
                        <MenubarItem disabled>Histogram...</MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger disabled>Help</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
        <div className="font-sans text-lg font-semibold text-foreground">Statify</div>
      </div>
    </nav>
  );
};

export default Navbar;