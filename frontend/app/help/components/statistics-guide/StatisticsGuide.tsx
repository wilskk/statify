import React from "react";
import { Crosstabs } from "./crosstabs";
import { DescriptiveAnalysis } from "./descriptive/DescriptiveAnalysis";
import { Explore } from "./explore";
import { Frequencies } from "./frequencies";
import { UnivariateGuide } from "./univariate/UnivariateGuide";
import { KMeansClustering } from "./k-means/KMeansClustering";
import {
    SumOfSquares,
    EMMeans,
    ParameterEstimates,
    LevenesTest,
    DesignMatrix,
    ContrastFactors,
    HeteroscedasticityTests,
    LackOfFitTests,
} from "./univariate";
// Removed HelpContentWrapper and related UI imports since the component now defaults to the Frequencies guide

type StatisticsGuideProps = {
    section?: string;
};

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({
    section,
}) => {
    const renderContent = () => {
        // When no specific sub-section is provided, default to Frequencies guide
        if (!section) {
            return <Frequencies />;
        }

        switch (section) {
            case "frequencies":
                return <Frequencies />;
            case "descriptives":
                return <DescriptiveAnalysis />;
            case "explore":
                return <Explore />;
            case "crosstabs":
                return <Crosstabs />;
            case "univariate":
                return <UnivariateGuide />;
            case "univariate-sum-of-squares":
                return <SumOfSquares />;
            case "univariate-em-means":
                return <EMMeans />;
            case "univariate-parameter-estimates":
                return <ParameterEstimates />;
            case "univariate-levenes-test":
                return <LevenesTest />;
            case "univariate-design-matrix":
                return <DesignMatrix />;
            case "univariate-contrast-factors":
                return <ContrastFactors />;
            case "univariate-heteroscedasticity-tests":
                return <HeteroscedasticityTests />;
            case "univariate-lack-of-fit-tests":
                return <LackOfFitTests />;
            case "k-means-clustering":
                return <KMeansClustering />;
            default:
                // Fallback to Frequencies as well for any unmatched keys
                return <Frequencies />;
        }
    };

    return renderContent();
};
