// Debug test untuk Tukey's Hinges
// File: debug_tukey.test.js

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

console.log('=== Debug Tukey\'s Hinges Implementation ===\n');

// Test dengan data sederhana untuk memahami rumus
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const calc = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data 
});

const sortedData = calc.getSortedData();
console.log('Data:', data);
console.log('Sorted Data Structure:');
console.log('y:', sortedData.y);
console.log('c:', sortedData.c);
console.log('cc:', sortedData.cc);
console.log('W:', sortedData.W);

const W = sortedData.W;
const c = sortedData.c;
const cc = sortedData.cc;
const y = sortedData.y;
const c_star = Math.min(...c);

console.log('\nc* = min(c) =', c_star);

// Manual calculation untuk Q1 (25th percentile)
console.log('\n=== Manual Calculation untuk Q1 (25th percentile) ===');
let d, L1, L2, L3;

if (c_star >= 1) {
    d = Math.floor((W + 3) / 2);
    L1 = d;
    L2 = W % 2 === 1 ? (W + 1) / 2 : W / 2 + 0.5;
    L3 = W + 1 - d;
} else {
    d = Math.floor((W / c_star + 3) / 2);
    L1 = d * c_star;
    L2 = W / 2 + c_star / 2;
    L3 = W + c_star - d * c_star;
}

console.log('d =', d);
console.log('L1 =', L1, '(untuk Q1)');
console.log('L2 =', L2, '(untuk Q2)');
console.log('L3 =', L3, '(untuk Q3)');

// Untuk Q1, gunakan L1
const L = L1;
console.log('\nUntuk Q1, L =', L);

// Temukan h
console.log('\nMencari h dimana cc[h-1] < L <= cc[h]:');
for (let i = 0; i < cc.length; i++) {
    const cc_prev = i > 0 ? cc[i - 1] : 0;
    console.log(`i=${i}: cc[${i-1}]=${cc_prev} < ${L} <= cc[${i}]=${cc[i]} ?`, cc_prev < L && L <= cc[i]);
}

let h = -1;
for (let i = 0; i < cc.length; i++) {
    const cc_prev = i > 0 ? cc[i - 1] : 0;
    if (cc_prev < L && L <= cc[i]) {
        h = i;
        break;
    }
}

if (h === -1) {
    h = cc.length - 1;
}

console.log('h =', h);

// Hitung a*
const cc_h_minus_1 = h > 0 ? cc[h - 1] : 0;
const a_star = L - cc_h_minus_1;
console.log('cc[h-1] =', cc_h_minus_1);
console.log('a* = L - cc[h-1] =', L, '-', cc_h_minus_1, '=', a_star);

// Hitung a
const a = c[h] > 0 ? a_star / c[h] : 0;
console.log('c[h] =', c[h]);
console.log('a = a*/c[h] =', a_star, '/', c[h], '=', a);

// Hitung Q1
const y_h_minus_1 = h > 0 ? y[h - 1] : y[0];
const y_h = y[h];
console.log('y[h-1] =', y_h_minus_1);
console.log('y[h] =', y_h);

let Q1;
if (a_star >= 1) {
    Q1 = y_h;
    console.log('a* >= 1, jadi Q1 = y[h] =', Q1);
} else if (c[h] >= 1) {
    Q1 = (1 - a) * y_h_minus_1 + a * y_h;
    console.log('c[h] >= 1, jadi Q1 = (1-a)*y[h-1] + a*y[h] =', `(1-${a})*${y_h_minus_1} + ${a}*${y_h}`, '=', Q1);
} else {
    Q1 = (1 - a) * y_h_minus_1 + a * y_h;
    console.log('c[h] < 1, jadi Q1 = (1-a)*y[h-1] + a*y[h] =', `(1-${a})*${y_h_minus_1} + ${a}*${y_h}`, '=', Q1);
}

console.log('\nHasil manual Q1 =', Q1);
console.log('Hasil dari getPercentile(25, "tukeyhinges") =', calc.getPercentile(25, 'tukeyhinges'));

// Expected result untuk data [1,2,3,4,5,6,7,8,9,10]
// Tukey's Hinges seharusnya:
// Q1 = 3, Q2 = 5.5, Q3 = 8
console.log('\n=== Expected vs Actual ===');
console.log('Expected Q1: 3, Actual:', calc.getPercentile(25, 'tukeyhinges'));
console.log('Expected Q2: 5.5, Actual:', calc.getPercentile(50, 'tukeyhinges'));
console.log('Expected Q3: 8, Actual:', calc.getPercentile(75, 'tukeyhinges'));

// Add actual test case
describe('Tukey Hinges Debug', () => {
    test('should calculate Tukey hinges correctly', () => {
        const Q1 = calc.getPercentile(25, 'tukeyhinges');
        const Q2 = calc.getPercentile(50, 'tukeyhinges');
        const Q3 = calc.getPercentile(75, 'tukeyhinges');
        
        expect(Q1).toBeCloseTo(3, 1);
        expect(Q2).toBeCloseTo(5.5, 1);
        expect(Q3).toBeCloseTo(8, 1);
    });
});