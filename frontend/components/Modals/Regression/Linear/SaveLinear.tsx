// components/SaveLinear.tsx
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
  influenceDfBetas: boolean;
  influenceStandardizedDfBetas: boolean;
  influenceDfFits: boolean;
  influenceStandardizedDfFits: boolean;
  influenceCovarianceRatios: boolean;
  predictionMean: boolean;
  predictionIndividual: boolean;
  confidenceInterval: string;
  createCoefficientStats: boolean;
  coefficientOption: 'newDataset' | 'newDataFile';
  datasetName: string;
  xmlFilePath: string;
  includeCovarianceMatrixXml: boolean;
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
  const [influenceDfBetas, setInfluenceDfBetas] = useState(params.influenceDfBetas);
  const [influenceStandardizedDfBetas, setInfluenceStandardizedDfBetas] = useState(params.influenceStandardizedDfBetas);
  const [influenceDfFits, setInfluenceDfFits] = useState(params.influenceDfFits);
  const [influenceStandardizedDfFits, setInfluenceStandardizedDfFits] = useState(params.influenceStandardizedDfFits);
  const [influenceCovarianceRatios, setInfluenceCovarianceRatios] = useState(params.influenceCovarianceRatios);
  const [predictionMean, setPredictionMean] = useState(params.predictionMean);
  const [predictionIndividual, setPredictionIndividual] = useState(params.predictionIndividual);
  const [confidenceInterval, setConfidenceInterval] = useState(params.confidenceInterval);
  const [createCoefficientStats, setCreateCoefficientStats] = useState(params.createCoefficientStats);
  const [coefficientOption, setCoefficientOption] = useState<'newDataset' | 'newDataFile'>(params.coefficientOption);
  const [datasetName, setDatasetName] = useState(params.datasetName);
  const [xmlFilePath, setXmlFilePath] = useState(params.xmlFilePath);
  const [includeCovarianceMatrixXml, setIncludeCovarianceMatrixXml] = useState(params.includeCovarianceMatrixXml);

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
    setInfluenceDfBetas(params.influenceDfBetas);
    setInfluenceStandardizedDfBetas(params.influenceStandardizedDfBetas);
    setInfluenceDfFits(params.influenceDfFits);
    setInfluenceStandardizedDfFits(params.influenceStandardizedDfFits);
    setInfluenceCovarianceRatios(params.influenceCovarianceRatios);
    setPredictionMean(params.predictionMean);
    setPredictionIndividual(params.predictionIndividual);
    setConfidenceInterval(params.confidenceInterval);
    setCreateCoefficientStats(params.createCoefficientStats);
    setCoefficientOption(params.coefficientOption);
    setDatasetName(params.datasetName);
    setXmlFilePath(params.xmlFilePath);
    setIncludeCovarianceMatrixXml(params.includeCovarianceMatrixXml);
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
      case 'influenceDfBetas': setInfluenceDfBetas(value); break;
      case 'influenceStandardizedDfBetas': setInfluenceStandardizedDfBetas(value); break;
      case 'influenceDfFits': setInfluenceDfFits(value); break;
      case 'influenceStandardizedDfFits': setInfluenceStandardizedDfFits(value); break;
      case 'influenceCovarianceRatios': setInfluenceCovarianceRatios(value); break;
      case 'predictionMean': setPredictionMean(value); break;
      case 'predictionIndividual': setPredictionIndividual(value); break;
      case 'confidenceInterval': setConfidenceInterval(value); break;
      case 'createCoefficientStats': setCreateCoefficientStats(value); break;
      case 'coefficientOption': setCoefficientOption(value); break;
      case 'datasetName': setDatasetName(value); break;
      case 'xmlFilePath': setXmlFilePath(value); break;
      case 'includeCovarianceMatrixXml': setIncludeCovarianceMatrixXml(value); break;
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

      <div className="grid grid-cols-2 gap-4">
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

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Influence Statistics</h3>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Checkbox
                  checked={influenceDfBetas}
                  onCheckedChange={(checked) => handleChange('influenceDfBetas', !!checked)}
                  id="influenceDfBetas"
                />
                <label htmlFor="influenceDfBetas" className="ml-2 text-sm">
                  DfBeta(s)
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  checked={influenceStandardizedDfBetas}
                  onCheckedChange={(checked) => handleChange('influenceStandardizedDfBetas', !!checked)}
                  id="influenceStandardizedDfBetas"
                />
                <label
                  htmlFor="influenceStandardizedDfBetas"
                  className="ml-2 text-sm"
                >
                  Standardized DfBeta(s)
                </label>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Checkbox
                  checked={influenceDfFits}
                  onCheckedChange={(checked) => handleChange('influenceDfFits', !!checked)}
                  id="influenceDfFits"
                />
                <label htmlFor="influenceDfFits" className="ml-2 text-sm">
                  DfFit
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  checked={influenceStandardizedDfFits}
                  onCheckedChange={(checked) => handleChange('influenceStandardizedDfFits', !!checked)}
                  id="influenceStandardizedDfFits"
                />
                <label
                  htmlFor="influenceStandardizedDfFits"
                  className="ml-2 text-sm"
                >
                  Standardized DfFit
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  checked={influenceCovarianceRatios}
                  onCheckedChange={(checked) => handleChange('influenceCovarianceRatios', !!checked)}
                  id="influenceCovarianceRatios"
                />
                <label
                  htmlFor="influenceCovarianceRatios"
                  className="ml-2 text-sm"
                >
                  Covariance ratio
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Prediction Intervals</h3>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={predictionMean}
              onCheckedChange={(checked) => handleChange('predictionMean', !!checked)}
              id="predictionMean"
            />
            <label htmlFor="predictionMean" className="ml-2 text-sm">
              Mean
            </label>
          </div>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={predictionIndividual}
              onCheckedChange={(checked) => handleChange('predictionIndividual', !!checked)}
              id="predictionIndividual"
            />
            <label htmlFor="predictionIndividual" className="ml-2 text-sm">
              Individual
            </label>
          </div>
          <div className="flex items-center">
            <label htmlFor="confidenceInterval" className="mr-2 text-sm">
              Confidence interval:
            </label>
            <Input
              type="text"
              id="confidenceInterval"
              value={confidenceInterval}
              onChange={(e) => handleChange('confidenceInterval', e.target.value)}
              className="w-20 p-1 text-sm"
              disabled={!predictionMean && !predictionIndividual}
            />
            <span className="ml-2 text-sm">%</span>
          </div>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Coefficient statistics</h3>
          <div className="flex items-center mb-2">
            <Checkbox
              checked={createCoefficientStats}
              onCheckedChange={(checked) => handleChange('createCoefficientStats', !!checked)}
              id="createCoefficientStats"
            />
            <label htmlFor="createCoefficientStats" className="ml-2 text-sm">
              Create coefficient statistics
            </label>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                name="coefficientOption"
                id="coefficientNewDataset"
                value="newDataset"
                checked={coefficientOption === 'newDataset'}
                onChange={(e) => handleChange('coefficientOption', e.target.value as 'newDataset' | 'newDataFile')}
                disabled={!createCoefficientStats}
                className="accent-gray-500"
              />
              <label htmlFor="coefficientNewDataset" className="ml-2 text-sm">
                Write a new data set
              </label>
              <Input
                type="text"
                value={datasetName}
                onChange={(e) => handleChange('datasetName', e.target.value)}
                placeholder="Dataset name"
                className="ml-2 w-32 p-1 text-sm"
                disabled={!createCoefficientStats || coefficientOption !== 'newDataset'}
              />
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                name="coefficientOption"
                id="coefficientNewDataFile"
                value="newDataFile"
                checked={coefficientOption === 'newDataFile'}
                onChange={(e) => handleChange('coefficientOption', e.target.value as 'newDataset' | 'newDataFile')}
                disabled={!createCoefficientStats}
                className="accent-gray-500"
              />
              <label htmlFor="coefficientNewDataFile" className="ml-2 text-sm">
                Write a new data file
              </label>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Export model information to XML file</h3>
        <div className="flex items-center mb-2">
          <Input
            type="text"
            value={xmlFilePath}
            onChange={(e) => handleChange('xmlFilePath', e.target.value)}
            placeholder="Specify XML file path"
            className="flex-grow p-1 text-sm mr-2"
          />
        </div>
        <div className="flex items-center">
          <Checkbox
            checked={includeCovarianceMatrixXml}
            onCheckedChange={(checked) => handleChange('includeCovarianceMatrixXml', !!checked)}
            id="includeCovarianceMatrixXml"
            disabled={!xmlFilePath}
          />
          <label htmlFor="includeCovarianceMatrixXml" className="ml-2 text-sm">
            Include the covariance matrix
          </label>
        </div>
      </div>
    </div>
  );
};

export default SaveLinear;
