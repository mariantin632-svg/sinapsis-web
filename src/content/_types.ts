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
    instagram_url?: string;
  };
  turnito?: {
    hub: string;           // URL del hub de reservas (todas las agendas)
  };
  google_reviews: {
    rating: number;        // 4.9
    count: number;         // 64
    url: string;           // link a Google Maps reviews
  };
}

// Planes de suscripción y tratamientos
export type PlanPeriodo = 'anual' | 'semestral' | 'unico';

export interface DuracionPrecio {
  periodo: PlanPeriodo;
  label: string;          // "Plan anual" · "Plan semestral" · "10 sesiones"
  sesiones: string;       // "48 sesiones de kinesiología"
  total: number;          // precio total upfront
  equiv_valor: number;    // equivalente: por mes (recurrente) o por sesión (finito)
  equiv_label: string;    // "/mes" · "/sesión"
  ahorro_label?: string;  // "22% off" · "Sin aumentos por 12 meses"
  tarjeta_1pago?: number; // total con tarjeta en 1 pago (+10%)
}

export interface Plan {
  slug: string;
  nombre: string;
  orden: number;
  tipo: 'suscripcion' | 'finito';
  tipo_label?: string;    // pisa el label derivado de tipo (ej. "Evaluación")
  subtitulo: string;      // kicker corto bajo el nombre
  hook: string;
  color_hex: string;      // color firma del plan (ej. "#5DCAA5")
  destacado?: boolean;
  oculto?: boolean;       // true = no se lista ni se genera su página (el plan sigue existiendo en el centro)
  pdf?: string;           // ruta pública al brochure descargable (ej. "/planes/pdf/plan-kine-10.pdf")
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
  // Sin margen_estimado: este repo es público, los márgenes no van acá.
  descripcion_larga?: string;
}

// Servicios sueltos
export interface ServicioSuelto {
  slug: string;
  nombre: string;
  modalidades: { tipo: 'presencial' | 'online' | 'domicilio'; precio: number }[];
  descripcion?: string;
  nota?: string;
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
  modalidades?: string[];      // chips: "Presencial", "Online"
  destacado_label?: string;    // chip extra, ej. "Esp. rodilla"
  turnito?: string;            // URL de la agenda del profesional en turnito
}

// Patologías (Qué tratamos)
export interface PatologiaFase {
  num: string;            // "0".."3" o "✓"
  cuando: string;         // "Semanas 0 – 2" · "Primera sesión" · "Alta"
  titulo: string;
  texto: string;
}

export interface Patologia {
  slug: string;
  nombre: string;
  orden: number;
  icono: string;              // id en IconPatologia.astro
  descripcion_corta: string;  // card del índice
  pagina?: boolean;           // true = tiene página de detalle propia
  // Campos de detalle (solo si pagina === true)
  seo_title?: string;
  seo_description?: string;
  kicker?: string;            // "Tobillo · Lesión ligamentaria"
  intro?: string;
  whatsapp_text?: string;
  chips?: string[];
  razones?: { big: string; titulo: string; texto: string }[];
  red_flags?: string[];
  red_flags_nota?: string;
  fases?: PatologiaFase[];
  incluye?: { titulo: string; texto: string }[];
  plan_slug?: string;         // plan sugerido (referencia a planes.json)
  plan_bullets?: string[];
  faq_titulo?: string;        // "Sobre el esguince de tobillo"
  faq?: { pregunta: string; respuesta: string }[];
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
