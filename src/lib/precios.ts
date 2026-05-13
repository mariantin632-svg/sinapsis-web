const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatARS(amount: number): string {
  // Intl devuelve "$ 36.900" con espacio. Lo normalizamos a "$36.900".
  return formatter.format(amount).replace(/\s/g, '');
}

export function calcularAhorroPct(precioConDescuento: number, precioBase: number): number {
  if (precioBase === 0 || precioConDescuento >= precioBase) return 0;
  const ahorro = ((precioBase - precioConDescuento) / precioBase) * 100;
  return Math.round(ahorro);
}
