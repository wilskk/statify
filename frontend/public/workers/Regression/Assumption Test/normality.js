// Worker for normality test in linear regression
self.onmessage = function(e) {
  try {
    const { dependentData, independentData, independentVariableInfos } = e.data;
    
    console.log("Normality test worker received data:", {
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
      self.postMessage({ error: "Empty data arrays provided for normality test" });
      return;
    }

    // For normality test, we need to:
    // 1. Compute the linear regression
    // 2. Get residuals
    // 3. Test normality of residuals
    
    // Prepare independent data as a matrix of observations × variables
    const X = prepareIndependentData(independentData);
    
    // Run the regression
    const regression = multipleLinearRegression(dependentData, X);
    const { residuals } = regression;
    
    // Perform normality tests
    const shapiroWilk = calculateShapiroWilk(residuals);
    const kolmogorovSmirnov = calculateKolmogorovSmirnov(residuals);
    const jarqueBera = calculateJarqueBera(residuals);
    
    // Calculate mean and standard deviation of residuals
    const residualsMean = mean(residuals);
    const residualsStdDev = standardDeviation(residuals, residualsMean);
    
    // Generate histogram data
    const histogramData = generateHistogramData(residuals, 10);
    
    // Generate QQ plot data
    const qqPlotData = generateQQPlotData(residuals);
    
    // Determine overall normality based on tests
    const isNormal = shapiroWilk.isNormal && kolmogorovSmirnov.isNormal;
    
    // Create more focused interpretation that focuses on the assumption status and recommendations
    let detailedInterpretation = isNormal
      ? "The tests indicate that the residuals follow a normal distribution, which is a key assumption for linear regression."
      : "Some tests suggest the residuals may not follow a normal distribution. This could affect the validity of statistical inferences from the model.";
      
    // Format results for the data-table component
    const tableData = {
      tables: [
        {
          title: "Normality Test Results",
          columnHeaders: [
            { header: "Test" },
            { header: "Statistic" },
            { header: "P-Value" },
            { header: "Status" }
          ],
          rows: [
            {
              rowHeader: ["Shapiro-Wilk"],
              "Statistic": shapiroWilk.statistic.toFixed(4),
              "P-Value": shapiroWilk.pValue.toFixed(4),
              "Status": shapiroWilk.isNormal ? "Normal" : "Not normally distributed"
            },
            {
              rowHeader: ["Kolmogorov-Smirnov"],
              "Statistic": kolmogorovSmirnov.statistic.toFixed(4),
              "P-Value": kolmogorovSmirnov.pValue.toFixed(4),
              "Status": kolmogorovSmirnov.isNormal ? "Normal" : "Not normally distributed"
            },
            {
              rowHeader: ["Jarque-Bera"],
              "Statistic": jarqueBera.statistic.toFixed(4),
              "P-Value": jarqueBera.pValue.toFixed(4),
              "Status": jarqueBera.isNormal ? "Normal" : "Not normally distributed"
            }
          ]
        },
        {
          title: "Residual Statistics",
          columnHeaders: [
            { header: "Metric" },
            { header: "Value" }
          ],
          rows: [
            {
              rowHeader: ["Sample Size"],
              "Value": residuals.length.toString()
            },
            {
              rowHeader: ["Mean"],
              "Value": residualsMean.toFixed(4)
            },
            {
              rowHeader: ["Standard Deviation"],
              "Value": residualsStdDev.toFixed(4)
            },
            {
              rowHeader: ["Skewness"],
              "Value": jarqueBera.skewness.toFixed(4)
            },
            {
              rowHeader: ["Kurtosis"],
              "Value": jarqueBera.kurtosis.toFixed(4)
            },
            {
              rowHeader: ["Minimum"],
              "Value": Math.min(...residuals).toFixed(4)
            },
            {
              rowHeader: ["Maximum"],
              "Value": Math.max(...residuals).toFixed(4)
            }
          ]
        }
      ]
    };
    
    // Prepare final results
    const result = {
      title: "Normality Test Results",
      description: "Tests if the residuals from the regression model are normally distributed",
      isNormal: isNormal,
      interpretation: detailedInterpretation,
      output_data: JSON.stringify(tableData),
      tests: {
        shapiroWilk,
        kolmogorovSmirnov,
        jarqueBera
      },
      residualStats: {
        count: residuals.length,
        mean: residualsMean,
        stdDev: residualsStdDev,
        min: Math.min(...residuals),
        max: Math.max(...residuals)
      },
      visualizations: {
        histogram: histogramData,
        qqPlot: qqPlotData
      }
    };
    
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      error: "Error in normality test: " + (error.message || "Unknown error"),
      stack: error.stack
    });
  }
};

// Function to prepare independent data matrix
function prepareIndependentData(independentData) {
  // Check if data is already in the right format
  if (Array.isArray(independentData) && independentData.length > 0) {
    if (!Array.isArray(independentData[0])) {
      // Single variable case
      return independentData.map(value => [value]);
    } else {
      // Try to guess correct format
      // If first element is an array of values for one observation, transform it
      if (independentData.length === 1 && independentData[0].length > 1) {
        return independentData[0].map(val => [val]);
      }
      
      // If independentData is an array of arrays where each inner array represents one variable
      if (independentData.length > 1 && independentData[0].length > 1) {
        // Transpose the data to get observations as rows
        return independentData[0].map((_, colIndex) => 
          independentData.map(row => row[colIndex])
        );
      }
    }
  }
  
  return independentData;
}

// Multiple linear regression function
function multipleLinearRegression(y, X) {
  const n = y.length;
  let p;
  
  // Ensure X is properly formatted
  let xMatrix;
  if (Array.isArray(X[0])) {
    // X is already a matrix
    xMatrix = X;
    p = X[0].length;
  } else {
    // X is a vector, convert to matrix
    xMatrix = X.map(val => [val]);
    p = 1;
  }
  
  // Add column of 1s for intercept
  const XWithIntercept = xMatrix.map(row => [1, ...(Array.isArray(row) ? row : [row])]);
  
  // Matrix operations for OLS (X'X)^(-1)X'y
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
  
  // Calculate SST and R^2
  const yMean = mean(y);
  const sst = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
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
  
  // For larger matrices, use a numerical method like Gaussian elimination
  return gaussianElimination(A);
}

// Gaussian elimination for matrix inversion
function gaussianElimination(A) {
  const n = A.length;
  const result = Array(n).fill().map((_, i) => {
    const row = Array(n).fill(0);
    row[i] = 1;
    return row;
  });
  
  // Create a copy of A to avoid modifying the original
  const augmented = A.map((row, i) => [...row, ...result[i]]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let max = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[max][i])) {
        max = j;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[max]] = [augmented[max], augmented[i]];
    
    // Singular matrix check
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }
    
    // Divide row by pivot
    const pivot = augmented[i][i];
    for (let j = i; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate other rows
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = i; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
  }
  
  // Extract the inverse
  return augmented.map(row => row.slice(n));
}

// Calculate mean of an array
function mean(data) {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

// Calculate standard deviation of an array
function standardDeviation(data, dataMean = undefined) {
  const m = dataMean !== undefined ? dataMean : mean(data);
  const variance = data.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) / data.length;
  return Math.sqrt(variance);
}

// Calculate Shapiro-Wilk test for normality
function calculateShapiroWilk(data) {
  // Simple implementation of Shapiro-Wilk test
  const n = data.length;
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Calculate Shapiro-Wilk W statistic
  
  // For a simpler approach, use normal probability plot correlation coefficient
  // This is an approximation of Shapiro-Wilk for educational purposes
  const ranks = Array(n).fill(0).map((_, i) => (i + 1) / (n + 1));
  const zScores = ranks.map(r => normalQuantile(r));
  
  // Calculate correlation between sorted data and z-scores
  const correlation = pearsonCorrelation(sortedData, zScores);
  const wStatistic = correlation * correlation;
  
  // Calculate p-value (simplified approximation)
  // In practice, this would involve more complex calculations
  const pValue = approximateShapiroWilkPValue(wStatistic, n);
  
  return {
    testName: "Shapiro-Wilk",
    statistic: wStatistic,
    pValue: pValue,
    isNormal: pValue > 0.05,
    criticalValue: 0.05
  };
}

// Normal quantile function (approximation of inverse cumulative normal distribution)
function normalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  
  // Approximation for 0.001 < p < 0.999
  if (p < 0.5) {
    return -approxNormalQuantile(1 - p);
  }
  
  // Abramowitz and Stegun approximation
  const y = Math.sqrt(-2 * Math.log(1 - p));
  return y - (2.515517 + 0.802853 * y + 0.010328 * y * y) / 
         (1 + 1.432788 * y + 0.189269 * y * y + 0.001308 * y * y * y);
}

// Approximate normal quantile helper
function approxNormalQuantile(p) {
  const y = Math.sqrt(-2 * Math.log(p));
  return y - (2.515517 + 0.802853 * y + 0.010328 * y * y) / 
         (1 + 1.432788 * y + 0.189269 * y * y + 0.001308 * y * y * y);
}

// Pearson correlation coefficient
function pearsonCorrelation(x, y) {
  const n = x.length;
  const xMean = mean(x);
  const yMean = mean(y);
  
  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  return numerator / Math.sqrt(xDenom * yDenom);
}

// Simple approximation of Shapiro-Wilk p-value
function approximateShapiroWilkPValue(w, n) {
  // This is a very simplified approximation
  // In practice, calculating the exact p-value is more complex
  const z = (1 - w) * Math.sqrt(n);
  return 1 - normalCDF(z);
}

// Normal cumulative distribution function
function normalCDF(x) {
  if (x < -10) return 0;
  if (x > 10) return 1;
  
  // Approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (x > 0) {
    p = 1 - p;
  }
  
  return p;
}

// Calculate Kolmogorov-Smirnov test for normality
function calculateKolmogorovSmirnov(data) {
  const n = data.length;
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Calculate mean and standard deviation
  const dataMean = mean(sortedData);
  const dataStdDev = standardDeviation(sortedData, dataMean);
  
  // Calculate empirical CDF and theoretical normal CDF
  let maxDifference = 0;
  
  for (let i = 0; i < n; i++) {
    const value = sortedData[i];
    const empiricalCDF = (i + 1) / n;
    const theoreticalCDF = normalCDF((value - dataMean) / dataStdDev);
    
    // Find maximum difference
    const difference = Math.abs(empiricalCDF - theoreticalCDF);
    if (difference > maxDifference) {
      maxDifference = difference;
    }
  }
  
  // Calculate p-value (simplified approximation)
  // Lilliefors correction for normality test
  const pValue = approximateKSPValue(maxDifference, n);
  
  return {
    testName: "Kolmogorov-Smirnov",
    statistic: maxDifference,
    pValue: pValue,
    isNormal: pValue > 0.05,
    criticalValue: 0.05
  };
}

// Simple approximation of K-S p-value with Lilliefors correction
function approximateKSPValue(d, n) {
  // This is an approximation of Lilliefors table
  // For a more accurate approach, use a lookup table or better approximation
  const sqrtN = Math.sqrt(n);
  const adjustedD = d * (sqrtN - 0.01 + 0.85 / sqrtN);
  
  if (adjustedD < 0.5) return 0.9;
  if (adjustedD < 0.6) return 0.6;
  if (adjustedD < 0.7) return 0.3;
  if (adjustedD < 0.8) return 0.1;
  if (adjustedD < 0.9) return 0.05;
  if (adjustedD < 1.0) return 0.01;
  return 0.001;
}

// Calculate Jarque-Bera test for normality
function calculateJarqueBera(data) {
  const n = data.length;
  
  // Calculate mean
  const dataMean = mean(data);
  
  // Calculate standard deviation
  const dataStdDev = standardDeviation(data, dataMean);
  
  // Calculate skewness
  let sumCubed = 0;
  for (let i = 0; i < n; i++) {
    sumCubed += Math.pow((data[i] - dataMean) / dataStdDev, 3);
  }
  const skewness = sumCubed / n;
  
  // Calculate kurtosis
  let sumFourth = 0;
  for (let i = 0; i < n; i++) {
    sumFourth += Math.pow((data[i] - dataMean) / dataStdDev, 4);
  }
  const kurtosis = sumFourth / n;
  
  // Calculate Jarque-Bera statistic
  const jbStatistic = n / 6 * (Math.pow(skewness, 2) + Math.pow(kurtosis - 3, 2) / 4);
  
  // Calculate p-value (chi-squared with 2 degrees of freedom)
  const pValue = 1 - chiSquareCDF(jbStatistic, 2);
  
  return {
    testName: "Jarque-Bera",
    statistic: jbStatistic,
    skewness: skewness,
    kurtosis: kurtosis,
    pValue: pValue,
    isNormal: pValue > 0.05,
    criticalValue: 0.05
  };
}

// Chi-squared cumulative distribution function
function chiSquareCDF(x, df) {
  if (x <= 0) return 0;
  
  // Approximation for chi-squared CDF
  // This is simplified - more accurate implementations exist
  const p = Math.exp(-0.5 * x) * Math.pow(x, df / 2 - 1) / (Math.pow(2, df / 2) * gamma(df / 2));
  return 1 - p;
}

// Simple gamma function approximation for integer and half-integer values
function gamma(z) {
  // For integer values
  if (Math.floor(z) === z) {
    if (z <= 0) return Infinity;
    let result = 1;
    for (let i = 2; i < z; i++) {
      result *= i;
    }
    return result;
  }
  
  // For half-integer values
  if (Math.floor(2 * z) === 2 * z) {
    const n = Math.floor(z);
    if (z === 0.5) return Math.sqrt(Math.PI);
    return Math.sqrt(Math.PI) * factorialProduct(1, n - 0.5) / Math.pow(2, n - 0.5);
  }
  
  // For other values (more complex approximation would be needed)
  return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
}

// Helper for factorial product
function factorialProduct(start, end) {
  let product = 1;
  for (let i = start; i <= end; i += 0.5) {
    product *= i;
  }
  return product;
}

// Generate histogram data from residuals
function generateHistogramData(data, bins = 10) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const binWidth = range / bins;
  
  // Initialize bins
  const histogram = Array(bins).fill(0);
  const binLabels = Array(bins).fill(0).map((_, i) => min + i * binWidth);
  
  // Count values in each bin
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  }
  
  // Calculate density for normal curve
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const stdDev = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
  
  const normalCurve = binLabels.map(x => ({
    x: x + binWidth / 2, // Center of bin
    y: (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
  }));
  
  // Normalize histogram to have same area as normal curve
  const histTotal = histogram.reduce((sum, val) => sum + val, 0) * binWidth;
  const normalizedHistogram = histogram.map(count => count / histTotal);
  
  return {
    bins: binLabels.map((binStart, i) => ({
      x: binStart + binWidth / 2, // Center of bin
      y: normalizedHistogram[i],
      count: histogram[i],
      start: binStart,
      end: binStart + binWidth
    })),
    normalCurve,
    binWidth,
    mean,
    stdDev
  };
}

// Generate QQ plot data from residuals
function generateQQPlotData(data) {
  const n = data.length;
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Calculate theoretical quantiles
  const qqPoints = sortedData.map((value, i) => {
    const p = (i + 0.5) / n; // Midpoint plotting position
    const z = normalQuantile(p);
    return { observed: value, theoretical: z };
  });
  
  return qqPoints;
} 