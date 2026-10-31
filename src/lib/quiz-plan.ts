// Datos del quiz "Descubrí tu plan ideal" (/tests). Viven acá y no en el componente
// para que la página pueda mostrar la cantidad real de preguntas.
// Cada opción suma puntos a uno o más planes. Gana el de mayor puntaje.
export const preguntas = [
  {
    q: '¿Cuál es tu objetivo principal?',
    opciones: [
      { t: 'Resolver una molestia reciente o leve', p: { 'kine-inicio': 3 } },
      { t: 'Tratar una lesión con diagnóstico', p: { 'kine-10': 3 } },
      { t: 'Conocer mi punto de partida antes de entrenar', p: { 'evaluacion-postural': 2, 'evaluacion-deportiva': 1 } },
      { t: 'Medir mi rendimiento deportivo', p: { 'evaluacion-deportiva': 3 } },
    ],
  },
  {
    q: '¿Cuántas sesiones creés que necesitás?',
    opciones: [
      { t: 'Pocas, es algo puntual', p: { 'kine-inicio': 2 } },
      { t: 'Un tratamiento completo hasta el alta', p: { 'kine-10': 2 } },
      { t: 'Por ahora solo quiero evaluarme', p: { 'evaluacion-postural': 1, 'evaluacion-deportiva': 1, 'evaluacion-nutricional': 1 } },
    ],
  },
  {
    q: 'Si te evaluaras hoy, ¿qué te gustaría conocer?',
    opciones: [
      { t: 'Mi postura y de dónde viene el dolor', p: { 'evaluacion-postural': 2 } },
      { t: 'Mi fuerza, saltos y asimetrías', p: { 'evaluacion-deportiva': 2 } },
      { t: 'Mi composición corporal y alimentación', p: { 'evaluacion-nutricional': 3 } },
      { t: 'Nada puntual, vengo por tratamiento', p: { 'kine-10': 1, 'kine-inicio': 1 } },
    ],
  },
];

export const resultados = {
  'kine-inicio': { nombre: 'KINE INICIO', desc: 'Cinco sesiones con evaluación incluida para resolver lo puntual. Si necesitás continuar, pasás al KINE 10 pagando la diferencia.', href: '/planes/kine-inicio' },
  'kine-10': { nombre: 'KINE 10', desc: 'Un tratamiento completo de 10 sesiones, de la evaluación al alta.', href: '/planes/kine-10' },
  'evaluacion-postural': { nombre: 'EVALUACIÓN POSTURAL', desc: 'Un diagnóstico claro de tu postura, con informe escrito.', href: '/planes/evaluacion-postural' },
  'evaluacion-deportiva': { nombre: 'EVALUACIÓN DEPORTIVA', desc: 'Saltos, fuerza y asimetrías medidos con datos reales.', href: '/planes/evaluacion-deportiva' },
  'evaluacion-nutricional': { nombre: 'EVALUACIÓN NUTRICIONAL', desc: 'Composición corporal, hábitos y laboratorio interpretados por una nutricionista.', href: '/planes/evaluacion-nutricional' },
};
