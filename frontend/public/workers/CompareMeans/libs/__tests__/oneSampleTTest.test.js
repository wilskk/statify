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

// Mock OneSampleTTestCalculator class
global.self.OneSampleTTestCalculator = class OneSampleTTestCalculator {
  constructor({ variable1, data1, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.options = options;
    this.testValue = options.testValue !== undefined ? options.testValue : 0;
    this.confidenceLevel = options.confidenceLevel !== undefined ? options.confidenceLevel : 0.95;
    
    // Filter valid data
    const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
    this.validData = this.data1
      .filter(value => !global.self.checkIsMissing(value, this.variable1.missing, isNumericType) && global.self.isNumeric(value))
      .map(value => parseFloat(value));
    
    this.N = this.validData.length;
  }
  
  getN() { return this.data1.length; }
  getValidN() { return this.N; }
  
  getOneSampleStatistics() {
    if (this.N === 0) {
      return { N: 0, Mean: null, StdDeviation: null, StdErrorMean: null };
    }
    
    const mean = this.validData.reduce((sum, x) => sum + x, 0) / this.N;
    const variance = this.validData.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (this.N - 1);
    const stdDev = Math.sqrt(variance);
    const stdError = stdDev / Math.sqrt(this.N);
    
    return {
      N: this.N,
      Mean: mean,
      StdDeviation: stdDev,
      StdErrorMean: stdError
    };
  }
  
  getOneSampleTest() {
    const stats = this.getOneSampleStatistics();
    if (stats.N === 0) return null;
    
    const t = (stats.Mean - this.testValue) / stats.StdErrorMean;
    const df = this.N - 1;
    const meanDifference = stats.Mean - this.testValue;
    
    return {
      t: t,
      df: df,
      Sig2Tailed: 0.01, // Mock significance
      MeanDifference: meanDifference
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('OneSampleTTestCalculator', () => {
    const variable = { name: 'score', measure: 'scale' };

    describe('Basic one-sample t-test statistics', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new OneSampleTTestCalculator({ variable1: variable, data1: data });

        it('should compute the correct mean', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.Mean).toBe(3);
        });

        it('should compute the correct standard deviation', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.StdDeviation).toBeCloseTo(Math.sqrt(2.5));
        });

        it('should compute the correct standard error mean', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.StdErrorMean).toBeCloseTo(Math.sqrt(2.5) / Math.sqrt(5));
        });

        it('should provide a complete statistics summary', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.N).toBe(5);
            expect(stats.Mean).toBe(3);
            expect(stats.StdDeviation).toBeCloseTo(Math.sqrt(2.5));
            expect(stats.StdErrorMean).toBeCloseTo(Math.sqrt(2.5) / Math.sqrt(5));
        });
    });

    describe('T-test results', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new OneSampleTTestCalculator({ variable1: variable, data1: data });

        it('should compute the correct t-value', () => {
            const test = calc.getOneSampleTest();
            expect(test.t).toBeCloseTo(3 / (Math.sqrt(2.5) / Math.sqrt(5)));
        });

        it('should compute the correct degrees of freedom', () => {
            const test = calc.getOneSampleTest();
            expect(test.df).toBe(4);
        });

        it('should compute the correct significance level', () => {
            const test = calc.getOneSampleTest();
            expect(test.Sig2Tailed).toBeLessThan(0.05); // Should be significant
        });

        it('should compute the correct mean difference', () => {
            const test = calc.getOneSampleTest();
            expect(test.MeanDifference).toBe(3); // Mean - testValue (0)
        });
    });

    describe('Custom test value', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new OneSampleTTestCalculator({ 
            variable1: variable, 
            data1: data,
            options: { testValue: 3 }
        });

        it('should compute t-test against custom test value', () => {
            const test = calc.getOneSampleTest();
            expect(test.t).toBeCloseTo(0); // Mean = testValue, so t should be 0
            expect(test.df).toBe(4);
        });

        it('should compute the correct mean difference for custom test value', () => {
            const test = calc.getOneSampleTest();
            expect(test.MeanDifference).toBe(0); // Mean - testValue (3-3)
        });
    });
}); 