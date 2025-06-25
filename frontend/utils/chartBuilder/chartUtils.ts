// Utility: Major ticks generator
export function getMajorTicks(min: number, max: number, inc: number): number[] {
  const ticks = [];
  let v = min;
  while (v < max) {
    ticks.push(Number(v.toFixed(10))); // Hindari floating point error
    v += inc;
  }
  if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - max) > 1e-8) {
    ticks.push(max);
  }
  return ticks;
}
