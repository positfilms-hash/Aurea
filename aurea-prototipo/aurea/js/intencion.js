/**
 * intencion.js — Test de intención del discípulo (spec 038)
 *
 * Guía de orientación SIMPLE, transparente y editable. NO usa IA, NO diagnostica
 * y NO guarda nada en Supabase. Cada respuesta suma puntos a categorías y a
 * "arquetipos" de maestro; el resultado muestra las 2–3 categorías con más peso
 * y 1–2 tipos de maestro sugeridos.
 *
 * Las categorías son las CANÓNICAS de Aurea: se reutiliza `CATS` de categorias.js
 * (no se duplica la lista). El resto de preguntas no son listas de categorías.
 *
 * Para ajustar el test, edita `PREGUNTAS` (cats = categorías que suma cada
 * opción; arqs = arquetipos de maestro que suma). Nada más que tocar.
 */
import { CATS } from './categorias.js';

// — Arquetipos de maestro: solo lenguaje de orientación (no hay tabla) —
export const ARQUETIPOS = {
  practico:    'Maestro práctico',
  tecnico:     'Maestro técnico',
  creativo:    'Maestro creativo',
  sereno:      'Maestro sereno',
  exigente:    'Maestro exigente',
  oficio:      'Maestro de oficio',
  mentor:      'Mentor profesional',
  guia:        'Guía de proceso',
  profundidad: 'Maestro de profundidad',
};

// Descripción en minúscula para construir la frase "Alguien ..." del resultado.
export const ARQ_DESC = {
  practico:    'práctico y orientado a la acción',
  tecnico:     'técnico y preciso',
  creativo:    'creativo',
  sereno:      'sereno y cercano',
  exigente:    'exigente, que te empuje',
  oficio:      'con un oficio que dominar',
  mentor:      'con criterio profesional',
  guia:        'que te ayude a ordenar ideas',
  profundidad: 'con profundidad y experiencia vital',
};

// Categorías sugeridas cuando el usuario no tiene nada claro (o responde
// muchas veces "no lo sé"). Deben ser categorías canónicas reales.
export const FALLBACK_CATS = ['Aprendizaje', 'Filosofía', 'Estilo de vida'];

// Pregunta de "área": se construye con las categorías canónicas reales (CATS),
// para no mantener una lista paralela. Cada opción suma a su propia categoría.
const PREG_AREA = {
  id: 'area',
  titulo: '¿En qué zona sientes que necesitas orientación?',
  opciones: [
    ...Object.keys(CATS).map((cat) => ({ label: cat, cats: [cat], arqs: [] })),
    { label: 'No lo tengo claro', cats: [], arqs: [], nose: true },
  ],
};

// 6 preguntas (dentro del rango 5–7 de la spec). No se incluye la pregunta de
// "modalidad económica": Aurea no tiene esa funcionalidad implementada todavía.
export const PREGUNTAS = [
  {
    id: 'necesidad',
    titulo: '¿Qué buscas principalmente ahora?',
    opciones: [
      { label: 'Claridad',                cats: ['Filosofía', 'Aprendizaje', 'Estilo de vida'], arqs: ['sereno', 'guia'] },
      { label: 'Disciplina',              cats: ['Deportes', 'Aprendizaje', 'Estilo de vida'],  arqs: ['exigente', 'practico'] },
      { label: 'Aprender una habilidad',  cats: ['Oficios', 'Tecnología', 'Artes'],             arqs: ['practico', 'oficio'] },
      { label: 'Criterio profesional',    cats: ['Negocios', 'Tecnología', 'Aprendizaje'],      arqs: ['mentor', 'tecnico'] },
      { label: 'Acompañamiento personal', cats: ['Relaciones', 'Salud', 'Espiritualidad'],      arqs: ['sereno', 'guia'] },
      { label: 'Creatividad',             cats: ['Artes', 'Oficios', 'Estilo de vida'],         arqs: ['creativo'] },
      { label: 'Profundidad',             cats: ['Filosofía', 'Espiritualidad', 'Relaciones'],  arqs: ['profundidad', 'sereno'] },
    ],
  },
  {
    id: 'forma',
    titulo: '¿Cómo prefieres aprender?',
    opciones: [
      { label: 'Conversando',                          cats: ['Filosofía', 'Relaciones'],  arqs: ['sereno', 'guia'] },
      { label: 'Practicando',                          cats: ['Oficios', 'Deportes'],      arqs: ['practico', 'oficio'] },
      { label: 'Con seguimiento',                      cats: ['Aprendizaje', 'Salud'],     arqs: ['mentor', 'exigente'] },
      { label: 'Con lecturas o referencias',           cats: ['Filosofía', 'Aprendizaje'], arqs: ['profundidad', 'tecnico'] },
      { label: 'Con retos concretos',                  cats: ['Negocios', 'Tecnología'],   arqs: ['exigente', 'tecnico'] },
      { label: 'Observando a alguien con experiencia', cats: ['Oficios', 'Artes'],         arqs: ['oficio', 'creativo'] },
      { label: 'Aún no lo sé',                         cats: [], arqs: [], nose: true },
    ],
  },
  PREG_AREA,
  {
    id: 'ritmo',
    titulo: '¿Qué ritmo imaginas?',
    opciones: [
      { label: 'Algo tranquilo',                    ritmo: 'Algo tranquilo, sin prisa' },
      { label: 'Una conversación al mes',           ritmo: 'Una conversación al mes' },
      { label: 'Seguimiento cada dos semanas',      ritmo: 'Seguimiento cada dos semanas' },
      { label: 'Una sesión semanal',                ritmo: 'Una sesión semanal' },
      { label: 'Algo intensivo durante un tiempo',  ritmo: 'Algo intensivo durante un tiempo' },
      { label: 'Prefiero acordarlo con el maestro', ritmo: 'A acordar con el maestro' },
    ],
  },
  {
    id: 'tipo',
    titulo: '¿Qué tipo de maestro crees que te vendría mejor?',
    opciones: [
      { label: 'Alguien práctico',                    cats: ['Oficios', 'Deportes'],        arqs: ['practico'] },
      { label: 'Alguien exigente',                    cats: ['Deportes', 'Negocios'],       arqs: ['exigente'] },
      { label: 'Alguien sereno',                      cats: ['Filosofía', 'Espiritualidad'], arqs: ['sereno'] },
      { label: 'Alguien creativo',                    cats: ['Artes', 'Estilo de vida'],    arqs: ['creativo'] },
      { label: 'Alguien técnico',                     cats: ['Tecnología', 'Negocios'],     arqs: ['tecnico'] },
      { label: 'Alguien con experiencia vital',       cats: ['Filosofía', 'Relaciones'],    arqs: ['profundidad'] },
      { label: 'Alguien que me ayude a ordenar ideas', cats: ['Aprendizaje', 'Filosofía'],  arqs: ['guia'] },
    ],
  },
  {
    id: 'momento',
    titulo: '¿En qué punto estás?',
    opciones: [
      { label: 'Estoy empezando',                                 cats: ['Aprendizaje', 'Oficios'],     arqs: ['practico', 'guia'] },
      { label: 'Estoy bloqueado',                                 cats: ['Filosofía', 'Estilo de vida'], arqs: ['guia', 'sereno'] },
      { label: 'Quiero mejorar algo que ya hago',                 cats: ['Oficios', 'Deportes'],        arqs: ['exigente', 'tecnico'] },
      { label: 'Quiero cambiar de rumbo',                         cats: ['Negocios', 'Aprendizaje'],    arqs: ['mentor'] },
      { label: 'Busco constancia',                                cats: ['Deportes', 'Estilo de vida'], arqs: ['exigente'] },
      { label: 'Busco inspiración',                               cats: ['Artes', 'Espiritualidad'],    arqs: ['creativo', 'profundidad'] },
      { label: 'Busco una relación de aprendizaje a largo plazo', cats: ['Filosofía', 'Relaciones'],    arqs: ['profundidad', 'mentor'] },
    ],
  },
];

// Devuelve las `n` claves con más puntos (orden estable: en empate gana la que
// se sumó antes, lo que mantiene el resultado predecible y transparente).
function topKeys(scoreMap, n) {
  return Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map((e) => e[0]);
}

/**
 * Calcula el resultado a partir de las opciones elegidas (array en orden de
 * pregunta; las no respondidas pueden ser null). Devuelve un objeto plano,
 * fácil de pintar. Lógica 100% local, sin IA.
 */
export function calcularResultado(respuestas) {
  const catScore = {};
  const arqScore = {};
  let total = 0;
  let noseCount = 0;
  let ritmo = '';
  let necesidad = '';

  (respuestas || []).forEach((opt, i) => {
    if (!opt) return;
    total++;
    if (opt.nose) noseCount++;
    (opt.cats || []).forEach((c) => { catScore[c] = (catScore[c] || 0) + 1; });
    (opt.arqs || []).forEach((a) => { arqScore[a] = (arqScore[a] || 0) + 1; });
    if (opt.ritmo) ritmo = opt.ritmo;
    if (i === 0) necesidad = opt.label;
  });

  // "Muchos no lo sé": solo dos preguntas ofrecen esa opción (forma y área), así
  // que elegirla en ambas (>=2) es la señal máxima de desorientación posible.
  const muchosNose = noseCount >= 2;
  let cats = topKeys(catScore, 3);
  let fallback = false;
  if (cats.length < 2 || muchosNose) {
    // Pocas señales o demasiados "no lo sé" → sugerencia amable por defecto.
    cats = FALLBACK_CATS.slice();
    fallback = true;
  }

  const topArq = topKeys(arqScore, 2);
  return {
    cats,
    arqs: topArq.map((k) => ARQUETIPOS[k]).filter(Boolean),
    arqDesc: topArq.map((k) => ARQ_DESC[k]).filter(Boolean),
    ritmo,
    necesidad,
    fallback,
  };
}
