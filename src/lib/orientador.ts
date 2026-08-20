/**
 * Motor del orientador de pacientes ("¿Por dónde empiezo?").
 *
 * Función pura: recibe las respuestas del cuestionario y devuelve el camino sugerido.
 * No sabe nada del DOM ni de los textos — el contenido vive en `src/content/orientador.json`.
 * Diseño: docs/superpowers/specs/2026-08-20-orientador-paciente-design.md
 *
 * ORIENTA, NO DIAGNOSTICA. Las banderas rojas ganan siempre sobre cualquier otra regla.
 */

export type ZonaId =
  | 'cuello'
  | 'hombro'
  | 'codo'
  | 'lumbar'
  | 'cadera'
  | 'rodilla'
  | 'tobillo'
  | 'varias';

export type Inicio = 'golpe' | 'gradual' | 'esfuerzo' | 'postquirurgico';
export type Tiempo = 'agudo72h' | 'menos1mes' | '1a3meses' | 'mas3meses';
export type Medico = 'si-estudios' | 'si-sin-estudios' | 'no';
export type Recurrencia = 'primera' | 'vuelve';
export type Objetivo = 'dolor' | 'deporte' | 'no-vuelva' | 'post-lesion';

/** Señales clínicas que aportan las preguntas de rama, ya normalizadas. */
export type RamaTag = 'irradia' | 'mecanico' | 'sobrecarga' | 'rigidez' | 'tensional';

export type CaminoId =
  | 'urgencia'
  | 'traumatologia'
  | 'kinesiologia'
  | 'osteopatia'
  | 'combinado';

export type Regla = 'R0' | 'R1a' | 'R1b' | 'R1c' | 'guarda-trauma' | 'scoring';

export interface Respuestas {
  zona: ZonaId;
  /** Ids de banderas rojas marcadas. Vacío = ninguna. */
  banderas: string[];
  inicio?: Inicio;
  tiempo?: Tiempo;
  medico?: Medico;
  /** P5b, solo se pregunta ante golpe de menos de 72 h. */
  signosTrauma?: boolean;
  ramaTags?: RamaTag[];
  recurrencia?: Recurrencia;
  objetivo?: Objetivo;
}

export interface Resultado {
  camino: CaminoId;
  /** Qué regla decidió. Sirve para tests y para depurar sin adivinar. */
  regla: Regla;
  puntajes: { kine: number; osteo: number };
  /** Claves `campo:valor` de las respuestas que más pesaron. La UI las traduce a texto. */
  razones: string[];
}

interface Peso {
  kine: number;
  osteo: number;
}

const peso = (kine: number, osteo: number): Peso => ({ kine, osteo });

/**
 * Tabla de scoring. Cada respuesta empuja hacia kinesiología o hacia osteopatía.
 * Cambiar estos números cambia el criterio clínico: revisar los tests antes de tocar.
 */
const PESOS: Record<string, Peso> = {
  'inicio:golpe': peso(3, 0),
  'inicio:esfuerzo': peso(2, 1),
  'inicio:gradual': peso(0, 3),
  'inicio:postquirurgico': peso(4, 0),

  'tiempo:agudo72h': peso(2, 0),
  'tiempo:menos1mes': peso(1, 1),
  'tiempo:1a3meses': peso(0, 2),
  'tiempo:mas3meses': peso(0, 2),

  'medico:si-estudios': peso(2, 0),
  'medico:si-sin-estudios': peso(1, 1),
  'medico:no': peso(0, 1),

  'zona:varias': peso(0, 4),

  'recurrencia:primera': peso(1, 0),
  'recurrencia:vuelve': peso(0, 3),

  'tag:irradia': peso(2, 1),
  'tag:mecanico': peso(3, 0),
  'tag:sobrecarga': peso(2, 0),
  'tag:rigidez': peso(0, 2),
  'tag:tensional': peso(0, 2),

  'objetivo:dolor': peso(1, 1),
  'objetivo:deporte': peso(3, 0),
  'objetivo:no-vuelva': peso(0, 2),
  'objetivo:post-lesion': peso(4, 0),
};

/** Diferencia mínima para que un camino gane solo. Por debajo, el resultado es combinado. */
const UMBRAL = 3;

/** Claves de scoring activadas por estas respuestas, en orden de aparición en el test. */
function clavesActivas(r: Respuestas): string[] {
  const claves = [
    r.inicio && `inicio:${r.inicio}`,
    r.tiempo && `tiempo:${r.tiempo}`,
    r.medico && `medico:${r.medico}`,
    r.zona === 'varias' ? 'zona:varias' : null,
    ...(r.ramaTags ?? []).map((t) => `tag:${t}`),
    r.recurrencia && `recurrencia:${r.recurrencia}`,
    r.objetivo && `objetivo:${r.objetivo}`,
  ];
  return claves.filter((c): c is string => Boolean(c) && Boolean(PESOS[c as string]));
}

/** Hasta 3 respuestas que más empujaron hacia el lado ganador. */
function razonesDe(claves: string[], lado: 'kine' | 'osteo'): string[] {
  return claves
    .map((clave) => ({ clave, puntos: PESOS[clave][lado] }))
    .filter((c) => c.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 3)
    .map((c) => c.clave);
}

export function evaluar(r: Respuestas): Resultado {
  const claves = clavesActivas(r);
  const puntajes = claves.reduce(
    (acc, clave) => ({
      kine: acc.kine + PESOS[clave].kine,
      osteo: acc.osteo + PESOS[clave].osteo,
    }),
    { kine: 0, osteo: 0 }
  );

  const sinRazones = { puntajes, razones: [] as string[] };

  // R0 — banderas rojas. Gana siempre, corta el test.
  if ((r.banderas?.length ?? 0) > 0) {
    return { camino: 'urgencia', regla: 'R0', ...sinRazones };
  }

  // R1a — trauma agudo con signos de lesión estructural.
  if (r.inicio === 'golpe' && r.tiempo === 'agudo72h' && r.signosTrauma === true) {
    return { camino: 'traumatologia', regla: 'R1a', ...sinRazones };
  }

  // R1b — post-quirúrgico sin indicación médica de rehabilitación.
  if (r.inicio === 'postquirurgico' && r.medico === 'no') {
    return { camino: 'traumatologia', regla: 'R1b', ...sinRazones };
  }

  // R1c — cuadro de más de 3 meses que nunca vio un médico.
  if (r.tiempo === 'mas3meses' && r.medico === 'no') {
    return { camino: 'traumatologia', regla: 'R1c', ...sinRazones };
  }

  // R2 / R3 — reparto por scoring.
  const diff = puntajes.kine - puntajes.osteo;
  const traumaReciente =
    r.inicio === 'golpe' && (r.tiempo === 'agudo72h' || r.tiempo === 'menos1mes');

  if (diff <= -UMBRAL) {
    // Guarda: un cuadro traumático reciente se rehabilita, no se trata solo con terapia manual.
    if (traumaReciente) {
      return {
        camino: 'kinesiologia',
        regla: 'guarda-trauma',
        puntajes,
        razones: razonesDe(claves, 'kine'),
      };
    }
    return { camino: 'osteopatia', regla: 'scoring', puntajes, razones: razonesDe(claves, 'osteo') };
  }

  if (diff >= UMBRAL) {
    return { camino: 'kinesiologia', regla: 'scoring', puntajes, razones: razonesDe(claves, 'kine') };
  }

  return { camino: 'combinado', regla: 'scoring', puntajes, razones: razonesDe(claves, 'kine') };
}
