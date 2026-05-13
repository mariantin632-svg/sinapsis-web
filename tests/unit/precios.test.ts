import { describe, it, expect } from 'vitest';
import { formatARS, calcularAhorroPct } from '../../src/lib/precios';

describe('formatARS', () => {
  it('formats integer to ARS without decimals', () => {
    expect(formatARS(36900)).toBe('$36.900');
    expect(formatARS(99000)).toBe('$99.000');
    expect(formatARS(1188000)).toBe('$1.188.000');
  });

  it('handles zero', () => {
    expect(formatARS(0)).toBe('$0');
  });
});

describe('calcularAhorroPct', () => {
  it('calcula porcentaje de ahorro entre precio mensual y mensual base', () => {
    // Essence: mensual base $36.900, anual $29.900 / mes → 19% ahorro
    expect(calcularAhorroPct(29900, 36900)).toBe(19);
  });

  it('devuelve 0 si los precios son iguales', () => {
    expect(calcularAhorroPct(36900, 36900)).toBe(0);
  });

  it('redondea correctamente', () => {
    // 13.55% → 14
    expect(calcularAhorroPct(31900, 36900)).toBe(14);
  });
});
