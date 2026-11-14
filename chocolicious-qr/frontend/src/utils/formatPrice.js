export function formatPrice(value) {
  const n = Number(value);
  const rounded = Number.isInteger(n) ? n : Math.round(n * 100) / 100;
  return `\u20B9${rounded}`;
}
