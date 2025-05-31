import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Variable } from '@/types/Variable';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface AssumptionTestParams {
  testLinearityEnabled: boolean;
  testNormalityEnabled: boolean;
  testHomoscedasticityEnabled: boolean;
  testMulticollinearityEnabled: boolean;
  testAutocorrelationEnabled: boolean;
}

interface AssumptionTestProps {
  params: AssumptionTestParams;
  onChange: (newParams: Partial<AssumptionTestParams>) => void;
  selectedDependentVariable: Variable | null;
  selectedIndependentVariables: Variable[];
}

const AssumptionTest: React.FC<AssumptionTestProps> = ({
  params,
  onChange,
  selectedDependentVariable,
  selectedIndependentVariables
}) => {
  const handleTestLinearityClick = () => {
    // This will be implemented to run the linearity test
    alert('Linearity test would run here. Implementation pending.');
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label className="font-bold">Selected Variables</Label>
        <Card className="border rounded-md">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div>
                <Label className="font-semibold">Dependent Variable:</Label>
                <div className="pl-4 text-sm">
                  {selectedDependentVariable?.name || 'None selected'}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div>
                <Label className="font-semibold">Independent Variables:</Label>
                <ScrollArea className="h-24 mt-1">
                  <div className="pl-4 space-y-1">
                    {selectedIndependentVariables.length > 0 ? (
                      selectedIndependentVariables.map((variable) => (
                        <div key={variable.columnIndex} className="text-sm">
                          {variable.name}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">None selected</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label className="font-bold">Assumption Tests</Label>
        <Card className="border rounded-md">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Linearity Test</Label>
                <p className="text-xs text-muted-foreground">Tests if the relationship between variables is linear</p>
              </div>
              <Button onClick={handleTestLinearityClick} disabled={!selectedDependentVariable || selectedIndependentVariables.length === 0}>
                Test Linearity
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Normality Test</Label>
                <p className="text-xs text-muted-foreground">Tests if residuals are normally distributed</p>
              </div>
              <Button disabled={!selectedDependentVariable || selectedIndependentVariables.length === 0}>
                Test Normality
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Homoscedasticity Test</Label>
                <p className="text-xs text-muted-foreground">Tests if residuals have constant variance</p>
              </div>
              <Button disabled={!selectedDependentVariable || selectedIndependentVariables.length === 0}>
                Test Homoscedasticity
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Multicollinearity Test</Label>
                <p className="text-xs text-muted-foreground">Tests for correlation among independent variables</p>
              </div>
              <Button disabled={selectedIndependentVariables.length < 2}>
                Test Multicollinearity
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Autocorrelation Test</Label>
                <p className="text-xs text-muted-foreground">Tests for correlation between residuals</p>
              </div>
              <Button disabled={!selectedDependentVariable || selectedIndependentVariables.length === 0}>
                Test Autocorrelation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssumptionTest; 