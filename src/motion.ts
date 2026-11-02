// The slower, softer morph is an explicit user-requested exception to Fluid's
// .24s slow tier. Physics springs preserve velocity when reversed mid-flight.
export const playerMotion = {
  bubble: { stiffness: 145, damping: 24, mass: 1.1 },
  glyph: { stiffness: 230, damping: 26, mass: .85 },
};
export const unit = (n: number) => Math.max(0, Math.min(1, n));

// One compound filled path. The filled triangle's two halves separate into bars. No opacity swap, duplicate icon or seam.
export function transportPath(value: number) {
  const p = unit(value);
  const mix = (a: number, b: number) => a + (b - a) * p;
  const polygon = (a: number[][], b: number[][]) => a.map((pt,i) => `${i ? 'L' : 'M'}${mix(pt[0],b[i][0])} ${mix(pt[1],b[i][1])}`).join(' ')+'Z';
  const left = polygon([[7,4],[13.5,8],[13.5,16],[7,20]], [[7,4],[10,4],[10,20],[7,20]]);
  const right = polygon([[13.5,8],[20,12],[20,12],[13.5,16]], [[14,4],[17,4],[17,20],[14,20]]);
  return left+right;
}

// A C1-continuous plateau holds a single fused contour throughout overlap.
// Only the separated endpoints blend back to the exact resting vector.
export function liquidEnvelope(value: number) {
  const p = unit(value);
  const edge = unit(Math.min(p, 1 - p) / .015);
  return edge * edge * (3 - 2 * edge);
}
