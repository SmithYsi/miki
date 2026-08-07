// server/seed-data.ts
// Datos de referencia de Café Miki — café de especialidad, Roma Norte, CDMX.
// Copy en español, precios MXN, eventos 2026 e imágenes reales de Unsplash
// (todas las URLs verificadas con HTTP 200 el 2026-08-05).

export type EventType = "evento" | "fiesta" | "programa";

export interface MenuItem {
  name: string;
  description: string;
  price: number; // MXN
}

export interface MenuCategory {
  name: string;
  description: string;
  items: MenuItem[];
}

export interface CafeEvent {
  title: string;
  description: string;
  type: EventType;
  date: string; // ISO yyyy-mm-dd (futura, 2026)
  time: string; // HH:MM
  price: number; // MXN
  capacity: number;
  spots_taken: number;
  image: string; // Unsplash (verificada HTTP 200)
}

export interface DayHours {
  day: string;
  open: string | null;
  close: string | null;
  closed: boolean;
}

export const categories: MenuCategory[] = [
  {
    name: "Café",
    description: "Espressos, filtrados y lácteos con granos de origen único tostados en casa.",
    items: [
      { name: "Espresso", description: "Doble shot de nuestro blend de la casa, intenso y con cuerpo.", price: 35 },
      { name: "Americano", description: "Espresso con agua caliente: suave, largo y para todo el día.", price: 45 },
      { name: "Cappuccino", description: "Espresso, leche al vapor y una capa generosa de microespuma.", price: 55 },
      { name: "Latte", description: "Espresso con leche cremosa y texturizada, equilibrado y sedoso.", price: 58 },
      { name: "Café de origen (V60)", description: "Filtrado manual de un origen rotativo; pregunta por el de la semana.", price: 60 },
    ],
  },
  {
    name: "Especialidades",
    description: "Creaciones de barista y opciones sin café, con ingredientes de productores locales.",
    items: [
      { name: "Cold Brew", description: "Extracción en frío durante 18 horas: dulce, suave y con baja acidez.", price: 60 },
      { name: "Latte de lavanda", description: "Latte con jarabe de lavanda casero y un toque de miel de agave.", price: 70 },
      { name: "Mocha de chocolate 70%", description: "Espresso con chocolate de Oaxaca fundido y leche al vapor.", price: 72 },
      { name: "Café de olla especial", description: "Nuestra versión de especialidad: piloncillo, canela y grano de origen.", price: 65 },
      { name: "Matcha latte", description: "Matcha ceremonial batido con leche de avena, cremoso y vegetal.", price: 70 },
    ],
  },
  {
    name: "Repostería",
    description: "Panadería y postres horneados en el local, cada mañana, en tandas pequeñas.",
    items: [
      { name: "Croissant de mantequilla", description: "Hojaldrado en capas, horneado cada mañana con mantequilla de primera.", price: 45 },
      { name: "Pan de plátano con nuez", description: "Húmedo y aromático, rebanada generosa con nuez caramelizada.", price: 50 },
      { name: "Cheesecake de café", description: "Base de galleta y corazón de café, cremoso y apenas dulce.", price: 65 },
      { name: "Brownie de chocolate y sal de mar", description: "Denso, con trozos de chocolate y un toque de sal de mar.", price: 55 },
      { name: "Rollo de canela glaseado", description: "Masa suave con canela y glaseado de queso crema.", price: 58 },
    ],
  },
  {
    name: "Brunch",
    description: "Platos reconfortantes para acompañar tu taza, servidos hasta la tarde.",
    items: [
      { name: "Chilaquiles con huevo", description: "Tortilla frita con salsa roja o verde, crema, queso y huevo al gusto.", price: 95 },
      { name: "Tostada de aguacate y huevo", description: "Pan artesanal, aguacate machacado, huevo y chile de árbol.", price: 88 },
      { name: "Sandwich de jamón serrano y brie", description: "Prensa caliente con jamón serrano, brie y mostaza de miel.", price: 110 },
      { name: "Bowl de yogurt y granola", description: "Yogurt natural, granola de la casa, fruta de temporada y miel.", price: 85 },
      { name: "Pan francés con cajeta", description: "Brioche remojado en plancha dorada, con cajeta y frutos rojos.", price: 92 },
    ],
  },
];

export const events: CafeEvent[] = [
  {
    title: "Catación de orígenes mexicanos",
    description: "Prueba a ciegas granos de Chiapas, Oaxaca y Veracruz, guiada por nuestro tostador, y aprende a reconocer sus notas.",
    type: "evento",
    date: "2026-09-12",
    time: "11:00",
    price: 250,
    capacity: 12,
    spots_taken: 5,
    image: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Taller de latte art",
    description: "Dos horas practicando corazones, tulipanes y rosetas con los baristas de la casa; te llevas tu taza.",
    type: "programa",
    date: "2026-09-20",
    time: "10:00",
    price: 350,
    capacity: 10,
    spots_taken: 3,
    image: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Café y jazz en vivo",
    description: "Noche de jazz acústico con taza de especialidad y una pieza de repostería incluidas en tu entrada.",
    type: "fiesta",
    date: "2026-10-02",
    time: "19:00",
    price: 180,
    capacity: 40,
    spots_taken: 25,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Curso de barismo para principiantes",
    description: "Cuatro sesiones de dos horas: teoría, molienda, extracción y textura de leche, con práctica en barra.",
    type: "programa",
    date: "2026-10-12",
    time: "17:00",
    price: 1200,
    capacity: 8,
    spots_taken: 2,
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Tostado abierto: el grano del mes",
    description: "Ven a ver cómo se tuesta el lote de la semana y llévate tu bolsa recién salida del tambor.",
    type: "evento",
    date: "2026-10-24",
    time: "12:00",
    price: 150,
    capacity: 20,
    spots_taken: 8,
    image: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Fiesta de aniversario",
    description: "Música en vivo, degustación de nuestro menú completo y promociones especiales por nuestro aniversario.",
    type: "fiesta",
    date: "2026-11-07",
    time: "18:00",
    price: 120,
    capacity: 60,
    spots_taken: 40,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  },
];

export const horarios: DayHours[] = [
  { day: "Lunes", open: "08:00", close: "20:00", closed: false },
  { day: "Martes", open: "08:00", close: "20:00", closed: false },
  { day: "Miércoles", open: null, close: null, closed: true }, // día de descanso
  { day: "Jueves", open: "08:00", close: "20:00", closed: false },
  { day: "Viernes", open: "08:00", close: "21:00", closed: false },
  { day: "Sábado", open: "09:00", close: "21:00", closed: false },
  { day: "Domingo", open: "09:00", close: "15:00", closed: false },
];

export default { categories, events, horarios };