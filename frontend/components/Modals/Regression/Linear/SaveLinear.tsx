// components/SaveLinear.tsx
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export interface SaveLinearParams {
  predictedUnstandardized: boolean;
  predictedStandardized: boolean;
  predictedAdjusted: boolean;
  predictedSE: boolean;
  residualUnstandardized: boolean;
  residualStandardized: boolean;
  residualStudentized: boolean;
  residualDeleted: boolean;
  residualStudentizedDeleted: boolean;
  distanceMahalanobis: boolean;
  distanceCooks: boolean;
  distanceLeverage: boolean;
}

interface SaveLinearProps {
  params: SaveLinearParams;
  onChange: (newParams: Partial<SaveLinearParams>) => void;
}

const SaveLinear: React.FC<SaveLinearProps> = ({ params, onChange }) => {
  const [predictedUnstandardized, setPredictedUnstandardized] = useState(params.predictedUnstandardized);
  const [predictedStandardized, setPredictedStandardized] = useState(params.predictedStandardized);
  const [predictedAdjusted, setPredictedAdjusted] = useState(params.predictedAdjusted);
  const [predictedSE, setPredictedSE] = useState(params.predictedSE);
  const [residualUnstandardized, setResidualUnstandardized] = useState(params.residualUnstandardized);
  const [residualStandardized, setResidualStandardized] = useState(params.residualStandardized);
  const [residualStudentized, setResidualStudentized] = useState(params.residualStudentized);
  const [residualDeleted, setResidualDeleted] = useState(params.residualDeleted);
  const [residualStudentizedDeleted, setResidualStudentizedDeleted] = useState(params.residualStudentizedDeleted);
  const [distanceMahalanobis, setDistanceMahalanobis] = useState(params.distanceMahalanobis);
  const [distanceCooks, setDistanceCooks] = useState(params.distanceCooks);
  const [distanceLeverage, setDistanceLeverage] = useState(params.distanceLeverage);

  useEffect(() => {
    setPredictedUnstandardized(params.predictedUnstandardized);
    setPredictedStandardized(params.predictedStandardized);
    setPredictedAdjusted(params.predictedAdjusted);
    setPredictedSE(params.predictedSE);
    setResidualUnstandardized(params.residualUnstandardized);
    setResidualStandardized(params.residualStandardized);
    setResidualStudentized(params.residualStudentized);
    setResidualDeleted(params.residualDeleted);
    setResidualStudentizedDeleted(params.residualStudentizedDeleted);
    setDistanceMahalanobis(params.distanceMahalanobis);
    setDistanceCooks(params.distanceCooks);
    setDistanceLeverage(params.distanceLeverage);
  }, [params]);

  const handleChange = (field: keyof SaveLinearParams, value: any) => {
    switch(field) {
      case 'predictedUnstandardized': setPredictedUnstandardized(value); break;
      case 'predictedStandardized': setPredictedStandardized(value); break;
      case 'predictedAdjusted': setPredictedAdjusted(value); break;
      case 'predictedSE': setPredictedSE(value); break;
      case 'residualUnstandardized': setResidualUnstandardized(value); break;
      case 'residualStandardized': setResidualStandardized(value); break;
      case 'residualStudentized': setResidualStudentized(value); break;
      case 'residualDeleted': setResidualDeleted(value); break;
      case 'residualStudentizedDeleted': setResidualStudentizedDeleted(value); break;
      case 'distanceMahalanobis': setDistanceMahalanobis(value); break;
      case 'distanceCooks': setDistanceCooks(value); break;
      case 'distanceLeverage': setDistanceLeverage(value); break;
    }
    onChange({ [field]: value });
  };

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Predicted Values</h3>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={predictedUnstandardized}
              onCheckedChange={(checked) => handleChange('predictedUnstandardized', !!checked)}
              id="predictedUnstandardized"
            />
            <label htmlFor="predictedUnstandardized" className="ml-2 text-sm">
              Unstandardized
            </label>
          </div>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={predictedStandardized}
              onCheckedChange={(checked) => handleChange('predictedStandardized', !!checked)}
              id="predictedStandardized"
            />
            <label htmlFor="predictedStandardized" className="ml-2 text-sm">
              Standardized
            </label>
          </div>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={predictedAdjusted}
              onCheckedChange={(checked) => handleChange('predictedAdjusted', !!checked)}
              id="predictedAdjusted"
            />
            <label htmlFor="predictedAdjusted" className="ml-2 text-sm">
              Adjusted
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={predictedSE}
              onCheckedChange={(checked) => handleChange('predictedSE', !!checked)}
              id="predictedSE"
            />
            <label htmlFor="predictedSE" className="ml-2 text-sm">
              S.E. of mean predictions
            </label>
          </div>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Residuals</h3>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={residualUnstandardized}
              onCheckedChange={(checked) => handleChange('residualUnstandardized', !!checked)}
              id="residualUnstandardized"
            />
            <label htmlFor="residualUnstandardized" className="ml-2 text-sm">
              Unstandardized
            </label>
          </div>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={residualStandardized}
              onCheckedChange={(checked) => handleChange('residualStandardized', !!checked)}
              id="residualStandardized"
            />
            <label htmlFor="residualStandardized" className="ml-2 text-sm">
              Standardized
            </label>
          </div>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={residualStudentized}
              onCheckedChange={(checked) => handleChange('residualStudentized', !!checked)}
              id="residualStudentized"
            />
            <label htmlFor="residualStudentized" className="ml-2 text-sm">
              Studentized
            </label>
          </div>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={residualDeleted}
              onCheckedChange={(checked) => handleChange('residualDeleted', !!checked)}
              id="residualDeleted"
            />
            <label htmlFor="residualDeleted" className="ml-2 text-sm">
              Deleted
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={residualStudentizedDeleted}
              onCheckedChange={(checked) => handleChange('residualStudentizedDeleted', !!checked)}
              id="residualStudentizedDeleted"
            />
            <label htmlFor="residualStudentizedDeleted" className="ml-2 text-sm">
              Studentized deleted
            </label>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Distances</h3>
        <div className="flex items-center mb-2">
          <Checkbox
            checked={distanceMahalanobis}
            onCheckedChange={(checked) => handleChange('distanceMahalanobis', !!checked)}
            id="distanceMahalanobis"
          />
          <label htmlFor="distanceMahalanobis" className="ml-2 text-sm">
            Mahalanobis
          </label>
        </div>
        <div className="flex items-center mb-2">
          <Checkbox
            checked={distanceCooks}
            onCheckedChange={(checked) => handleChange('distanceCooks', !!checked)}
            id="distanceCooks"
          />
          <label htmlFor="distanceCooks" className="ml-2 text-sm">
            Cook&apos;s
          </label>
        </div>
        <div className="flex items-center">
          <Checkbox
            checked={distanceLeverage}
            onCheckedChange={(checked) => handleChange('distanceLeverage', !!checked)}
            id="distanceLeverage"
          />
          <label htmlFor="distanceLeverage" className="ml-2 text-sm">
            Leverage values
          </label>
        </div>
      </div>
    </div>
  );
};

export default SaveLinear;
