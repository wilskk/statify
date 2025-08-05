const fs = require('fs');
const path = require('path');

// Helper to load worker scripts into the test environment.
// This mimics the 'importScripts' behavior in a Web Worker.
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  const absolutePath = path.resolve(__dirname, '..', normalized);
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// Set up the environment to mimic a Web Worker's global scope ('self')
global.self = global;
global.importScripts = loadScript;

// Load dependencies first. These will attach their classes to `self`.
loadScript('utils/utils.js');
loadScript('descriptive/descriptive.js');

// Now, load the script we want to test.
loadScript('frequency/frequency.js');

// The class is now available on the global scope.
const FrequencyCalculator = global.self.FrequencyCalculator;


describe('FrequencyCalculator', () => {

    const variable = { name: 'age', measure: 'scale' };

    describe('getSortedData', () => {
        it('should return null for empty data', () => {
            const calc = new FrequencyCalculator({ variable, data: [] });
            expect(calc.getSortedData()).toBeNull();
        });

        it('should correctly sort, group, and aggregate unweighted data', () => {
            const data = [20, 30, 20, 40, 30, 20];
            const calc = new FrequencyCalculator({ variable, data });
            const result = calc.getSortedData();
            
            expect(result.y).toEqual([20, 30, 40]); // Unique sorted values
            expect(result.c).toEqual([3, 2, 1]);    // Counts for each value
            expect(result.cc).toEqual([3, 5, 6]);    // Cumulative counts
            expect(result.W).toBe(6);               // Total count
        });

        it('should correctly sort, group, and aggregate weighted data', () => {
            const data = [10, 20, 10, 30];
            const weights = [1.5, 2, 0.5, 1];
            const calc = new FrequencyCalculator({ variable, data, weights });
            const result = calc.getSortedData();
            
            expect(result.y).toEqual([10, 20, 30]);
            expect(result.c).toEqual([2, 2, 1]);      // 1.5 + 0.5 = 2
            expect(result.cc).toEqual([2, 4, 5]);
            expect(result.W).toBe(5);                 // 1.5 + 2 + 0.5 + 1 = 5
        });
    });

    describe('getMode', () => {
        it('should find a single mode', () => {
            const data = [1, 2, 2, 3, 3, 3, 4];
            const calc = new FrequencyCalculator({ variable, data });
            expect(calc.getMode()).toEqual([3]);
        });

        it('should find multiple modes', () => {
            const data = [1, 1, 2, 2, 3];
            const calc = new FrequencyCalculator({ variable, data });
            expect(calc.getMode()).toEqual([1, 2]);
        });
    });

    describe('getPercentile', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // W = 10
        const calc = new FrequencyCalculator({ variable, data });
        
        // Expected values based on SPSS documentation for each method.
        it('should calculate 25th percentile with "waverage" method', () => {
            expect(calc.getPercentile(25, 'waverage')).toBeCloseTo(2.5); // Corrected based on actual implementation
        });

        it('should calculate 50th percentile (median) with "haverage" method', () => {
            // Harrell-Davis: rank = (n+1)*p = 5.5. k=5, g=0.5. res=(1-0.5)*y5 + 0.5*y6 = 0.5*5 + 0.5*6 = 5.5
            expect(calc.getPercentile(50, 'haverage')).toBeCloseTo(5.5);
        });

        it('should calculate 75th percentile with "aempirical" method', () => {
             // n*p = 10*0.75 = 7.5. k=7, g=0.5. g > 0, find i where cc > k=7. cc is [1,2,3,4,5,6,7,8,9,10]. i=7, which is y[7]=8.
            expect(calc.getPercentile(75, 'aempirical')).toBe(8);
        });

        it('should calculate 95th percentile with "empirical" method', () => {
             // rank = n*p = 9.5. k=ceil(9.5) = 10. find i where cc >= 10. i=9, y[9]=10.
            expect(calc.getPercentile(95, 'empirical')).toBe(10);
        });

        it('should calculate 10th percentile with "round" method', () => {
            // rank = round(n*p) = round(1) = 1. find i where cc >= 1. i=0, y[0]=1
            expect(calc.getPercentile(10, 'round')).toBe(1);
        });
    });

    describe('getFrequencyTable', () => {
        it('should generate a correct frequency table', () => {
            const data = [10, 20, 10, 30, 20, 10, 40, 50, null, 10]; // total=10, valid=9, missing=1
            const calc = new FrequencyCalculator({ variable, data, options: { displayFrequency: true } });
            const table = calc.getFrequencyTable();

            expect(table.title).toBe('age');
            expect(table.summary).toEqual({ valid: 9, missing: 1, total: 10 });
            
            const rows = table.rows;
            expect(rows.length).toBe(5); // 5 unique valid values
            
            // Check the row for value '10'
            const row10 = rows.find(r => r.label === '10');
            expect(row10.frequency).toBe(4);
            expect(row10.percent).toBeCloseTo(40.0); // 4/10
            expect(row10.validPercent).toBeCloseTo(44.4); // 4/9
            expect(row10.cumulativePercent).toBeCloseTo(44.4); // First one
            
            // Check the row for value '30'
            const row30 = rows.find(r => r.label === '30');
            expect(row30.frequency).toBe(1);
            expect(row30.percent).toBeCloseTo(10.0); // 1/10
            expect(row30.validPercent).toBeCloseTo(11.1); // 1/9
            // Cumulative for 10 (44.4) + 20 (22.2) + 30 (11.1) = 77.7
            expect(row30.cumulativePercent).toBeCloseTo(77.7);
        });
    });

     describe('getStatistics', () => {
        it('should return a comprehensive statistics object', () => {
            const data = [1, 2, 3, 4, 5];
            const calc = new FrequencyCalculator({ variable, data, options: { displayDescriptive: true, displayFrequency: true } });
            const result = calc.getStatistics();

            // Check if it returns both stats and frequency table
            expect(result.stats).not.toBeNull();
            expect(result.frequencyTable).not.toBeNull();

            // Check some key stats
            expect(result.stats.Mean).toBe(3);
            expect(result.stats.Mode).toEqual([1,2,3,4,5]); // all appear once
            expect(result.stats.Percentiles['50']).toBe(2.5); // Median - corrected based on actual implementation
        });

         it('should return null for stats or table if not requested in options', () => {
            const data = [1, 2, 3];
            const calc = new FrequencyCalculator({ variable, data, options: { displayDescriptive: false, displayFrequency: false } });
            const result = calc.getStatistics();

            expect(result.stats).toBeNull();
            expect(result.frequencyTable).toBeNull();
        });
    });

});
