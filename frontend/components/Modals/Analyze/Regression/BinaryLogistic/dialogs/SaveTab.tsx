import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BinaryLogisticSaveParams } from "../types/binary-logistic";

export const SaveTab = ({
  params,
  onChange,
}: {
  params: BinaryLogisticSaveParams;
  onChange: (p: Partial<BinaryLogisticSaveParams>) => void;
}) => (
  <div className="grid grid-cols-2 gap-8 py-4">
    <div className="space-y-4">
      <h4 className="font-semibold text-sm">Predicted Values</h4>
      <div className="space-y-2 pl-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="prob"
            checked={params.predictedProbabilities}
            onCheckedChange={(c) => onChange({ predictedProbabilities: !!c })}
          />
          <Label htmlFor="prob">Probabilities</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="group"
            checked={params.predictedGroup}
            onCheckedChange={(c) => onChange({ predictedGroup: !!c })}
          />
          <Label htmlFor="group">Group membership</Label>
        </div>
      </div>

      <h4 className="font-semibold text-sm pt-4">Influence</h4>
      <div className="space-y-2 pl-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="cook"
            checked={params.influenceCooks}
            onCheckedChange={(c) => onChange({ influenceCooks: !!c })}
          />
          <Label htmlFor="cook">Cook's</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="leverage"
            checked={params.influenceLeverage}
            onCheckedChange={(c) => onChange({ influenceLeverage: !!c })}
          />
          <Label htmlFor="leverage">Leverage values</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dfbeta"
            checked={params.influenceDfBeta}
            onCheckedChange={(c) => onChange({ influenceDfBeta: !!c })}
          />
          <Label htmlFor="dfbeta">DfBeta(s)</Label>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="font-semibold text-sm">Residuals</h4>
      <div className="space-y-2 pl-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="res_un"
            checked={params.residualsUnstandardized}
            onCheckedChange={(c) => onChange({ residualsUnstandardized: !!c })}
          />
          <Label htmlFor="res_un">Unstandardized</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="res_logit"
            checked={params.residualsLogit}
            onCheckedChange={(c) => onChange({ residualsLogit: !!c })}
          />
          <Label htmlFor="res_logit">Logit</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="res_stud"
            checked={params.residualsStudentized}
            onCheckedChange={(c) => onChange({ residualsStudentized: !!c })}
          />
          <Label htmlFor="res_stud">Studentized</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="res_std"
            checked={params.residualsStandardized}
            onCheckedChange={(c) => onChange({ residualsStandardized: !!c })}
          />
          <Label htmlFor="res_std">Standardized</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="res_dev"
            checked={params.residualsDeviance}
            onCheckedChange={(c) => onChange({ residualsDeviance: !!c })}
          />
          <Label htmlFor="res_dev">Deviance</Label>
        </div>
      </div>
    </div>
  </div>
);
