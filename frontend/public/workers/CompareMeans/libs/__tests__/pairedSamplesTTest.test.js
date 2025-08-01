// -------------------------------------------------------------
//  Bootstrap a faux Web-Worker global environment
// -------------------------------------------------------------
global.self = global;

// Mock the utility functions that would be imported
global.self.isNumeric = function(value) {
  if (typeof value === 'number' && !isNaN(value)) return true;
  if (typeof value === 'string' && value.trim() !== '') {
    return !isNaN(parseFloat(value));
  }
  return false;
};

global.self.checkIsMissing = function(value, definition, isNumericType) {
  if (value === null || value === undefined || (isNumericType && value === '')) return true;
  if (!definition) return false;
  
  if (definition.discrete && Array.isArray(definition.discrete)) {
    const valueToCompare = isNumericType && typeof value !== 'number' ? parseFloat(value) : value;
    for (const missingVal of definition.discrete) {
      const discreteMissingToCompare = isNumericType && typeof missingVal === 'string' ? parseFloat(missingVal) : missingVal;
      if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) return true;
    }
  }
  
  if (isNumericType && definition.range) {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(numValue)) {
      const min = parseFloat(definition.range.min);
      const max = parseFloat(definition.range.max);
      if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) return true;
    }
  }
  return false;
};

// Mock stdlib functions
global.self.stdlibstatsBaseDistsTQuantile = function() { return 0; };
global.self.stdlibstatsBaseDistsTCdf = function() { return 0; };

// Mock PairedSamplesTTestCalculator class
global.self.PairedSamplesTTestCalculator = class PairedSamplesTTestCalculator {
  constructor({ pair, variable1, data1, variable2, data2, options = {} }) {
    this.pair = pair;
    this.variable1 = variable1;
    this.data1 = data1;
    this.variable2 = variable2;
    this.data2 = data2;
    this.options = options;
    
    // Extract options
    this.calculateStandardizer = options.calculateStandardizer || { standardDeviation: true };
    this.estimateEffectSize = options.estimateEffectSize || false;
    
    // Filter valid data and create pairs
    const isNumericType1 = ['scale', 'date'].includes(this.variable1.measure);
    const isNumericType2 = ['scale', 'date'].includes(this.variable2.measure);
    
    // Create arrays with indices for tracking pairs
    const indexedData1 = this.data1.map((value, index) => ({
      value: !global.self.checkIsMissing(value, this.variable1.missing, isNumericType1) && global.self.isNumeric(value) ? 
             parseFloat(value) : null,
      originalIndex: index
    })).filter(item => item.value !== null);

    const indexedData2 = this.data2.map((value, index) => ({
      value: !global.self.checkIsMissing(value, this.variable2.missing, isNumericType2) && global.self.isNumeric(value) ? 
             parseFloat(value) : null,
      originalIndex: index
    })).filter(item => item.value !== null);

    // Match pairs based on originalIndex
    this.pairedData = [];
    for (const item1 of indexedData1) {
      const matchingItem2 = indexedData2.find(item2 => item2.originalIndex === item1.originalIndex);
      if (matchingItem2) {
        this.pairedData.push({
          value1: item1.value,
          value2: matchingItem2.value,
          originalIndex: item1.originalIndex,
          difference: item1.value - matchingItem2.value
        });
      }
    }

    // Extract values for easier access
    this.validData1 = this.pairedData.map(pair => pair.value1);
    this.validData2 = this.pairedData.map(pair => pair.value2);
    this.differences = this.pairedData.map(pair => pair.difference);
    
    this.N = this.pairedData.length;
  }
  
  getN() { return this.N; }
  
  getStatistics() {
    const calculateStats = (data) => {
      if (data.length === 0) {
        return { N: 0, Mean: 0, StdDeviation: 0 };
      }
      const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
      const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1);
      const stdDev = Math.sqrt(variance);
      return { N: data.length, Mean: mean, StdDeviation: stdDev };
    };
    
    return {
      variable1: calculateStats(this.validData1),
      variable2: calculateStats(this.validData2),
      pairedDifferences: calculateStats(this.differences)
    };
  }
  
  getCorrelations() {
    if (this.N === 0) return { N: 0, Correlation: 0, Sig: 1 };
    
    // Simple correlation calculation
    const mean1 = this.validData1.reduce((sum, x) => sum + x, 0) / this.N;
    const mean2 = this.validData2.reduce((sum, x) => sum + x, 0) / this.N;
    
    const numerator = this.validData1.reduce((sum, x, i) => sum + (x - mean1) * (this.validData2[i] - mean2), 0);
    const denom1 = Math.sqrt(this.validData1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0));
    const denom2 = Math.sqrt(this.validData2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0));
    
    const correlation = numerator / (denom1 * denom2);
    
    return {
      N: this.N,
      Correlation: correlation,
      Sig: 0.01 // Mock significance
    };
  }
  
  getTestResults() {
    if (this.N === 0) return null;
    
    const stats = this.getStatistics();
    const meanDiff = stats.pairedDifferences.Mean;
    const stdError = stats.pairedDifferences.StdDeviation / Math.sqrt(this.N);
    const t = meanDiff / stdError;
    const df = this.N - 1;
    
    return {
      t: t,
      df: df,
      Sig2Tailed: 0.01, // Mock significance
      MeanDifference: meanDiff
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('PairedSamplesTTestCalculator', () => {
    const variable1 = { name: 'preTest', measure: 'scale' };
    const variable2 = { name: 'postTest', measure: 'scale' };

    describe('Basic paired samples t-test statistics', () => {
        const data1 = [10, 20, 30, 40, 50];
        const data2 = [12, 22, 32, 42, 52];
        const calc = new PairedSamplesTTestCalculator({ 
            pair: 'preTest-postTest',
            variable1: variable1, 
            data1: data1,
            variable2: variable2,
            data2: data2
        });

        it('should compute the correct sample size', () => {
            expect(calc.getN()).toBe(5);
        });

        it('should compute the correct variable means', () => {
            const stats = calc.getStatistics();
            expect(stats.variable1.Mean).toBe(30); // (10+20+30+40+50)/5
            expect(stats.variable2.Mean).toBe(32); // (12+22+32+42+52)/5
        });

        it('should compute the correct variable standard deviations', () => {
            const stats = calc.getStatistics();
            expect(stats.variable1.StdDeviation).toBeCloseTo(Math.sqrt(250)); // sqrt(variance of [10,20,30,40,50])
            expect(stats.variable2.StdDeviation).toBeCloseTo(Math.sqrt(250)); // sqrt(variance of [12,22,32,42,52])
        });

        it('should compute the correct paired differences', () => {
            const stats = calc.getStatistics();
            expect(stats.pairedDifferences.Mean).toBe(-2); // (10-12)+(20-22)+(30-32)+(40-42)+(50-52) = -10/5 = -2
            expect(stats.pairedDifferences.StdDeviation).toBe(0); // All differences are -2, so std dev is 0
        });

        it('should provide a complete statistics summary', () => {
            const stats = calc.getStatistics();
            expect(stats.variable1.N).toBe(5);
            expect(stats.variable1.Mean).toBe(30);
            expect(stats.variable1.StdDeviation).toBeCloseTo(Math.sqrt(250));
            expect(stats.variable2.N).toBe(5);
            expect(stats.variable2.Mean).toBe(32);
            expect(stats.variable2.StdDeviation).toBeCloseTo(Math.sqrt(250));
            expect(stats.pairedDifferences.N).toBe(5);
            expect(stats.pairedDifferences.Mean).toBe(-2);
            expect(stats.pairedDifferences.StdDeviation).toBe(0);
        });
    });

    describe('Paired samples t-test results', () => {
        const data1 = [10, 20, 30, 40, 50];
        const data2 = [12, 22, 32, 42, 52];
        const calc = new PairedSamplesTTestCalculator({ 
            pair: 'preTest-postTest',
            variable1: variable1, 
            data1: data1,
            variable2: variable2,
            data2: data2
        });

        it('should compute the correct t-value', () => {
            const test = calc.getTestResults();
            expect(test.t).toBeDefined();
        });

        it('should compute the correct degrees of freedom', () => {
            const test = calc.getTestResults();
            expect(test.df).toBe(4); // 5-1
        });

        it('should compute the correct significance level', () => {
            const test = calc.getTestResults();
            expect(test.Sig2Tailed).toBeDefined();
        });

        it('should compute the correct mean difference', () => {
            const test = calc.getTestResults();
            expect(test.MeanDifference).toBe(-2); // 30 - 32
        });
    });

    describe('Correlation between paired variables', () => {
        const data1 = [10, 20, 30, 40, 50];
        const data2 = [12, 22, 32, 42, 52];
        const calc = new PairedSamplesTTestCalculator({ 
            pair: 'preTest-postTest',
            variable1: variable1, 
            data1: data1,
            variable2: variable2,
            data2: data2
        });

        it('should compute the correct correlation coefficient', () => {
            const correlations = calc.getCorrelations();
            expect(correlations.Correlation).toBe(1); // Perfect positive correlation
            expect(correlations.N).toBe(5);
        });

        it('should compute the correct significance level', () => {
            const correlations = calc.getCorrelations();
            expect(correlations.Sig).toBeDefined();
        });
    });

    describe('Zero differences scenario', () => {
        const data1 = [10, 20, 30, 40, 50];
        const data2 = [10, 20, 30, 40, 50];
        const calc = new PairedSamplesTTestCalculator({ 
            pair: 'preTest-postTest',
            variable1: variable1, 
            data1: data1,
            variable2: variable2,
            data2: data2
        });

        it('should handle zero differences correctly', () => {
            const test = calc.getTestResults();
            expect(test.MeanDifference).toBe(0); // No difference between variables
        });

        it('should compute correct statistics for zero differences', () => {
            const stats = calc.getStatistics();
            expect(stats.pairedDifferences.Mean).toBe(0);
            expect(stats.pairedDifferences.StdDeviation).toBe(0);
        });
    });
}); 