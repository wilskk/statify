import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BinaryLogisticOptionsParams } from "../types/binary-logistic";

interface OptionsTabProps {
  params: BinaryLogisticOptionsParams;
  onChange: (p: Partial<BinaryLogisticOptionsParams>) => void;
}

export const OptionsTab: React.FC<OptionsTabProps> = ({ params, onChange }) => (
  <div className="grid grid-cols-2 gap-8 py-4 h-full overflow-y-auto">
    {/* KOLOM KIRI: Statistics and Plots */}
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="font-semibold text-sm border-b pb-1 mb-2">
          Statistics and Plots
        </h4>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="class_plot"
            checked={params.classificationPlots}
            onCheckedChange={(c) => onChange({ classificationPlots: !!c })}
          />
          <Label htmlFor="class_plot" className="font-normal">
            Classification plots
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hosmer"
            checked={params.hosmerLemeshow}
            onCheckedChange={(c) => onChange({ hosmerLemeshow: !!c })}
          />
          <Label htmlFor="hosmer" className="font-normal">
            Hosmer-Lemeshow goodness-of-fit
          </Label>
        </div>

        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="casewise"
              checked={params.casewiseListing}
              onCheckedChange={(c) => onChange({ casewiseListing: !!c })}
            />
            <Label htmlFor="casewise" className="font-normal">
              Casewise listing of residuals
            </Label>
          </div>

          <div className="pl-6 pt-1">
            <RadioGroup
              disabled={!params.casewiseListing}
              value={params.casewiseType}
              onValueChange={(val: any) => onChange({ casewiseType: val })}
              className="space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outliers" id="cw_outliers" />
                <Label htmlFor="cw_outliers" className="text-xs font-normal">
                  Outliers outside
                </Label>
                <Input
                  type="number"
                  className="w-12 h-6 text-xs px-1"
                  value={params.casewiseOutliers}
                  onChange={(e) =>
                    onChange({ casewiseOutliers: Number(e.target.value) })
                  }
                  disabled={
                    !params.casewiseListing ||
                    params.casewiseType !== "outliers"
                  }
                  aria-label="Outliers Standard Deviations"
                />
                <span className="text-xs text-muted-foreground">std. dev.</span>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="cw_all" />
                <Label htmlFor="cw_all" className="text-xs font-normal">
                  All cases
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="correlations"
            checked={params.correlations}
            onCheckedChange={(c) => onChange({ correlations: !!c })}
          />
          <Label htmlFor="correlations" className="font-normal">
            Correlations of estimates
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="iter_hist"
            checked={params.iterationHistory}
            onCheckedChange={(c) => onChange({ iterationHistory: !!c })}
          />
          <Label htmlFor="iter_hist" className="font-normal">
            Iteration history
          </Label>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="ci_exp"
            checked={params.ciForExpB}
            onCheckedChange={(c) => onChange({ ciForExpB: !!c })}
          />
          <Label htmlFor="ci_exp" className="font-normal">
            CI for exp(B):
          </Label>
          <Input
            type="number"
            className="w-14 h-7 px-2"
            value={params.ciLevel}
            onChange={(e) => onChange({ ciLevel: Number(e.target.value) })}
            disabled={!params.ciForExpB}
            aria-label="Confidence Interval Level"
          />
          <span className="text-sm">%</span>
        </div>
      </div>
    </div>

    {/* KOLOM KANAN */}
    <div className="space-y-6">
      {/* Display */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm border-b pb-1 mb-2">Display</h4>
        <RadioGroup
          value={params.displayAtEachStep ? "each" : "last"}
          onValueChange={(val) =>
            onChange({ displayAtEachStep: val === "each" })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="each" id="disp_each" />
            <Label htmlFor="disp_each" className="font-normal">
              At each step
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="last" id="disp_last" />
            <Label htmlFor="disp_last" className="font-normal">
              At last step
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Probability for Stepwise */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm border-b pb-1 mb-2">
          Probability for Stepwise
        </h4>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[65px_1fr] gap-y-2 items-center">
            <Label htmlFor="prob_entry" className="font-normal text-sm">
              Entry:
            </Label>
            <Input
              id="prob_entry"
              type="number"
              step="0.01"
              className="w-20 h-8"
              value={params.probEntry}
              onChange={(e) => onChange({ probEntry: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="prob_rem" className="font-normal text-sm">
              Removal:
            </Label>
            <Input
              id="prob_rem"
              type="number"
              step="0.01"
              className="w-20 h-8"
              value={params.probRemoval}
              onChange={(e) =>
                onChange({ probRemoval: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* Classification Cutoff */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm border-b pb-1 mb-2">
          Classification Cutoff
        </h4>
        <div className="flex items-center space-x-2">
          <Label htmlFor="cutoff_input" className="font-normal text-sm">
            Value:
          </Label>
          <Input
            id="cutoff_input"
            type="number"
            step="0.01"
            className="w-20 h-8"
            value={params.classificationCutoff}
            onChange={(e) =>
              onChange({ classificationCutoff: Number(e.target.value) })
            }
            aria-label="Classification Cutoff Value"
          />
        </div>
      </div>

      {/* Maximum Iterations */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm border-b pb-1 mb-2">
          Maximum Iterations
        </h4>
        <div className="flex items-center space-x-2">
          <Label htmlFor="max_iter" className="font-normal text-sm">
            Value:
          </Label>
          <Input
            id="max_iter"
            type="number"
            step="1"
            className="w-20 h-8"
            value={params.maxIterations}
            onChange={(e) =>
              onChange({ maxIterations: Number(e.target.value) })
            }
            aria-label="Maximum Iterations"
          />
        </div>
      </div>

      {/* Constant */}
      <div className="pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="constant"
            checked={params.includeConstant}
            onCheckedChange={(c) => onChange({ includeConstant: !!c })}
          />
          <Label htmlFor="constant" className="font-normal">
            Include constant in model
          </Label>
        </div>
      </div>
    </div>
  </div>
);
