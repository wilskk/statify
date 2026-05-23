import { createSection, safeFixed, fmtSig } from "./formatter_utils";
import { AnalysisSection } from "../types/ordinal";

export const formatParameterEstimates = (
  payload: any[]
): { sections: AnalysisSection[] } => {
  const sections: AnalysisSection[] = [];

  const data = {
    columnHeaders: [
      {
        header: "",
        children: [
          { header: "", key: "rh1" },
          { header: "", key: "rh2" },
        ],
      },
      { header: "Estimate", key: "estimate" },
      { header: "Std. Error", key: "stdError" },
      { header: "Wald", key: "wald" },
      { header: "Sig.", key: "sig" },
      {
        header: "95% Confidence Interval",
        children: [
          { header: "Lower", key: "lower" },
          { header: "Upper", key: "upper" },
        ],
      },
    ],

    rows: payload.map((r: any) => ({
      rowHeader: [r.group, r.variable],
      estimate: safeFixed(r.estimate),
      stdError: safeFixed(r.stdError),
      wald: safeFixed(r.wald),
      sig: fmtSig(r.sig),
      lower: safeFixed(r.lower),
      upper: safeFixed(r.upper),
    })),
  };

  sections.push(
    createSection(
      "ordinal_parameter_estimates",
      "Parameter Estimates",
      data,
      {
        description: "Estimasi parameter model PLUM",
      }
    )
  );

  return { sections };
};