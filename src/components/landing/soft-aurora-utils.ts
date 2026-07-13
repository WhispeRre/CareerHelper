export function hexToVec3(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');

  return [
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  ];
}
