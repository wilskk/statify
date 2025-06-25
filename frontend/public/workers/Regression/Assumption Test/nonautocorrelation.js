// Web Worker for Nonautocorrelation Testing in Regression Analysis
// Main method: Durbin-Watson test

// Listen for messages from the main thread
self.addEventListener('message', function(e) {
  const data = e.data;
  
  // Log received data
  console.log("[Worker] Received data for nonautocorrelation test:", {
    hasData: !!data,
    hasResiduals: data && Array.isArray(data.residuals),
    residualsLength: data?.residuals?.length,
    sampleResiduals: data?.residuals?.slice(0, 3)
  });
  
  if (!data || !data.residuals) {
    console.error("[Worker] Invalid input: residuals are required");
    self.postMessage({
      error: 'Invalid input: residuals are required'
    });
    return;
  }

  // Validate residuals array
  if (!Array.isArray(data.residuals)) {
    console.error("[Worker] Invalid input: residuals must be an array");
    self.postMessage({
      error: 'Invalid input: residuals must be an array'
    });
    return;
  }

  if (data.residuals.length < 2) {
    console.error("[Worker] Invalid input: at least 2 residuals are required");
    self.postMessage({
      error: 'Invalid input: at least 2 residuals are required for Durbin-Watson test'
    });
    return;
  }

  // Check for invalid values
  const hasInvalidValues = data.residuals.some(val => val === null || val === undefined || isNaN(val) || !isFinite(val));
  if (hasInvalidValues) {
    console.error("[Worker] Invalid values detected in residuals");
    self.postMessage({
      error: 'Invalid data: residuals contain null, undefined, NaN, or infinite values'
    });
    return;
  }

  try {
    console.log("[Worker] Starting Durbin-Watson calculation with valid residuals");
    const results = calculateDurbinWatson(data.residuals);
    console.log("[Worker] Calculation complete:", results);
    self.postMessage({ results });
  } catch (error) {
    console.error("[Worker] Error in nonautocorrelation test calculation:", error);
    self.postMessage({
      error: `Error in nonautocorrelation test: ${error.message}`
    });
  }
});

/**
 * Calculate the Durbin-Watson statistic for nonautocorrelation detection
 * 
 * @param {Array<number>} residuals - The residuals from regression model
 * @returns {Object} Results of the Durbin-Watson test
 */
function calculateDurbinWatson(residuals) {
  const n = residuals.length;
  
  if (n < 2) {
    throw new Error('At least 2 observations are required for Durbin-Watson test');
  }
  
  // Calculate Durbin-Watson statistic
  // DW = Σ(et - et-1)² / Σet²
  let sumDiffSquared = 0;
  let sumResidualSquared = 0;
  
  console.log("[Worker] Processing residuals:", {
    length: n,
    first3: residuals.slice(0, 3),
    last3: residuals.slice(-3)
  });
  
  // Sum of squared residuals
  for (let i = 0; i < n; i++) {
    sumResidualSquared += Math.pow(residuals[i], 2);
  }
  
  // Check if denominator is zero
  if (sumResidualSquared === 0) {
    console.error("[Worker] Sum of squared residuals is zero, cannot calculate DW statistic");
    throw new Error('Sum of squared residuals is zero, cannot calculate Durbin-Watson statistic');
  }
  
  // Sum of squared differences between consecutive residuals
  for (let i = 1; i < n; i++) {
    sumDiffSquared += Math.pow(residuals[i] - residuals[i-1], 2);
  }
  
  const dwStatistic = sumDiffSquared / sumResidualSquared;
  
  console.log("[Worker] Calculation details:", {
    sumDiffSquared,
    sumResidualSquared,
    dwStatistic
  });
  
  // Interpret the Durbin-Watson statistic
  // DW ≈ 2: No autocorrelation
  // DW < 2: Positive autocorrelation
  // DW > 2: Negative autocorrelation
  // Typically 1.5 < DW < 2.5 suggests no autocorrelation
  let interpretation = '';
  
  if (dwStatistic < 1.5) {
    interpretation = 'Positive autocorrelation detected (nonautocorrelation assumption violated)';
  } else if (dwStatistic > 2.5) {
    interpretation = 'Negative autocorrelation detected (nonautocorrelation assumption violated)';
  } else {
    interpretation = 'No autocorrelation detected (nonautocorrelation assumption met)';
  }
  
  return {
    durbinWatsonStatistic: dwStatistic,
    interpretation: interpretation,
    nObservations: n,
    // For reference: exact bounds depend on n and k, these are approximations
    lowerBound: 1.5,
    upperBound: 2.5
  };
}
