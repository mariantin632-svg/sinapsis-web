// Datos institucionales
export interface Sitio {
  nombre: string;
  tagline: string;
  direccion: {
    calle: string;
    ciudad: string;
    provincia: string;
    cp?: string;
  };
  horarios: {
    lunes_viernes: string;
    sabado: string;
    domingo: string;
  };
  contacto: {
    whatsapp: string;      // +5491163678308 (formato internacional sin signos)
    whatsapp_display: string; // +54 9 11 6367-8308 (formato visible)
    email?: string;
    instagram?: string;
  };
  google_reviews: {
    rating: number;        // 4.9
    count: number;         // 64
    url: string;           // link a Google Maps reviews
  };
}

// Planes de suscripción
export interface DuracionPrecio {
  meses: 1 | 3 | 6 | 12;
  precio_mensual: number;
  total: number;
  ahorro_pct?: number;
  extra?: string;
}

export interface Plan {
  slug: 'essence' | 'focus' | 'total' | 'elite';
  nombre: string;
  tier: 1 | 2 | 3 | 4;
  subtitulo: string;
  hook: string;
  color_signature: string;
  destacado?: boolean;
  duraciones: DuracionPrecio[];
  incluye: string[];
  beneficios_destacados: string[];
  para_quien: string;
  faq?: { pregunta: string; respuesta: string }[];
}

// Packs únicos
export interface Pack {
  slug: string;
  nombre: string;
  emoji: string;
  publico_ideal: string;
  categoria: 'dolor_agudo' | 'oficina' | 'deportistas' | 'post_quirurgico' | 'mayor_60' | 'mujer' | 'empresas';
  incluye: string[];
  precio_carta: number;
  precio_sugerido: number;
  ahorro_pct: number;
  margen_estimado?: number;
  descripcion_larga?: string;
}

// Servicios sueltos
export interface ServicioSuelto {
  slug: string;
  nombre: string;
  modalidades: { tipo: 'presencial' | 'online' | 'domicilio'; precio: number }[];
  descripcion?: string;
}

// Equipo
export interface Profesional {
  slug: string;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidades: string[];
  bio_corta: string;
  bio_larga?: string;
  foto: string;
  formacion?: string[];
}

// Obras sociales
export interface ObraSocial {
  nombre: string;
  logo: string;
  instrucciones?: string;
  coseguro?: string;
}

// FAQ
export interface FaqItem {
  pregunta: string;
  respuesta: string;
  categoria: 'turnos' | 'pagos' | 'planes' | 'obras_sociales' | 'otros';
}

// Testimonios
export interface Testimonio {
  texto: string;
  autor: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  fuente?: 'google' | 'directo';
  fecha?: string;
}
