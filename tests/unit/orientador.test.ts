import { describe, it, expect } from 'vitest';
import { evaluar, type Respuestas } from '../../src/lib/orientador';

// Base de un caso "sano": sin banderas, cuadro cualquiera. Cada test pisa lo que le importa.
const base: Respuestas = {
  zona: 'lumbar',
  banderas: [],
  inicio: 'esfuerzo',
  tiempo: 'menos1mes',
  medico: 'si-estudios',
  ramaTags: [],
  recurrencia: 'primera',
  objetivo: 'dolor',
};

const caso = (over: Partial<Respuestas>): Respuestas => ({ ...base, ...over });

describe('R0 — banderas rojas', () => {
  it('cualquier bandera manda a urgencia, sin importar el resto', () => {
    const r = evaluar(caso({ banderas: ['fuerza'], objetivo: 'deporte' }));
    expect(r.camino).toBe('urgencia');
    expect(r.regla).toBe('R0');
  });

  it('gana sobre traumatología aunque también corresponda', () => {
    const r = evaluar(
      caso({ banderas: ['esfinteres'], inicio: 'golpe', tiempo: 'agudo72h', signosTrauma: true })
    );
    expect(r.camino).toBe('urgencia');
  });

  it('varias banderas siguen siendo un solo resultado de urgencia', () => {
    const r = evaluar(caso({ banderas: ['fiebre', 'peso'] }));
    expect(r.camino).toBe('urgencia');
  });

  it('"ninguna" no cuenta como bandera', () => {
    const r = evaluar(caso({ banderas: [] }));
    expect(r.camino).not.toBe('urgencia');
  });
});

describe('R1 — traumatología primero', () => {
  it('a) trauma de menos de 72 h con signos de lesión', () => {
    const r = evaluar(caso({ zona: 'rodilla', inicio: 'golpe', tiempo: 'agudo72h', signosTrauma: true }));
    expect(r.camino).toBe('traumatologia');
    expect(r.regla).toBe('R1a');
  });

  it('a) trauma de menos de 72 h SIN signos de lesión no deriva', () => {
    const r = evaluar(caso({ zona: 'rodilla', inicio: 'golpe', tiempo: 'agudo72h', signosTrauma: false }));
    expect(r.camino).not.toBe('traumatologia');
  });

  it('b) post-quirúrgico sin indicación médica', () => {
    const r = evaluar(caso({ inicio: 'postquirurgico', medico: 'no' }));
    expect(r.camino).toBe('traumatologia');
    expect(r.regla).toBe('R1b');
  });

  it('b) post-quirúrgico CON indicación va a rehabilitación', () => {
    const r = evaluar(caso({ inicio: 'postquirurgico', medico: 'si-estudios' }));
    expect(r.camino).toBe('kinesiologia');
  });

  it('c) más de 3 meses sin haber visto nunca a un médico', () => {
    const r = evaluar(caso({ tiempo: 'mas3meses', medico: 'no' }));
    expect(r.camino).toBe('traumatologia');
    expect(r.regla).toBe('R1c');
  });

  it('c) más de 3 meses pero ya lo vio un médico NO deriva', () => {
    const r = evaluar(caso({ tiempo: 'mas3meses', medico: 'si-sin-estudios' }));
    expect(r.camino).not.toBe('traumatologia');
  });
});

describe('R2 — kinesiología', () => {
  it('lumbar de dos semanas por esfuerzo, primera vez, con estudios', () => {
    const r = evaluar(
      caso({ zona: 'lumbar', inicio: 'esfuerzo', tiempo: 'menos1mes', ramaTags: ['mecanico'] })
    );
    expect(r.camino).toBe('kinesiologia');
  });

  it('objetivo deportivo empuja fuerte a kinesiología', () => {
    const r = evaluar(caso({ zona: 'rodilla', objetivo: 'deporte', ramaTags: ['sobrecarga'] }));
    expect(r.camino).toBe('kinesiologia');
  });

  it('post-operatorio con indicación es kinesiología', () => {
    const r = evaluar(caso({ inicio: 'postquirurgico', medico: 'si-estudios', objetivo: 'post-lesion' }));
    expect(r.camino).toBe('kinesiologia');
  });
});

describe('R3 — osteopatía', () => {
  it('cuello de 4 meses, gradual, recurrente y tensional', () => {
    const r = evaluar(
      caso({
        zona: 'cuello',
        inicio: 'gradual',
        tiempo: 'mas3meses',
        medico: 'si-sin-estudios',
        ramaTags: ['tensional'],
        recurrencia: 'vuelve',
        objetivo: 'no-vuelva',
      })
    );
    expect(r.camino).toBe('osteopatia');
  });

  it('varias zonas con rigidez matinal y recurrencia', () => {
    const r = evaluar(
      caso({
        zona: 'varias',
        inicio: 'gradual',
        tiempo: '1a3meses',
        medico: 'si-sin-estudios',
        ramaTags: ['rigidez'],
        recurrencia: 'vuelve',
        objetivo: 'no-vuelva',
      })
    );
    expect(r.camino).toBe('osteopatia');
  });
});

describe('Guarda de seguridad — trauma reciente', () => {
  it('un golpe de menos de un mes nunca termina en osteopatía sola', () => {
    const r = evaluar(
      caso({
        zona: 'varias',
        inicio: 'golpe',
        tiempo: 'menos1mes',
        medico: 'no',
        ramaTags: ['rigidez', 'tensional'],
        recurrencia: 'vuelve',
        objetivo: 'no-vuelva',
      })
    );
    expect(r.camino).toBe('kinesiologia');
    expect(r.regla).toBe('guarda-trauma');
  });
});

describe('Combinado', () => {
  it('cuadro ambiguo devuelve kine con complemento osteopático', () => {
    const r = evaluar(
      caso({
        zona: 'cuello',
        inicio: 'esfuerzo',
        tiempo: '1a3meses',
        medico: 'si-estudios',
        ramaTags: ['irradia'],
        recurrencia: 'vuelve',
        objetivo: 'dolor',
      })
    );
    expect(r.camino).toBe('combinado');
    expect(Math.abs(r.puntajes.kine - r.puntajes.osteo)).toBeLessThan(3);
  });
});

describe('Razones', () => {
  it('devuelve entre 1 y 3 claves de razón para un resultado de rehabilitación', () => {
    const r = evaluar(caso({ objetivo: 'deporte', ramaTags: ['mecanico'] }));
    expect(r.razones.length).toBeGreaterThan(0);
    expect(r.razones.length).toBeLessThanOrEqual(3);
  });

  it('no inventa razones de scoring cuando el resultado es urgencia', () => {
    const r = evaluar(caso({ banderas: ['fiebre'] }));
    expect(r.razones).toEqual([]);
  });

  it('las claves de razón tienen formato campo:valor', () => {
    const r = evaluar(caso({ objetivo: 'deporte' }));
    r.razones.forEach((k) => expect(k).toMatch(/^[a-z]+:[a-z0-9-]+$/));
  });
});

describe('Robustez', () => {
  it('un cuestionario incompleto no rompe y devuelve un camino', () => {
    const r = evaluar({ zona: 'hombro', banderas: [] } as Respuestas);
    expect(['kinesiologia', 'osteopatia', 'combinado']).toContain(r.camino);
  });
});
