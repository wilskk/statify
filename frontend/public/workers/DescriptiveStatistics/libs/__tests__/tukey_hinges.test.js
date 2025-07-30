// Test untuk implementasi Tukey's Hinges
// File: tukey_hinges.test.js

const fs = require('fs');
const path = require('path');

/* global importScripts, FrequencyCalculator */

// Fungsi helper untuk load scripts (untuk testing di Node.js)
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  const absolutePath = path.resolve(__dirname, '../', normalized);
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// Setup environment
global.self = global;
global.importScripts = loadScript;

// Load dependencies
loadScript('utils/utils.js');
loadScript('descriptive/descriptive.js');
loadScript('frequency/frequency.js');

const FrequencyCalculator = global.self.FrequencyCalculator;

console.log('=== Test Tukey\'s Hinges Implementation ===\n');

// Test Case 1: Data sederhana untuk verifikasi rumus
console.log('Test 1: Data Sederhana [1,2,3,4,5,6,7,8,9,10]');
const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const calc1 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data1 
});

const sortedData1 = calc1.getSortedData();
console.log('Data:', data1);
console.log('W =', sortedData1.W);
console.log('c* = min(c) =', Math.min(...sortedData1.c));

// Hitung manual untuk verifikasi
const W1 = sortedData1.W;
const c_star1 = Math.min(...sortedData1.c);
const d1 = Math.floor((W1 + 3) / 2); // (10 + 3) / 2 = 6.5 -> 6
const L1_1 = d1; // 6
const L2_1 = W1 % 2 === 1 ? (W1 + 1) / 2 : W1 / 2 + 0.5; // 10/2 + 0.5 = 5.5
const L3_1 = W1 + 1 - d1; // 10 + 1 - 6 = 5

console.log('Manual calculation:');
console.log('d =', d1);
console.log('L1 =', L1_1, 'L2 =', L2_1, 'L3 =', L3_1);

console.log('\nTukey\'s Hinges results:');
console.log('Q1 (25th percentile):', calc1.getPercentile(25, 'tukeyhinges'));
console.log('Q2 (50th percentile):', calc1.getPercentile(50, 'tukeyhinges'));
console.log('Q3 (75th percentile):', calc1.getPercentile(75, 'tukeyhinges'));

console.log('\nPerbandingan dengan metode lain:');
console.log('Q1 waverage:', calc1.getPercentile(25, 'waverage'));
console.log('Q2 waverage:', calc1.getPercentile(50, 'waverage'));
console.log('Q3 waverage:', calc1.getPercentile(75, 'waverage'));
console.log('');

// Test Case 2: Data dengan bobot
console.log('Test 2: Data dengan Bobot');
const data2 = [1, 2, 3, 4, 5];
const weights2 = [2, 1, 3, 1, 1]; // Total weight = 8
const calc2 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data2,
    weights: weights2
});

const sortedData2 = calc2.getSortedData();
console.log('Data:', data2);
console.log('Weights:', weights2);
console.log('Total Weight W =', sortedData2.W);
console.log('Sorted structure:', sortedData2);

console.log('\nTukey\'s Hinges results:');
console.log('Q1 (25th percentile):', calc2.getPercentile(25, 'tukeyhinges'));
console.log('Q2 (50th percentile):', calc2.getPercentile(50, 'tukeyhinges'));
console.log('Q3 (75th percentile):', calc2.getPercentile(75, 'tukeyhinges'));
console.log('');

// Test Case 3: Data dengan nilai duplikat
console.log('Test 3: Data dengan Nilai Duplikat');
const data3 = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
const calc3 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data3 
});

const sortedData3 = calc3.getSortedData();
console.log('Data:', data3);
console.log('Sorted structure:', sortedData3);

console.log('\nTukey\'s Hinges results:');
console.log('Q1 (25th percentile):', calc3.getPercentile(25, 'tukeyhinges'));
console.log('Q2 (50th percentile):', calc3.getPercentile(50, 'tukeyhinges'));
console.log('Q3 (75th percentile):', calc3.getPercentile(75, 'tukeyhinges'));
console.log('');

// Test Case 4: Persentil non-kuartil (harus fallback ke waverage)
console.log('Test 4: Persentil Non-Kuartil (Fallback)');
console.log('10th percentile (tukeyhinges):', calc1.getPercentile(10, 'tukeyhinges'));
console.log('10th percentile (waverage):', calc1.getPercentile(10, 'waverage'));
console.log('90th percentile (tukeyhinges):', calc1.getPercentile(90, 'tukeyhinges'));
console.log('90th percentile (waverage):', calc1.getPercentile(90, 'waverage'));
console.log('Hasil harus sama karena fallback ke waverage');
console.log('');

// Test Case 5: Edge case - data tunggal
console.log('Test 5: Edge Case - Data Tunggal');
const data5 = [42];
const calc5 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data5 
});

console.log('Data:', data5);
console.log('Q1:', calc5.getPercentile(25, 'tukeyhinges'));
console.log('Q2:', calc5.getPercentile(50, 'tukeyhinges'));
console.log('Q3:', calc5.getPercentile(75, 'tukeyhinges'));
console.log('');

console.log('=== Test Tukey\'s Hinges Complete ===');

// Add actual Jest test cases
describe('Tukey Hinges Implementation', () => {
    test('should calculate Tukey hinges for simple data', () => {
        const Q1 = calc1.getPercentile(25, 'tukeyhinges');
        const Q2 = calc1.getPercentile(50, 'tukeyhinges');
        const Q3 = calc1.getPercentile(75, 'tukeyhinges');
        
        expect(Q1).toBeCloseTo(3, 1);
        expect(Q2).toBeCloseTo(5.5, 1);
        expect(Q3).toBeCloseTo(8, 1);
    });
    
    test('should handle weighted data', () => {
        const Q1 = calc2.getPercentile(25, 'tukeyhinges');
        const Q2 = calc2.getPercentile(50, 'tukeyhinges');
        const Q3 = calc2.getPercentile(75, 'tukeyhinges');
        
        expect(Q1).toBeDefined();
        expect(Q2).toBeDefined();
        expect(Q3).toBeDefined();
    });
 });