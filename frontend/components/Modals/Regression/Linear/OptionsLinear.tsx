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
  missingValue: 'listwise' | 'pairwise' | 'mean';
}

// Update Props interface
interface OptionsLinearProps {
  params: OptionsLinearParams;
  onChange: (newParams: Partial<OptionsLinearParams>) => void;
}

const OptionsLinear: React.FC<OptionsLinearProps> = ({ params, onChange }) => {
  // Local state initialized from props
  const [includeConstant, setIncludeConstant] = useState(params.includeConstant);
  const [replaceMissingWithMean, setReplaceMissingWithMean] = useState(params.replaceMissingWithMean);

  // Effect to sync local state with incoming params prop changes
  useEffect(() => {
    setIncludeConstant(params.includeConstant);
    setReplaceMissingWithMean(params.replaceMissingWithMean);
  }, [params]);

  // Generic handler to update local state and call onChange prop
  const handleChange = (field: keyof OptionsLinearParams, value: any) => {
    // Update local state
    switch(field) {
      case 'includeConstant': setIncludeConstant(value); break;
      case 'replaceMissingWithMean': setReplaceMissingWithMean(value); break;
    }
    // Propagate change
    onChange({ [field]: value });
  };

  return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Regression Options</h3>
        
        <div className="space-y-6">
          {/* Model Section */}
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Model Parameters</h4>
            <div className="flex items-center pl-2">
              <Checkbox
                checked={includeConstant}
                onCheckedChange={(checked) => handleChange('includeConstant', !!checked)}
                id="includeConstant"
              />
              <label htmlFor="includeConstant" className="ml-3 text-sm">
                Include constant in equation
              </label>
            </div>
          </div>

          {/* Missing Values Section */}
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Missing Values</h4>
            <div className="flex items-center pl-2">
              <Checkbox
                checked={replaceMissingWithMean}
                onCheckedChange={(checked) => handleChange('replaceMissingWithMean', !!checked)}
                id="replaceMissingWithMean"
              />
              <label htmlFor="replaceMissingWithMean" className="ml-3 text-sm">
                Replace missing values with mean
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsLinear;
