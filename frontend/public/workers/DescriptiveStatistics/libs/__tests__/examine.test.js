const fs = require('fs');
const path = require('path');

// Helper to load worker scripts into the Node test environment.
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  let absolutePath = path.resolve(__dirname, '../../', normalized);
  if (!fs.existsSync(absolutePath)) {
    absolutePath = path.resolve(__dirname, '../../../../', normalized);
  }
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// -------------------------------------------------------------
//  Faux Web-Worker environment bootstrap
// -------------------------------------------------------------

global.self = global;
global.importScripts = loadScript;

// Load dependencies in order
loadScript('libs/utils.js');
loadScript('libs/descriptive.js');
loadScript('libs/frequency.js');
loadScript('libs/examine.js');

const ExamineCalculator = global.self.ExamineCalculator;

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('ExamineCalculator', () => {
    const variable = { name: 'salary', measure: 'scale' };
    const data = [1, 2, 3, 4, 5];

    const calc = new ExamineCalculator({ variable, data });

    it('should compute a trimmed mean equal to the arithmetic mean for symmetric data', () => {
        expect(calc.getTrimmedMean()).toBe(3);
    });

    it('should compute M-Estimators close to the mean for symmetric data', () => {
        const results = calc.getStatistics();
        expect(results.mEstimators.huber).toBeCloseTo(3);
        expect(results.mEstimators.hampel).toBeCloseTo(3);
        expect(results.mEstimators.andrew).toBeCloseTo(3);
        expect(results.mEstimators.tukey).toBeCloseTo(3);
    });

    it('should provide a proper summary object', () => {
        const stats = calc.getStatistics();
        expect(stats.summary.valid).toBe(5);
        expect(stats.summary.missing).toBe(0);
        expect(stats.summary.total).toBe(5);
    });
}); 