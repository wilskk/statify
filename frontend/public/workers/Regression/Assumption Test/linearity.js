// Worker for linearity test in linear regression
self.onmessage = function(e) {
  try {
    const { dependentData, independentData, independentVariableInfos } = e.data;
    
    // Add some debug information
    console.log("Worker received data:", {
      hasDependent: !!dependentData,
      hasIndependent: !!independentData,
      hasVariableInfo: !!independentVariableInfos,
      dependentLength: dependentData?.length || 0,
      independentLength: independentData?.length || 0,
      infoLength: independentVariableInfos?.length || 0
    });
    
    // Make sure we have data to analyze
    if (!dependentData || !independentData) {
      self.postMessage({ error: "Missing data: dependent or independent variable data not provided" });
      return;
    }
    
    if (dependentData.length === 0 || independentData.length === 0) {
      self.postMessage({ error: "Empty data arrays provided for linearity test" });
      return;
    }
    
    if (!independentVariableInfos || independentVariableInfos.length === 0) {
      self.postMessage({ error: "Missing variable information for independent variables" });
      return;
    }
    
    if (independentData.length !== independentVariableInfos.length) {
      self.postMessage({ 
        error: `Data mismatch: ${independentData.length} independent data arrays but ${independentVariableInfos.length} variable info objects` 
      });
      return;
    }

    // Transpose independent data if needed (want rows = observations, cols = variables)
    let independentDataTransposed = independentData;
    if (!Array.isArray(independentData[0])) {
      // Need to transpose data
      console.log("Worker transposing data");
      independentDataTransposed = [independentData]; // Wrap in array if it's a single array
    }

    const results = [];
    
    // For each independent variable, check linearity with the dependent variable
    for (let i = 0; i < independentVariableInfos.length; i++) {
      const independentVarData = independentDataTransposed[i];
      
      if (!independentVarData || independentVarData.length === 0) {
        console.log(`Skipping variable ${i} due to missing data`);
        continue;
      }
      
      if (independentVarData.length !== dependentData.length) {
        console.log(`Data length mismatch for variable ${i}: dependent=${dependentData.length}, independent=${independentVarData.length}`);
      }
      
      const variableName = independentVariableInfos[i].name || `Variable ${i+1}`;
      const variableLabel = independentVariableInfos[i].label || variableName;
      
      // Calculate correlation coefficient
      const correlation = calculateCorrelation(dependentData, independentVarData);
      
      // Calculate RESET test
      const resetTest = calculateRESETTest(dependentData, independentVarData);
      
      // Prepare data for scatter plot visualization
      const scatterData = dependentData.map((y, index) => ({
        x: independentVarData[index],
        y: y
      }));
      
      // Add to results
      results.push({
        variable: variableName,
        variableLabel: variableLabel,
        correlation: correlation,
        resetTest: resetTest,
        isLinear: resetTest.pValue > 0.05, // If p-value > 0.05, we fail to reject the null hypothesis of linearity
        scatterData: scatterData
      });
    }
    
    if (results.length === 0) {
      self.postMessage({ error: "Could not calculate linearity results for any variables" });
      return;
    }
    
    // Create a single summary result
    const summary = {
      title: "Linearity Test Results",
      description: "Tests if the relationship between dependent and independent variables is linear",
      allLinear: results.every(r => r.isLinear),
      results: results
    };
    
    self.postMessage(summary);
  } catch (error) {
    self.postMessage({ 
      error: "Error in linearity test: " + (error.message || "Unknown error"),
      stack: error.stack
    });
  }
};

// Function to calculate correlation coefficient
function calculateCorrelation(x, y) {
  const n = x.length;
  
  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate correlation coefficient
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }
  
  const denominator = Math.sqrt(xDenominator * yDenominator);
  
  return numerator / denominator;
}

// Function to calculate RESET test for linearity
function calculateRESETTest(y, x) {
  const n = y.length;
  
  // Simple linear regression
  const { beta0, beta1, yHat, residuals, sse, r2 } = simpleLinearRegression(y, x);
  
  // Augmented regression with squared fitted values
  const yHatSquared = yHat.map(val => val * val);
  
  // Run regression of y on x and yHat^2
  const augmentedX = x.map((val, i) => [val, yHatSquared[i]]);
  const augmentedRegression = multipleLinearRegression(y, augmentedX);
  
  // Calculate F-statistic
  const restrictedSSE = sse;
  const unrestrictedSSE = augmentedRegression.sse;
  const q = 1; // Number of restrictions (we added 1 variable)
  const k = 2 + q; // Number of parameters in unrestricted model
  
  const fStat = ((restrictedSSE - unrestrictedSSE) / q) / (unrestrictedSSE / (n - k));
  
  // Calculate p-value (approximation)
  const pValue = 1 - pf(fStat, q, n - k);
  
  return {
    fStatistic: fStat,
    pValue: pValue,
    isLinear: pValue > 0.05
  };
}

// Simple linear regression function
function simpleLinearRegression(y, x) {
  const n = y.length;
  
  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate beta1 (slope)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += (x[i] - xMean) * (x[i] - xMean);
  }
  
  const beta1 = numerator / denominator;
  
  // Calculate beta0 (intercept)
  const beta0 = yMean - beta1 * xMean;
  
  // Calculate fitted values and residuals
  const yHat = x.map(val => beta0 + beta1 * val);
  const residuals = y.map((val, i) => val - yHat[i]);
  
  // Calculate SSE and R^2
  const sse = residuals.reduce((sum, val) => sum + val * val, 0);
  const sst = y.map(val => val - yMean).reduce((sum, val) => sum + val * val, 0);
  const r2 = 1 - (sse / sst);
  
  return { beta0, beta1, yHat, residuals, sse, r2 };
}

// Multiple linear regression function
function multipleLinearRegression(y, X) {
  const n = y.length;
  const p = X[0].length;
  
  // Add column of 1s for intercept
  const XWithIntercept = X.map(row => [1, ...row]);
  
  // Matrix operations for OLS (X'X)^(-1)X'y
  // Note: This is a simple implementation and may not be numerically stable for all cases
  const XTranspose = transpose(XWithIntercept);
  const XTX = matrixMultiply(XTranspose, XWithIntercept);
  const XTXInv = matrixInverse(XTX);
  const XTY = matrixMultiplyVector(XTranspose, y);
  const beta = matrixMultiplyVector(XTXInv, XTY);
  
  // Calculate fitted values
  const yHat = XWithIntercept.map(row => 
    row.reduce((sum, val, idx) => sum + val * beta[idx], 0)
  );
  
  // Calculate residuals
  const residuals = y.map((val, i) => val - yHat[i]);
  
  // Calculate SSE
  const sse = residuals.reduce((sum, val) => sum + val * val, 0);
  
  // Calculate yMean and SST
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  const sst = y.map(val => val - yMean).reduce((sum, val) => sum + val * val, 0);
  
  // Calculate R^2
  const r2 = 1 - (sse / sst);
  
  // Calculate adjusted R^2
  const adjR2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1));
  
  return { beta, yHat, residuals, sse, r2, adjR2 };
}

// Matrix transpose
function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Matrix multiplication
function matrixMultiply(A, B) {
  const result = Array(A.length).fill().map(() => Array(B[0].length).fill(0));
  
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      for (let k = 0; k < A[0].length; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return result;
}

// Matrix-vector multiplication
function matrixMultiplyVector(A, v) {
  const result = Array(A.length).fill(0);
  
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < v.length; j++) {
      result[i] += A[i][j] * v[j];
    }
  }
  
  return result;
}

// Simple matrix inverse (for 2x2 and 3x3 matrices)
function matrixInverse(A) {
  const n = A.length;
  
  if (n === 1) {
    return [[1 / A[0][0]]];
  }
  
  if (n === 2) {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    return [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det]
    ];
  }
  
  if (n === 3) {
    // For 3x3, use adjugate matrix method
    const det = 
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    
    const adjugate = [
      [
        (A[1][1] * A[2][2] - A[1][2] * A[2][1]),
        -(A[0][1] * A[2][2] - A[0][2] * A[2][1]),
        (A[0][1] * A[1][2] - A[0][2] * A[1][1])
      ],
      [
        -(A[1][0] * A[2][2] - A[1][2] * A[2][0]),
        (A[0][0] * A[2][2] - A[0][2] * A[2][0]),
        -(A[0][0] * A[1][2] - A[0][2] * A[1][0])
      ],
      [
        (A[1][0] * A[2][1] - A[1][1] * A[2][0]),
        -(A[0][0] * A[2][1] - A[0][1] * A[2][0]),
        (A[0][0] * A[1][1] - A[0][1] * A[1][0])
      ]
    ];
    
    return adjugate.map(row => row.map(val => val / det));
  }
  
  // For larger matrices, use a numerical method like LU decomposition
  throw new Error("Matrix inverse not implemented for matrices larger than 3x3");
}

// F-distribution CDF approximation
function pf(x, df1, df2) {
  // This is a simple approximation of the F-distribution CDF
  // For more accuracy, you'd want to use a statistical library
  // or implement a proper F-distribution CDF calculation
  
  if (x <= 0) return 0;
  
  // Use Beta function relationship
  const v1 = df1;
  const v2 = df2;
  const beta = (v1 * x) / (v1 * x + v2);
  
  // Incomplete beta function approximation
  return incompleteBeta(beta, v1/2, v2/2);
}

// Incomplete beta function approximation
function incompleteBeta(x, a, b) {
  // Very simplified approximation - use with caution
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  // Simple approximation
  return Math.pow(x, a) / (a * beta(a, b));
}

// Beta function
function beta(a, b) {
  return (gamma(a) * gamma(b)) / gamma(a + b);
}

// Gamma function approximation (Lanczos approximation)
function gamma(z) {
  // Simplified Lanczos approximation
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  
  const t = z + p.length - 1.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
} 