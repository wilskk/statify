// components/OptionsLinear.tsx
import React, { useState, useEffect } from 'react';
// Remove Dialog imports
// import {
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Define and Export Params Type
export interface OptionsLinearParams {
  steppingMethod: 'probability' | 'fvalue';
  probEntry: string;
  probRemoval: string;
  fvalueEntry: string;
  fvalueRemoval: string;
  includeConstant: boolean;
  missingValue: 'listwise' | 'pairwise' | 'replace';
}

// Update Props interface
interface OptionsLinearProps {
  params: OptionsLinearParams;
  onChange: (newParams: Partial<OptionsLinearParams>) => void;
}

const OptionsLinear: React.FC<OptionsLinearProps> = ({ params, onChange }) => {
  // Local state initialized from props
  const [steppingMethod, setSteppingMethod] = useState<'probability' | 'fvalue'>(params.steppingMethod);
  const [probEntry, setProbEntry] = useState(params.probEntry);
  const [probRemoval, setProbRemoval] = useState(params.probRemoval);
  const [fvalueEntry, setFvalueEntry] = useState(params.fvalueEntry);
  const [fvalueRemoval, setFvalueRemoval] = useState(params.fvalueRemoval);
  const [includeConstant, setIncludeConstant] = useState(params.includeConstant);
  const [missingValue, setMissingValue] = useState<'listwise' | 'pairwise' | 'replace'>(params.missingValue);

  // Effect to sync local state with incoming params prop changes
  useEffect(() => {
    setSteppingMethod(params.steppingMethod);
    setProbEntry(params.probEntry);
    setProbRemoval(params.probRemoval);
    setFvalueEntry(params.fvalueEntry);
    setFvalueRemoval(params.fvalueRemoval);
    setIncludeConstant(params.includeConstant);
    setMissingValue(params.missingValue);
  }, [params]);

  // Generic handler to update local state and call onChange prop
  const handleChange = (field: keyof OptionsLinearParams, value: any) => {
    // Update local state
    switch(field) {
      case 'steppingMethod': setSteppingMethod(value); break;
      case 'probEntry': setProbEntry(value); break;
      case 'probRemoval': setProbRemoval(value); break;
      case 'fvalueEntry': setFvalueEntry(value); break;
      case 'fvalueRemoval': setFvalueRemoval(value); break;
      case 'includeConstant': setIncludeConstant(value); break;
      case 'missingValue': setMissingValue(value); break;
    }
    // Propagate change
    onChange({ [field]: value });
  };

  return (
    // Return the JSX content directly, without Dialog wrappers
    <div className="p-4 max-h-[70vh] overflow-y-auto"> {/* Adjust padding/height as needed */}
      {/* Removed Header */}
      {/* <Separator className="my-2" /> */}

      {/* Stepping Method Criteria */}
      <div className="border rounded p-4 mb-4">
        <h3 className="font-semibold mb-2">Stepping Method Criteria</h3>
        <div className="flex flex-col space-y-4">
          {/* Option 1: Use probability of F */}
          <div>
            <div className="flex items-center">
              <input
                type="radio"
                name="steppingMethod"
                id="steppingProbability"
                value="probability"
                checked={steppingMethod === 'probability'}
                onChange={(e) => handleChange('steppingMethod', e.target.value as 'probability' | 'fvalue')}
                className="accent-gray-500"
              />
              <label htmlFor="steppingProbability" className="ml-2 text-sm">
                Use probability of F
              </label>
            </div>
            <div className="ml-6 mt-2 grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <label htmlFor="probEntry" className="mr-2 text-sm">
                  Entry:
                </label>
                <Input
                  type="text"
                  id="probEntry"
                  value={probEntry}
                  onChange={(e) => handleChange('probEntry', e.target.value)}
                  className="w-20 p-1 text-sm"
                  disabled={steppingMethod !== 'probability'}
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="probRemoval" className="mr-2 text-sm">
                  Removal:
                </label>
                <Input
                  type="text"
                  id="probRemoval"
                  value={probRemoval}
                  onChange={(e) => handleChange('probRemoval', e.target.value)}
                  className="w-20 p-1 text-sm"
                  disabled={steppingMethod !== 'probability'}
                />
              </div>
            </div>
          </div>

          {/* Option 2: Use F value */}
          <div>
            <div className="flex items-center">
              <input
                type="radio"
                name="steppingMethod"
                id="steppingFvalue"
                value="fvalue"
                checked={steppingMethod === 'fvalue'}
                onChange={(e) => handleChange('steppingMethod', e.target.value as 'probability' | 'fvalue')}
                className="accent-gray-500"
              />
              <label htmlFor="steppingFvalue" className="ml-2 text-sm">
                Use F value
              </label>
            </div>
            <div className="ml-6 mt-2 grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <label htmlFor="fvalueEntry" className="mr-2 text-sm">
                  Entry:
                </label>
                <Input
                  type="text"
                  id="fvalueEntry"
                  value={fvalueEntry}
                  onChange={(e) => handleChange('fvalueEntry', e.target.value)}
                  className="w-20 p-1 text-sm"
                  disabled={steppingMethod !== 'fvalue'}
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="fvalueRemoval" className="mr-2 text-sm">
                  Removal:
                </label>
                <Input
                  type="text"
                  id="fvalueRemoval"
                  value={fvalueRemoval}
                  onChange={(e) => handleChange('fvalueRemoval', e.target.value)}
                  className="w-20 p-1 text-sm"
                  disabled={steppingMethod !== 'fvalue'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Include constant in equation */}
      <div className="mb-4">
        <div className="flex items-center">
          <Checkbox
            checked={includeConstant}
            onCheckedChange={(checked) => handleChange('includeConstant', !!checked)}
            id="includeConstant"
          />
          <label htmlFor="includeConstant" className="ml-2 text-sm">
            Include constant in equation
          </label>
        </div>
      </div>

      {/* Missing Values */}
      <div className="border rounded p-4 mb-4">
        <h3 className="font-semibold mb-2">Missing Values</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              name="missingValues"
              id="excludeListwise"
              value="listwise"
              checked={missingValue === 'listwise'}
              onChange={(e) => handleChange('missingValue', e.target.value as 'listwise' | 'pairwise' | 'replace')}
              className="accent-gray-500"
            />
            <label htmlFor="excludeListwise" className="ml-2 text-sm">
              Exclude cases listwise
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              name="missingValues"
              id="excludePairwise"
              value="pairwise"
              checked={missingValue === 'pairwise'}
              onChange={(e) => handleChange('missingValue', e.target.value as 'listwise' | 'pairwise' | 'replace')}
              className="accent-gray-500"
            />
            <label htmlFor="excludePairwise" className="ml-2 text-sm">
              Exclude cases pairwise
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              name="missingValues"
              id="replaceMean"
              value="replace"
              checked={missingValue === 'replace'}
              onChange={(e) => handleChange('missingValue', e.target.value as 'listwise' | 'pairwise' | 'replace')}
              className="accent-gray-500"
            />
            <label htmlFor="replaceMean" className="ml-2 text-sm">
              Replace with mean
            </label>
          </div>
        </div>
      </div>
      {/* Removed Footer */}
    </div>
  );
};

export default OptionsLinear;
