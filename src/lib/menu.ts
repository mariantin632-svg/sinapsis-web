/**
 * Fuente única de los links del menú: la usan el header de la home (Hero.astro,
 * que navega con anclas) y el Nav de interiores (que navega con rutas).
 *
 * `primarios` son los que se ven sueltos en la píldora del desktop; `secundarios`
 * viven dentro del desplegable "Más". El menú mobile y el footer muestran todos.
 */
export type MenuLink = {
  /** destino en la home (ancla a la sección) */
  hrefHome: string;
  /** destino desde cualquier página interior */
  href: string;
  label: string;
  /** texto corto para la píldora del desktop, donde el espacio es justo */
  labelCorto?: string;
};

export const primarios: MenuLink[] = [
  { hrefHome: '/orientador', href: '/orientador', label: '¿Por dónde empiezo?', labelCorto: 'Orientador' },
  { hrefHome: '#servicios', href: '/servicios-sueltos', label: 'Servicios' },
  { hrefHome: '#planes', href: '/planes', label: 'Planes' },
  { hrefHome: '#equipo', href: '/equipo', label: 'Equipo' },
];

export const secundarios: MenuLink[] = [
  { hrefHome: '/que-tratamos', href: '/que-tratamos', label: 'Qué tratamos' },
  { hrefHome: '#obras', href: '/obras-sociales', label: 'Obras sociales' },
  { hrefHome: '#faq', href: '/faq', label: 'Preguntas frecuentes', labelCorto: 'FAQ' },
  { hrefHome: '#ubicacion', href: '/contacto', label: 'Ubicación' },
  { hrefHome: '/apoyar', href: '/apoyar', label: 'Apoyá el proyecto', labelCorto: 'Apoyanos' },
];

/** Todos los links, en orden — para el menú mobile y el footer. */
export const todos: MenuLink[] = [...primarios, ...secundarios];
