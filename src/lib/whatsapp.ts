export interface BuildWhatsAppUrlOptions {
  phone: string;
  text?: string;
}

export function buildWhatsAppUrl({ phone, text }: BuildWhatsAppUrlOptions): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const base = `https://wa.me/${cleanPhone}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
