import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl } from '../../src/lib/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('builds a basic URL without text', () => {
    const url = buildWhatsAppUrl({ phone: '5491163678308' });
    expect(url).toBe('https://wa.me/5491163678308');
  });

  it('includes encoded text when provided', () => {
    const url = buildWhatsAppUrl({
      phone: '5491163678308',
      text: 'Hola, me interesa el Plan Total anual',
    });
    expect(url).toBe(
      'https://wa.me/5491163678308?text=Hola%2C%20me%20interesa%20el%20Plan%20Total%20anual'
    );
  });

  it('handles emojis and accents in text', () => {
    const url = buildWhatsAppUrl({
      phone: '5491163678308',
      text: 'Hola! Quiero info del pack 🔥 Reset Lumbar',
    });
    expect(url).toContain('https://wa.me/5491163678308?text=');
    expect(url).toContain(encodeURIComponent('Hola! Quiero info del pack 🔥 Reset Lumbar'));
  });

  it('strips non-digits from phone', () => {
    const url = buildWhatsAppUrl({ phone: '+54 9 11 6367-8308' });
    expect(url).toBe('https://wa.me/5491163678308');
  });
});
