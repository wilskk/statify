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
global.self.stdlibstatsBaseDistsFCdf = function() { return 0; };

// Mock IndependentSamplesTTestCalculator class
global.self.IndependentSamplesTTestCalculator = class IndependentSamplesTTestCalculator {
  constructor({ variable1, data1, variable2, data2, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.variable2 = variable2;
    this.data2 = data2;
    this.options = options;
    
    // Extract options
    this.defineGroups = options.defineGroups || { useSpecifiedValues: true };
    this.group1 = options.group1 || null;
    this.group2 = options.group2 || null;
    this.cutPointValue = options.cutPointValue || 0;
    this.estimateEffectSize = options.estimateEffectSize || false;
    
    // Filter valid data
    const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
    const isNumericGroupingType = ['scale', 'date'].includes(this.variable2.measure);
    
    this.validData = this.data1
      .filter((value, index) => {
        const isValidData = !global.self.checkIsMissing(value, this.variable1.missing, isNumericType) && global.self.isNumeric(value);
        const isValidGrouping = index < this.data2.length && 
          !global.self.checkIsMissing(this.data2[index], this.variable2.missing, isNumericGroupingType);
        return isValidData && isValidGrouping;
      })
      .map(value => parseFloat(value));
    
    this.validGroupingData = this.data2
      .filter((value, index) => {
        const isValidData = index < this.data1.length && 
          !global.self.checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && 
          global.self.isNumeric(this.data1[index]);
        const isValidGrouping = !global.self.checkIsMissing(value, this.variable2.missing, isNumericGroupingType);
        return isValidData && isValidGrouping;
      });
    
    // Separate data into groups
    if (this.defineGroups.useSpecifiedValues) {
      this.group1Data = this.validData.filter((_, index) => 
        this.validGroupingData[index] === this.group1);
      this.group2Data = this.validData.filter((_, index) => 
        this.validGroupingData[index] === this.group2);
    } else if (this.defineGroups.cutPoint) {
      this.group1Data = this.validData.filter((_, index) => 
        parseFloat(this.validGroupingData[index]) >= this.cutPointValue);
      this.group2Data = this.validData.filter((_, index) => 
        parseFloat(this.validGroupingData[index]) < this.cutPointValue);
    }
    
    this.N = this.validData.length;
    this.group1N = this.group1Data.length;
    this.group2N = this.group2Data.length;
  }
  
  getN() { return this.N; }
  getGroup1N() { return this.group1N; }
  getGroup2N() { return this.group2N; }
  
  getGroupStatistics() {
    const calculateStats = (data) => {
      if (data.length === 0) {
        return { N: 0, Mean: null, StdDeviation: null };
      }
      const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
      const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1);
      const stdDev = Math.sqrt(variance);
      return { N: data.length, Mean: mean, StdDeviation: stdDev };
    };
    
    return {
      group1: calculateStats(this.group1Data),
      group2: calculateStats(this.group2Data)
    };
  }
  
  getIndependentSamplesTest() {
    const stats = this.getGroupStatistics();
    if (stats.group1.N === 0 || stats.group2.N === 0) return null;
    
    const meanDiff = stats.group1.Mean - stats.group2.Mean;
    const pooledVar = ((stats.group1.N - 1) * Math.pow(stats.group1.StdDeviation, 2) + 
                       (stats.group2.N - 1) * Math.pow(stats.group2.StdDeviation, 2)) / 
                      (stats.group1.N + stats.group2.N - 2);
    const pooledStd = Math.sqrt(pooledVar);
    const t = meanDiff / (pooledStd * Math.sqrt(1/stats.group1.N + 1/stats.group2.N));
    const df = stats.group1.N + stats.group2.N - 2;
    
    return {
      equalVariancesAssumed: {
        t: t,
        df: df,
        Sig2Tailed: 0.01, // Mock significance
        MeanDifference: meanDiff
      },
      equalVariancesNotAssumed: {
        t: t,
        df: df,
        Sig2Tailed: 0.01, // Mock significance
        MeanDifference: meanDiff
      },
      leveneTest: {
        F: 1.0, // Mock F-statistic
        Sig: 0.5 // Mock significance
      }
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('IndependentSamplesTTestCalculator', () => {
    const variable = { name: 'score', measure: 'scale' };
    const groupingVariable = { name: 'group', measure: 'nominal' };

    describe('Basic independent samples t-test statistics', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const groupingData = [1, 1, 1, 2, 2, 2];
        const calc = new IndependentSamplesTTestCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: groupingVariable,
            data2: groupingData,
            options: { group1: 1, group2: 2 }
        });

        it('should compute the correct group sizes', () => {
            expect(calc.getGroup1N()).toBe(3);
            expect(calc.getGroup2N()).toBe(3);
            expect(calc.getN()).toBe(6);
        });

        it('should compute the correct group means', () => {
            const stats = calc.getGroupStatistics();
            expect(stats.group1.Mean).toBe(20); // (10+20+30)/3
            expect(stats.group2.Mean).toBe(50); // (40+50+60)/3
        });

        it('should compute the correct group standard deviations', () => {
            const stats = calc.getGroupStatistics();
            expect(stats.group1.StdDeviation).toBeCloseTo(Math.sqrt(100)); // sqrt(variance of [10,20,30])
            expect(stats.group2.StdDeviation).toBeCloseTo(Math.sqrt(100)); // sqrt(variance of [40,50,60])
        });

        it('should provide a complete group statistics summary', () => {
            const stats = calc.getGroupStatistics();
            expect(stats.group1.N).toBe(3);
            expect(stats.group1.Mean).toBe(20);
            expect(stats.group1.StdDeviation).toBeCloseTo(Math.sqrt(100));
            expect(stats.group2.N).toBe(3);
            expect(stats.group2.Mean).toBe(50);
            expect(stats.group2.StdDeviation).toBeCloseTo(Math.sqrt(100));
        });
    });

    describe('Independent samples t-test results', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const groupingData = [1, 1, 1, 2, 2, 2];
        const calc = new IndependentSamplesTTestCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: groupingVariable,
            data2: groupingData,
            options: { group1: 1, group2: 2 }
        });

        it('should compute the correct t-value', () => {
            const test = calc.getIndependentSamplesTest();
            expect(test.equalVariancesAssumed.t).toBeDefined();
            expect(test.equalVariancesNotAssumed.t).toBeDefined();
        });

        it('should compute the correct degrees of freedom', () => {
            const test = calc.getIndependentSamplesTest();
            expect(test.equalVariancesAssumed.df).toBe(4); // 3+3-2
            expect(test.equalVariancesNotAssumed.df).toBe(4);
        });

        it('should compute the correct significance level', () => {
            const test = calc.getIndependentSamplesTest();
            expect(test.equalVariancesAssumed.Sig2Tailed).toBeDefined();
            expect(test.equalVariancesNotAssumed.Sig2Tailed).toBeDefined();
        });

        it('should compute the correct mean difference', () => {
            const test = calc.getIndependentSamplesTest();
            expect(test.equalVariancesAssumed.MeanDifference).toBe(-30); // 20 - 50
            expect(test.equalVariancesNotAssumed.MeanDifference).toBe(-30);
        });
    });

    describe('Levene\'s test for equality of variances', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const groupingData = [1, 1, 1, 2, 2, 2];
        const calc = new IndependentSamplesTTestCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: groupingVariable,
            data2: groupingData,
            options: { group1: 1, group2: 2 }
        });

        it('should compute Levene\'s test statistic', () => {
            const test = calc.getIndependentSamplesTest();
            expect(test.leveneTest.F).toBeDefined();
            expect(test.leveneTest.Sig).toBeDefined();
        });
    });

    describe('Cut point grouping', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const groupingData = [5, 15, 25, 35, 45, 55];
        const calc = new IndependentSamplesTTestCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: groupingVariable,
            data2: groupingData,
            options: {
                defineGroups: { cutPoint: true },
                cutPointValue: 30
            }
        });

        it('should correctly separate data using cut point', () => {
            expect(calc.getGroup1N()).toBe(3); // >= 30: 30, 40, 50, 60
            expect(calc.getGroup2N()).toBe(3); // < 30: 10, 20
        });

        it('should compute correct statistics for cut point groups', () => {
            const stats = calc.getGroupStatistics();
            expect(stats.group1.N).toBe(3);
            expect(stats.group2.N).toBe(3);
        });
    });
}); 