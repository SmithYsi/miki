// server/ai.ts
// Motor de IA local para el asistente de Café Miki.
// Clasificador por regex (sin dependencias externas).

export const INTENTS = ["reserva", "horarios", "precios", "eventos", "saludo", "otro"] as const;
export type Intent = (typeof INTENTS)[number];

// --- Clasificador por regex ---

const PATTERNS: [RegExp, Intent][] = [
  [/reserv(ar?|a|o|é|e)\b|mesa|lugar|apartar|disponibilidad/i, "reserva"],
  [/horari(os?|o)\b|hora(s)?\b|abren|cierran|cuándo\s+abren|a\s+qué\s+hora/i, "horarios"],
  [/preci(os?|o)\b|cost(o|os)\b|cuánto\s+cuesta|cuánto\s+sale|vale/i, "precios"],
  [/evento(s)?\b|cata(ción|s)?\b|taller(es)?\b|fiesta(s)?\b|programa(s)?\b|inscribir|apartar\s+lugar/i, "eventos"],
  [/hola\b|buen(os?|as?|as\d+)\b|qué\s+tal|hey\b|saludos\b|buen\s+día\b|buenas\b/i, "saludo"],
];

export function classifyIntentStub(text: string): Intent {
  for (const [re, intent] of PATTERNS) {
    if (re.test(text)) return intent;
  }
  return "otro";
}

// --- API pública ---

export async function classifyIntent(text: string): Promise<Intent> {
  return classifyIntentStub(text);
}

/** Extrae slots (fecha, hora, personas, nombre) de un mensaje usando regex. */
export function extractSlots(text: string): Partial<{ fecha: string; hora: string; personas: string; nombre: string }> {
  const slots: Partial<{ fecha: string; hora: string; personas: string; nombre: string }> = {};
  const t = text.toLowerCase();

  const fechaAbs = t.match(/(\d{4}-\d{2}-\d{2})/);
  if (fechaAbs) { slots.fecha = fechaAbs[1]; }
  else {
    const m = t.match(/\bel?\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/);
    if (m) { slots.fecha = m[1]; }
    else if (/\bma[nñ]ana\b/.test(t)) { slots.fecha = "mañana"; }
  }

  const horaNum = t.match(/\b(\d{1,2})\s*(?:de\s+la\s+(?:tarde|mañana|noche)|pm|am|h)\b/);
  if (horaNum) {
    let h = parseInt(horaNum[1], 10);
    if (/pm|tarde|noche/.test(t) && h < 12) h += 12;
    if (/am|mañana/.test(t) && h === 12) h = 0;
    if (/noche/.test(t) && h === 12) h = 0;
    slots.hora = `${String(h).padStart(2, "0")}:00`;
  } else {
    const hora24 = t.match(/\b(\d{1,2}:\d{2})\b/);
    if (hora24) slots.hora = hora24[1];
  }

  const personasMatch = t.match(/(?:para|somos|mesa\s+para)\s+(\d+)\s*(?:persona(s)?|gente|comensales)?/);
  if (personasMatch) { slots.personas = personasMatch[1]; }
  else {
    const numSimple = t.match(/\b(\d+)\s*(?:persona(s)?|gente|comensales)\b/);
    if (numSimple) slots.personas = numSimple[1];
  }

  const nombreMatch = t.match(/(?:me\s+llamo|soy)\s+([a-záéíóúñ']+(?:\s+[a-záéíóúñ']+){0,3})/i);
  if (nombreMatch) slots.nombre = nombreMatch[1].trim();

  return slots;
}
