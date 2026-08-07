import { z } from "zod";

const esFechaValida = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  if (!y || !m || !dd) return false;
  const dt = new Date(Date.UTC(y, m - 1, dd));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === dd;
};

export const reservaSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(80, "El nombre es demasiado largo."),
  email: z.email("Ingresa un correo electrónico válido."),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s().-]{7,20}$/, "Ingresa un teléfono válido."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.")
    .refine(esFechaValida, "La fecha no existe."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM."),
  guests: z.number().int().min(1, "Debe haber al menos 1 invitado.").max(20, "Máximo 20 invitados por reserva."),
  notes: z.string().max(500, "Las notas no pueden superar 500 caracteres.").optional(),
});

type ReservaValidada = z.infer<typeof reservaSchema>;

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

interface Horario {
  day: string;
  open: string | null;
  close: string | null;
  closed: boolean;
}

/** Valida reglas de negocio fuera del schema. Devuelve error o null si pasa. */
export function validarReglasReserva(data: ReservaValidada, horarios: Horario[]): string | null {
  const { date, time } = data;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (date < todayStr) return "La fecha no puede estar en el pasado.";

  const dia = DIAS[new Date(`${date}T00:00:00`).getDay()];
  const horario = horarios.find((h) => h.day.toLowerCase() === dia);
  if (!horario || horario.closed) return "Estamos cerrados ese día. Elige otra fecha.";
  if (horario.open !== null && horario.close !== null && (time < horario.open || time > horario.close)) {
    return `Ese día abrimos de ${horario.open} a ${horario.close}. Elige otra hora.`;
  }
  return null;
}
