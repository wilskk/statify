/**
 * Tests for Chi-Square implementation
 */

const { 
    calculateChiSquare, 
    calculateExpectedFrequencies,
    generateDescriptiveStatistics,
    generateFrequencyTable
} = require('../chiSquare');

describe('Chi-Square Test Functions', () => {
    describe('calculateChiSquare', () => {
        test('should calculate chi-square statistic correctly', () => {
            // Example from a typical chi-square test
            const observed = [20, 40, 30, 10];
            const expected = [25, 25, 25, 25];
            
            const result = calculateChiSquare(observed, expected);
            
            expect(result).toHaveProperty('chiSquare');
            expect(result).toHaveProperty('df');
            expect(result).toHaveProperty('pValue');
            expect(result).toHaveProperty('significant');
            
            // Chi-square value should be (20-25)²/25 + (40-25)²/25 + (30-25)²/25 + (10-25)²/25 = 20
            expect(result.chiSquare).toBeCloseTo(20, 1);
            expect(result.df).toBe(3);
            // p-value for chi-square = 20, df = 3 is approximately 0.0002
            expect(result.pValue).toBeLessThan(0.001);
            expect(result.significant).toBe(true);
        });
        
        test('should handle zero expected frequencies', () => {
            const observed = [10, 20, 0];
            const expected = [10, 20, 0];
            
            const result = calculateChiSquare(observed, expected);
            
            // Degrees of freedom should be reduced by 1 due to zero expected frequency
            expect(result.df).toBe(1);
        });
        
        test('should throw error for invalid inputs', () => {
            expect(() => calculateChiSquare(null, [1, 2, 3])).toThrow();
            expect(() => calculateChiSquare([1, 2, 3], null)).toThrow();
            expect(() => calculateChiSquare([1, 2, 3], [1, 2])).toThrow();
        });
    });
    
    describe('calculateExpectedFrequencies', () => {
        test('should calculate equal expected frequencies when allCategoriesEqual is true', () => {
            const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
            const options = {
                allCategoriesEqual: true,
                values: [],
                getFromData: false,
                useSpecificRange: false
            };
            
            const result = calculateExpectedFrequencies(data, options);
            
            // 10 data points, 4 categories = 2.5 expected per category
            expect(result).toEqual([2.5, 2.5, 2.5, 2.5]);
        });
        
        test('should use provided values when values option is provided', () => {
            const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
            const options = {
                allCategoriesEqual: false,
                values: [1, 2, 3, 4],
                getFromData: false,
                useSpecificRange: false
            };
            
            const result = calculateExpectedFrequencies(data, options);
            
            // Total is 10, sum of values is 10, so expected should match values
            expect(result[0]).toBeCloseTo(1, 1);
            expect(result[1]).toBeCloseTo(2, 1);
            expect(result[2]).toBeCloseTo(3, 1);
            expect(result[3]).toBeCloseTo(4, 1);
        });
        
        test('should filter data based on range if useSpecificRange is true', () => {
            const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
            const options = {
                allCategoriesEqual: true,
                values: [],
                getFromData: false,
                useSpecificRange: true,
                lowerValue: 1,
                upperValue: 2
            };
            
            const result = calculateExpectedFrequencies(data, options);
            
            // Only values 1 and 2 should be included, total 3 data points
            expect(result).toEqual([1.5, 1.5]);
        });
    });
    
    describe('generateDescriptiveStatistics', () => {
        test('should calculate descriptive statistics correctly', () => {
            const data = [1, 2, 3, 4, 5];
            const result = generateDescriptiveStatistics(data, 'TestVar');
            
            expect(result.variable).toBe('TestVar');
            expect(result.n).toBe(5);
            expect(result.mean).toBe(3);
            expect(result.median).toBe(3);
            expect(result.min).toBe(1);
            expect(result.max).toBe(5);
            expect(result.range).toBe(4);
        });
        
        test('should handle empty data', () => {
            const data = [];
            const result = generateDescriptiveStatistics(data, 'EmptyVar');
            
            expect(result.n).toBe(0);
            expect(result.mean).toBeNull();
            expect(result.median).toBeNull();
        });
    });
    
    describe('generateFrequencyTable', () => {
        test('should generate frequency table correctly', () => {
            const data = [1, 2, 2, 3, 3, 3];
            const expected = [1, 2, 3];
            const result = generateFrequencyTable(data, 'TestVar', expected);
            
            expect(result.variable).toBe('TestVar');
            expect(result.categories).toEqual(['1', '2', '3']);
            expect(result.observed).toEqual([1, 2, 3]);
            expect(result.expected).toEqual([1, 2, 3]);
            
            // Residuals should be (observed - expected) / sqrt(expected)
            expect(result.residuals[0]).toBeCloseTo(0, 2);
            expect(result.residuals[1]).toBeCloseTo(0, 2);
            expect(result.residuals[2]).toBeCloseTo(0, 2);
        });
        
        test('should handle missing expected frequencies', () => {
            const data = [1, 2, 2, 3, 3, 3];
            const result = generateFrequencyTable(data, 'TestVar');
            
            expect(result.expected).toEqual([]);
            expect(result.residuals).toEqual([]);
        });
    });
}); 