import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Variable } from '@/types/Variable';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

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
  const [isTestingLinearity, setIsTestingLinearity] = useState(false);
  const [linearityTestError, setLinearityTestError] = useState<string | null>(null);
  const [linearityTestSuccess, setLinearityTestSuccess] = useState(false);
  
  // Add states for normality test
  const [isTestingNormality, setIsTestingNormality] = useState(false);
  const [normalityTestError, setNormalityTestError] = useState<string | null>(null);
  const [normalityTestSuccess, setNormalityTestSuccess] = useState(false);
  
  // Add states for homoscedasticity test
  const [isTestingHomoscedasticity, setIsTestingHomoscedasticity] = useState(false);
  const [homoscedasticityTestError, setHomoscedasticityTestError] = useState<string | null>(null);
  const [homoscedasticityTestSuccess, setHomoscedasticityTestSuccess] = useState(false);
  
  const data = useDataStore((state) => state.data);
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  const handleTestLinearityClick = async () => {
    try {
      setIsTestingLinearity(true);
      setLinearityTestError(null);
      setLinearityTestSuccess(false);
      
      if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
        throw new Error('Please select a dependent variable and at least one independent variable');
      }
      
      console.log("Starting linearity test with data:", {
        dataLength: data.length,
        dependentVar: selectedDependentVariable.name,
        independentVars: selectedIndependentVariables.map(v => v.name)
      });
      
      const dependentVarIndex = selectedDependentVariable.columnIndex;
      const independentVarIndices = selectedIndependentVariables.map(v => v.columnIndex);
      
      // Extract data for analysis
      const dependentData = data.map(row => parseFloat(String(row[dependentVarIndex])));
      const independentData = independentVarIndices.map(index => 
        data.map(row => parseFloat(String(row[index])))
      );
      
      console.log("Data extraction:", {
        dependentDataLength: dependentData.length,
        independentDataLength: independentData.length,
        dependentSample: dependentData.slice(0, 5),
        independentSample: independentData.map(arr => arr.slice(0, 5))
      });
      
      // Filter out rows with missing values
      const validIndices = dependentData.map((value, idx) => {
        if (isNaN(value)) return false;
        
        for (const indepData of independentData) {
          if (isNaN(indepData[idx])) return false;
        }
        
        return true;
      });
      
      const filteredDependentData = dependentData.filter((_, idx) => validIndices[idx]);
      const filteredIndependentData = independentData.map(indepData => 
        indepData.filter((_, idx) => validIndices[idx])
      );
      
      console.log("Filtered data:", {
        validCount: validIndices.filter(Boolean).length,
        filteredDependentLength: filteredDependentData.length,
        filteredIndependentLength: filteredIndependentData.length,
        dependentSample: filteredDependentData.slice(0, 5),
        independentSample: filteredIndependentData.map(arr => arr.slice(0, 5))
      });
      
      // Make sure we have data to analyze
      if (filteredDependentData.length === 0 || filteredIndependentData.some(arr => arr.length === 0)) {
        throw new Error("No valid data available for analysis after filtering missing values");
      }
      
      // Prepare variable info for the worker
      const independentVariableInfos = selectedIndependentVariables.map(v => ({
        name: v.name,
        label: v.label
      }));
      
      // Create log message
      const logMessage = `TESTING LINEAR REGRESSION ASSUMPTIONS
      /TEST LINEARITY 
      /DEPENDENT ${selectedDependentVariable.name} 
      /INDEPENDENT ${selectedIndependentVariables.map(v => v.name).join(' ')}.`;
      
      const log = { log: logMessage };
      const logId = await addLog(log);
      
      const analytic = {
        title: "Linear Regression Assumption Tests",
        note: "Linearity Test",
      };
      const analyticId = await addAnalytic(logId, analytic);
      
      // Create and start the worker
      const linearityWorker = new Worker('/workers/Regression/Assumption Test/linearity.js');
      
      // Prepare the data to send to the worker
      const workerData = {
        dependentData: filteredDependentData,
        independentData: filteredIndependentData,
        independentVariableInfos: independentVariableInfos
      };
      
      console.log("Sending data to worker:", {
        dependentDataLength: workerData.dependentData.length,
        independentDataLength: workerData.independentData.length,
        variablesCount: workerData.independentVariableInfos.length
      });
      
      linearityWorker.postMessage(workerData);
      
      linearityWorker.onmessage = async (e: MessageEvent) => {
        const response = e.data;
        
        if (response.error) {
          console.error("Linearity test worker error:", response.error);
          setLinearityTestError(response.error);
        } else {
          console.log("Linearity test results:", response);
          
          // Save the results to statistics store
          const linearityStat = {
            title: "Linearity Test Results",
            output_data: JSON.stringify(response),
            components: "LinearityTest",
            description: "Tests the linearity assumption of regression model"
          };
          
          await addStatistic(analyticId, linearityStat);
          setLinearityTestSuccess(true);
        }
        
        setIsTestingLinearity(false);
        linearityWorker.terminate();
      };
      
      linearityWorker.onerror = (error: ErrorEvent) => {
        console.error("Linearity test worker error:", error);
        setLinearityTestError(error.message);
        setIsTestingLinearity(false);
        linearityWorker.terminate();
      };
      
    } catch (error) {
      console.error("Error in linearity test:", error);
      setLinearityTestError(error instanceof Error ? error.message : 'Unknown error');
      setIsTestingLinearity(false);
    }
  };
  
  const handleTestNormalityClick = async () => {
    try {
      setIsTestingNormality(true);
      setNormalityTestError(null);
      setNormalityTestSuccess(false);
      
      if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
        throw new Error('Please select a dependent variable and at least one independent variable');
      }
      
      console.log("Starting normality test with data:", {
        dataLength: data.length,
        dependentVar: selectedDependentVariable.name,
        independentVars: selectedIndependentVariables.map(v => v.name)
      });
      
      const dependentVarIndex = selectedDependentVariable.columnIndex;
      const independentVarIndices = selectedIndependentVariables.map(v => v.columnIndex);
      
      // Extract data for analysis
      const dependentData = data.map(row => parseFloat(String(row[dependentVarIndex])));
      const independentData = independentVarIndices.map(index => 
        data.map(row => parseFloat(String(row[index])))
      );
      
      console.log("Data extraction:", {
        dependentDataLength: dependentData.length,
        independentDataLength: independentData.length,
        dependentSample: dependentData.slice(0, 5),
        independentSample: independentData.map(arr => arr.slice(0, 5))
      });
      
      // Filter out rows with missing values
      const validIndices = dependentData.map((value, idx) => {
        if (isNaN(value)) return false;
        
        for (const indepData of independentData) {
          if (isNaN(indepData[idx])) return false;
        }
        
        return true;
      });
      
      const filteredDependentData = dependentData.filter((_, idx) => validIndices[idx]);
      const filteredIndependentData = independentData.map(indepData => 
        indepData.filter((_, idx) => validIndices[idx])
      );
      
      console.log("Filtered data:", {
        validCount: validIndices.filter(Boolean).length,
        filteredDependentLength: filteredDependentData.length,
        filteredIndependentLength: filteredIndependentData.length
      });
      
      // Make sure we have data to analyze
      if (filteredDependentData.length === 0 || filteredIndependentData.some(arr => arr.length === 0)) {
        throw new Error("No valid data available for analysis after filtering missing values");
      }
      
      // Prepare variable info for the worker
      const independentVariableInfos = selectedIndependentVariables.map(v => ({
        name: v.name,
        label: v.label
      }));
      
      // Create log message
      const logMessage = `TESTING LINEAR REGRESSION ASSUMPTIONS
      /TEST NORMALITY 
      /DEPENDENT ${selectedDependentVariable.name} 
      /INDEPENDENT ${selectedIndependentVariables.map(v => v.name).join(' ')}.`;
      
      const log = { log: logMessage };
      const logId = await addLog(log);
      
      const analytic = {
        title: "Linear Regression Assumption Tests",
        note: "Normality Test",
      };
      const analyticId = await addAnalytic(logId, analytic);
      
      // Create and start the worker
      const normalityWorker = new Worker('/workers/Regression/Assumption Test/normality.js');
      
      // Prepare the data to send to the worker
      const workerData = {
        dependentData: filteredDependentData,
        independentData: filteredIndependentData,
        independentVariableInfos: independentVariableInfos
      };
      
      console.log("Sending data to normality worker:", {
        dependentDataLength: workerData.dependentData.length,
        independentDataLength: workerData.independentData.length,
        variablesCount: workerData.independentVariableInfos.length
      });
      
      normalityWorker.postMessage(workerData);
      
      normalityWorker.onmessage = async (e: MessageEvent) => {
        const response = e.data;
        
        if (response.error) {
          console.error("Normality test worker error:", response.error);
          setNormalityTestError(response.error);
        } else {
          console.log("Normality test results:", response);
          
          // Save the results to statistics store
          const normalityStat = {
            title: "Normality Test Results",
            output_data: JSON.stringify(response),
            components: "NormalityTest",
            description: "Tests if the residuals follow a normal distribution"
          };
          
          await addStatistic(analyticId, normalityStat);
          setNormalityTestSuccess(true);
        }
        
        setIsTestingNormality(false);
        normalityWorker.terminate();
      };
      
      normalityWorker.onerror = (error: ErrorEvent) => {
        console.error("Normality test worker error:", error);
        setNormalityTestError(error.message);
        setIsTestingNormality(false);
        normalityWorker.terminate();
      };
      
    } catch (error) {
      console.error("Error in normality test:", error);
      setNormalityTestError(error instanceof Error ? error.message : 'Unknown error');
      setIsTestingNormality(false);
    }
  };

  const handleTestHomoscedasticityClick = async () => {
    try {
      setIsTestingHomoscedasticity(true);
      setHomoscedasticityTestError(null);
      setHomoscedasticityTestSuccess(false);
      
      if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
        throw new Error('Please select a dependent variable and at least one independent variable');
      }
      
      console.log("Starting homoscedasticity test with data:", {
        dataLength: data.length,
        dependentVar: selectedDependentVariable.name,
        independentVars: selectedIndependentVariables.map(v => v.name)
      });
      
      const dependentVarIndex = selectedDependentVariable.columnIndex;
      const independentVarIndices = selectedIndependentVariables.map(v => v.columnIndex);
      
      // Extract data for analysis
      const dependentData = data.map(row => parseFloat(String(row[dependentVarIndex])));
      const independentData = independentVarIndices.map(index => 
        data.map(row => parseFloat(String(row[index])))
      );
      
      console.log("Data extraction:", {
        dependentDataLength: dependentData.length,
        independentDataLength: independentData.length,
        dependentSample: dependentData.slice(0, 5),
        independentSample: independentData.map(arr => arr.slice(0, 5))
      });
      
      // Filter out rows with missing values
      const validIndices = dependentData.map((value, idx) => {
        if (isNaN(value)) return false;
        
        for (const indepData of independentData) {
          if (isNaN(indepData[idx])) return false;
        }
        
        return true;
      });
      
      const filteredDependentData = dependentData.filter((_, idx) => validIndices[idx]);
      const filteredIndependentData = independentData.map(indepData => 
        indepData.filter((_, idx) => validIndices[idx])
      );
      
      console.log("Filtered data:", {
        validCount: validIndices.filter(Boolean).length,
        filteredDependentLength: filteredDependentData.length,
        filteredIndependentLength: filteredIndependentData.length
      });
      
      // Make sure we have data to analyze
      if (filteredDependentData.length === 0 || filteredIndependentData.some(arr => arr.length === 0)) {
        throw new Error("No valid data available for analysis after filtering missing values");
      }
      
      // Prepare variable info for the worker
      const independentVariableInfos = selectedIndependentVariables.map(v => ({
        name: v.name,
        label: v.label
      }));
      
      // Create log message
      const logMessage = `TESTING LINEAR REGRESSION ASSUMPTIONS
      /TEST HOMOSCEDASTICITY 
      /DEPENDENT ${selectedDependentVariable.name} 
      /INDEPENDENT ${selectedIndependentVariables.map(v => v.name).join(' ')}.`;
      
      const log = { log: logMessage };
      const logId = await addLog(log);
      
      const analytic = {
        title: "Linear Regression Assumption Tests",
        note: "Homoscedasticity Test",
      };
      const analyticId = await addAnalytic(logId, analytic);
      
      // Create and start the worker
      const homoscedasticityWorker = new Worker('/workers/Regression/Assumption Test/homoscedasticity.js');
      
      // Prepare the data to send to the worker
      const workerData = {
        dependentData: filteredDependentData,
        independentData: filteredIndependentData,
        independentVariableInfos: independentVariableInfos
      };
      
      console.log("Sending data to homoscedasticity worker:", {
        dependentDataLength: workerData.dependentData.length,
        independentDataLength: workerData.independentData.length,
        variablesCount: workerData.independentVariableInfos.length
      });
      
      homoscedasticityWorker.postMessage(workerData);
      
      homoscedasticityWorker.onmessage = async (e: MessageEvent) => {
        const response = e.data;
        
        if (response.error) {
          console.error("Homoscedasticity test worker error:", response.error);
          setHomoscedasticityTestError(response.error);
        } else {
          console.log("Homoscedasticity test results:", response);
          
          // Save the results to statistics store
          const homoscedasticityStat = {
            title: "Homoscedasticity Test Results",
            output_data: JSON.stringify(response),
            components: "HomoscedasticityTest",
            description: "Tests if the residuals have constant variance"
          };
          
          await addStatistic(analyticId, homoscedasticityStat);
          setHomoscedasticityTestSuccess(true);
        }
        
        setIsTestingHomoscedasticity(false);
        homoscedasticityWorker.terminate();
      };
      
      homoscedasticityWorker.onerror = (error: ErrorEvent) => {
        console.error("Homoscedasticity test worker error:", error);
        setHomoscedasticityTestError(error.message);
        setIsTestingHomoscedasticity(false);
        homoscedasticityWorker.terminate();
      };
      
    } catch (error) {
      console.error("Error in homoscedasticity test:", error);
      setHomoscedasticityTestError(error instanceof Error ? error.message : 'Unknown error');
      setIsTestingHomoscedasticity(false);
    }
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
                  {selectedDependentVariable ? 
                    `${selectedDependentVariable.name}${selectedDependentVariable.label ? ` (${selectedDependentVariable.label})` : ''}` : 
                    'None selected'
                  }
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
                          {variable.name}{variable.label ? ` (${variable.label})` : ''}
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

      {linearityTestError && (
        <Alert variant="destructive">
          <AlertTitle>Linearity Test Error</AlertTitle>
          <AlertDescription>{linearityTestError}</AlertDescription>
        </Alert>
      )}

      {linearityTestSuccess && (
        <Alert>
          <AlertTitle>Linearity Test Success</AlertTitle>
          <AlertDescription>
            Linearity test completed successfully. Check the Output View to see the results.
          </AlertDescription>
        </Alert>
      )}
      
      {normalityTestError && (
        <Alert variant="destructive">
          <AlertTitle>Normality Test Error</AlertTitle>
          <AlertDescription>{normalityTestError}</AlertDescription>
        </Alert>
      )}

      {normalityTestSuccess && (
        <Alert>
          <AlertTitle>Normality Test Success</AlertTitle>
          <AlertDescription>
            Normality test completed successfully. Check the Output View to see the results.
          </AlertDescription>
        </Alert>
      )}

      {homoscedasticityTestError && (
        <Alert variant="destructive">
          <AlertTitle>Homoscedasticity Test Error</AlertTitle>
          <AlertDescription>{homoscedasticityTestError}</AlertDescription>
        </Alert>
      )}

      {homoscedasticityTestSuccess && (
        <Alert>
          <AlertTitle>Homoscedasticity Test Success</AlertTitle>
          <AlertDescription>
            Homoscedasticity test completed successfully. Check the Output View to see the results.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label className="font-bold">Assumption Tests</Label>
        <Card className="border rounded-md">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Linearity Test</Label>
                <p className="text-xs text-muted-foreground">Tests if the relationship between variables is linear</p>
              </div>
              <Button 
                onClick={handleTestLinearityClick} 
                disabled={isTestingLinearity || !selectedDependentVariable || selectedIndependentVariables.length === 0}
              >
                {isTestingLinearity ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Linearity'
                )}
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Normality Test</Label>
                <p className="text-xs text-muted-foreground">Tests if residuals are normally distributed</p>
              </div>
              <Button 
                onClick={handleTestNormalityClick}
                disabled={isTestingNormality || !selectedDependentVariable || selectedIndependentVariables.length === 0}
              >
                {isTestingNormality ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Normality'
                )}
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="font-semibold">Homoscedasticity Test</Label>
                <p className="text-xs text-muted-foreground">Tests if residuals have constant variance</p>
              </div>
              <Button 
                onClick={handleTestHomoscedasticityClick}
                disabled={isTestingHomoscedasticity || !selectedDependentVariable || selectedIndependentVariables.length === 0}
              >
                {isTestingHomoscedasticity ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Homoscedasticity'
                )}
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