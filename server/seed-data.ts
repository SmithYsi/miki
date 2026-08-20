// server/seed-data.ts
// Datos de referencia de Café Miki — café de especialidad, Roma Norte, CDMX.
// Copy en español, precios MXN, eventos 2026 e imágenes reales de Unsplash
// (todas las URLs verificadas con HTTP 200 el 2026-08-05).

export type EventType = "evento" | "fiesta" | "programa";

export interface MenuItem {
  name: string;
  description: string;
  price: number; // MXN
  image_url?: string;
  intensidad?: number | null; // 1-5
  dulzura?: number | null;    // 1-5
  con_leche?: boolean | null;
  temperatura?: "frio" | "caliente" | null;
  tipo: "cafe" | "sin-cafe" | "otro";
  tags?: string[];
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
  tags: string[];
}

export interface DayHours {
  day: string;
  open: string | null;
  close: string | null;
  closed: boolean;
}

// URLs de Unsplash verificadas (reutilizadas del seed original + nuevas)
const IMG = {
  espresso: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=800&q=80",
  latte: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
  pourover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  coldbrew: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
  matcha: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80",
  pastry: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  brunch: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
  eventCata: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=1200&q=80",
  eventLatte: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=1200&q=80",
  eventJazz: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  eventBarismo: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=1200&q=80",
  eventTostado: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
  eventFiesta: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  eventVinyl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  eventChoco: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1200&q=80",
  eventFotos: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80",
  eventMole: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  eventHarvest: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=1200&q=80",
  eventPaella: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=1200&q=80",
  eventNocche: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80",
  eventPan: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80",
  eventMariachi: "https://images.unsplash.com/photo-1504704911898-68304a7d2571?auto=format&fit=crop&w=1200&q=80",
  eventCacao: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
} as const;

export const categories: MenuCategory[] = [
  {
    name: "Café",
    description: "Espressos, filtrados y lácteos con granos de origen único tostados en casa.",
    items: [
      { name: "Espresso", description: "Doble shot de nuestro blend de la casa, intenso y con cuerpo.", price: 35, image_url: IMG.espresso, intensidad: 5, dulzura: 2, con_leche: false, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "intenso"] },
      { name: "Americano", description: "Espresso con agua caliente: suave, largo y para todo el día.", price: 45, image_url: IMG.espresso, intensidad: 3, dulzura: 1, con_leche: false, temperatura: "caliente", tipo: "cafe", tags: ["filtrado", "suave"] },
      { name: "Cappuccino", description: "Espresso, leche al vapor y una capa generosa de microespuma.", price: 55, image_url: IMG.latte, intensidad: 4, dulzura: 3, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "leche", "espuma"] },
      { name: "Latte", description: "Espresso con leche cremosa y texturizada, equilibrado y sedoso.", price: 58, image_url: IMG.latte, intensidad: 3, dulzura: 3, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "leche", "sedoso"] },
      { name: "Café de origen (V60)", description: "Filtrado manual de un origen rotativo; pregunta por el de la semana.", price: 60, image_url: IMG.pourover, intensidad: 3, dulzura: 2, con_leche: false, temperatura: "caliente", tipo: "cafe", tags: ["filtrado", "origen", "manual"] },
      { name: "Doppio", description: "Triple shot para quienes necesitan el día completo en una taza.", price: 42, image_url: IMG.espresso, intensidad: 5, dulzura: 1, con_leche: false, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "intenso", "doble"] },
      { name: "Flat white", description: "Doble espresso con leche micro-espumada, sin espuma excesiva.", price: 62, image_url: IMG.latte, intensidad: 4, dulzura: 3, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "leche", "australiano"] },
      { name: "Cortado", description: "Espresso cortado con un chorrito de leche caliente, directo y puro.", price: 40, image_url: IMG.espresso, intensidad: 4, dulzura: 2, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "leche", "corto"] },
      { name: "Affogato", description: "Espresso vertido sobre helado de vainilla: el postre que también es café.", price: 68, image_url: IMG.espresso, intensidad: 4, dulzura: 4, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["espresso", "helado", "postre"] },
      { name: "Mocha", description: "Espresso, chocolate amargo y leche al vapor, coronado con chantilly.", price: 65, image_url: IMG.latte, intensidad: 3, dulzura: 5, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["espresso", "chocolate", "leche"] },
    ],
  },
  {
    name: "Especialidades",
    description: "Creaciones de barista con ingredientes de productores locales.",
    items: [
      { name: "Latte de lavanda", description: "Latte con jarabe de lavanda casero y un toque de miel de agave.", price: 70, image_url: IMG.latte, intensidad: 2, dulzura: 4, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["lavanda", "floral", "miel"] },
      { name: "Mocha de chocolate 70%", description: "Espresso con chocolate de Oaxaca fundido y leche al vapor.", price: 72, image_url: IMG.latte, intensidad: 3, dulzura: 5, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["chocolate", "oaxaca", "espresso"] },
      { name: "Café de olla especial", description: "Nuestra versión de especialidad: piloncillo, canela y grano de origen.", price: 65, image_url: IMG.espresso, intensidad: 3, dulzura: 4, con_leche: false, temperatura: "caliente", tipo: "cafe", tags: ["olla", "piloncillo", "canela", "tradicional"] },
      { name: "Espresso tonic", description: "Doble espresso sobre tónica artesanal con piel de naranja.", price: 68, image_url: IMG.coldbrew, intensidad: 4, dulzura: 2, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["espresso", "tonica", "refrescante"] },
      { name: "Dirty chai", description: "Chai especiado con un shot de espresso: especias y café en una sola taza.", price: 72, image_url: IMG.tea, intensidad: 3, dulzura: 3, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["chai", "especias", "espresso"] },
      { name: "Honey lavender latte", description: "Latte con lavanda, miel de abeja y un toque de vainilla.", price: 72, image_url: IMG.latte, intensidad: 2, dulzura: 5, con_leche: true, temperatura: "caliente", tipo: "cafe", tags: ["lavanda", "miel", "vainilla"] },
      { name: "Café de olla con chocolate", description: "Nuestro café de olla tradicional con chocolate mexicano rallado.", price: 70, image_url: IMG.espresso, intensidad: 3, dulzura: 5, con_leche: false, temperatura: "caliente", tipo: "cafe", tags: ["olla", "chocolate", "tradicional"] },
    ],
  },
  {
    name: "Bebidas frías",
    description: "Cold brew, refrescantes y opciones sin calor para los días de sol.",
    items: [
      { name: "Cold brew", description: "Extracción en frío durante 18 horas: dulce, suave y con baja acidez.", price: 60, image_url: IMG.coldbrew, intensidad: 3, dulzura: 2, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["cold-brew", "18h", "suave"] },
      { name: "Cold brew de coco", description: "Cold brew con leche de coco y un toque de vainilla, servido sobre hielo.", price: 68, image_url: IMG.coldbrew, intensidad: 2, dulzura: 4, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["cold-brew", "coco", "vainilla"] },
      { name: "Espresso frío", description: "Doble espresso sobre hielo, puro y directo. Para puristas.", price: 48, image_url: IMG.coldbrew, intensidad: 5, dulzura: 1, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["espresso", "frio", "puro"] },
      { name: "Limonada de café", description: "Cold brew, limón fresco, jarabe de agave. Refrescante e inesperado.", price: 65, image_url: IMG.coldbrew, intensidad: 2, dulzura: 3, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["limonada", "cold-brew", "refrescante"] },
      { name: "Té helado de jazmín", description: "Jazmín fresco infusionado y servido con hielo y rodaja de limón.", price: 45, image_url: IMG.tea, intensidad: 1, dulzura: 2, con_leche: false, temperatura: "frio", tipo: "sin-cafe", tags: ["te", "jazmin", "fresco"] },
      { name: "Smoothie de mango y ginger", description: "Mango fresco, jengibre, yogur y un toque de miel. Sin café.", price: 72, image_url: IMG.tea, intensidad: 0, dulzura: 5, con_leche: false, temperatura: "frio", tipo: "sin-cafe", tags: ["smoothie", "mango", "jengibre"] },
      { name: "Agua de horchata con café", description: "Nuestra horchata artesanal con un shot de espresso vertido.", price: 58, image_url: IMG.coldbrew, intensidad: 3, dulzura: 4, con_leche: false, temperatura: "frio", tipo: "cafe", tags: ["horchata", "espresso", "tradicional"] },
    ],
  },
  {
    name: "Tés e infusiones",
    description: "Tés de hoja completa, matcha ceremonial e infusiones sin cafeína.",
    items: [
      { name: "Matcha latte", description: "Matcha ceremonial batido con leche de avena, cremoso y vegetal.", price: 70, image_url: IMG.matcha, intensidad: 3, dulzura: 3, con_leche: true, temperatura: "caliente", tipo: "sin-cafe", tags: ["matcha", "ceremonial", "avena"] },
      { name: "Matcha frío", description: "Matcha batido con hielo y leche de avena, refrescante y energético.", price: 72, image_url: IMG.matcha, intensidad: 3, dulzura: 3, con_leche: true, temperatura: "frio", tipo: "sin-cafe", tags: ["matcha", "frio", "avena"] },
      { name: "Chai latte especiado", description: "Chai concentrado con canela, jengibre, cardamomo y clavo, con leche.", price: 62, image_url: IMG.tea, intensidad: 3, dulzura: 4, con_leche: true, temperatura: "caliente", tipo: "sin-cafe", tags: ["chai", "especias", "canela"] },
      { name: "Té negro Darjeeling", description: "First flush de Darjeeling: floral, muscatel, ligero y elegante.", price: 50, image_url: IMG.tea, intensidad: 2, dulzura: 1, con_leche: false, temperatura: "caliente", tipo: "sin-cafe", tags: ["te-negro", "darjeeling", "floral"] },
      { name: "Manzanilla con miel", description: "Manzanilla orgánica, miel de agave y limón. Para relajarse.", price: 42, image_url: IMG.tea, intensidad: 1, dulzura: 3, con_leche: false, temperatura: "caliente", tipo: "sin-cafe", tags: ["manzanilla", "miel", "relajante"] },
      { name: "Rooibos vainilla", description: "Rooibos sudafricano con vainilla natural. Sin cafeína, aterciopelado.", price: 48, image_url: IMG.tea, intensidad: 1, dulzura: 3, con_leche: false, temperatura: "caliente", tipo: "sin-cafe", tags: ["rooibos", "vainilla", "sin-cafeina"] },
      { name: "Té verde sencha", description: "Sencha japonés, vegetal y umami. Temperatura controlada para no amargar.", price: 48, image_url: IMG.tea, intensidad: 2, dulzura: 1, con_leche: false, temperatura: "caliente", tipo: "sin-cafe", tags: ["te-verde", "sencha", "umami"] },
    ],
  },
  {
    name: "Repostería",
    description: "Panadería y postres horneados en el local, cada mañana, en tandas pequeñas.",
    items: [
      { name: "Croissant de mantequilla", description: "Hojaldrado en capas, horneado cada mañana con mantequilla de primera.", price: 45, image_url: IMG.pastry, tipo: "otro", tags: ["hojaldrado", "mantequilla"] },
      { name: "Pan de plátano con nuez", description: "Húmedo y aromático, rebanada generosa con nuez caramelizada.", price: 50, image_url: IMG.pastry, tipo: "otro", tags: ["platan", "nuez"] },
      { name: "Cheesecake de café", description: "Base de galleta y corazón de café, cremoso y apenas dulce.", price: 65, image_url: IMG.pastry, tipo: "otro", tags: ["cheesecake", "cafe", "postre"] },
      { name: "Brownie de chocolate y sal de mar", description: "Denso, con trozos de chocolate y un toque de sal de mar.", price: 55, image_url: IMG.pastry, tipo: "otro", tags: ["brownie", "chocolate", "sal"] },
      { name: "Rollo de canela glaseado", description: "Masa suave con canela y glaseado de queso crema.", price: 58, image_url: IMG.pastry, tipo: "otro", tags: ["canela", "glaseado"] },
      { name: "Muffin de arándanos", description: "Esponjoso, cargado de arándanos frescos y un toque de limón.", price: 48, image_url: IMG.pastry, tipo: "otro", tags: ["muffin", "arandanos"] },
      { name: "Scone de limón y hearbs", description: "Irlandés, con romero y limón. Perfecto con mermelada y crema.", price: 52, image_url: IMG.pastry, tipo: "otro", tags: ["scone", "limon", "romero"] },
      { name: "Galleta de avena y chocolate", description: "Crujiente por fuera, chewy por dentro. Receta de la casa.", price: 35, image_url: IMG.pastry, tipo: "otro", tags: ["galleta", "avena", "chocolate"] },
      { name: "Pan de Nata con canela", description: "Masa brioche con nata, espolvoreado con canela y azúcar moreno.", price: 42, image_url: IMG.pastry, tipo: "otro", tags: ["nata", "canela", "brioche"] },
      { name: "Tarta de manzana", description: "Manzana caramelizada sobre masa quebrada, con un toque de canela.", price: 58, image_url: IMG.pastry, tipo: "otro", tags: ["tarta", "manzana", "caramelo"] },
    ],
  },
  {
    name: "Brunch",
    description: "Platos reconfortantes para acompañar tu taza, servidos hasta la tarde.",
    items: [
      { name: "Chilaquiles con huevo", description: "Tortilla frita con salsa roja o verde, crema, queso y huevo al gusto.", price: 95, image_url: IMG.brunch, tipo: "otro", tags: ["chilaquiles", "huevo", "tradicional"] },
      { name: "Tostada de aguacate y huevo", description: "Pan artesanal, aguacate machacado, huevo y chile de árbol.", price: 88, image_url: IMG.brunch, tipo: "otro", tags: ["tostada", "aguacate", "huevo"] },
      { name: "Sandwich de jamón serrano y brie", description: "Prensa caliente con jamón serrano, brie y mostaza de miel.", price: 110, image_url: IMG.brunch, tipo: "otro", tags: ["sandwich", "jamon", "brie"] },
      { name: "Bowl de yogurt y granola", description: "Yogurt natural, granola de la casa, fruta de temporada y miel.", price: 85, image_url: IMG.brunch, tipo: "otro", tags: ["yogurt", "granola", "fruta"] },
      { name: "Pan francés con cajeta", description: "Brioche remojado en plancha dorada, con cajeta y frutos rojos.", price: 92, image_url: IMG.brunch, tipo: "otro", tags: ["brioche", "cajeta", "frutos"] },
      { name: "Huevos rancheros", description: "Huevos sobre tortilla con frijoles, salsa ranchera y aguacate.", price: 98, image_url: IMG.brunch, tipo: "otro", tags: ["huevos", "rancheros", "frijoles"] },
      { name: "Granola bowl tropical", description: "Granola crujiente, coco, papaya, piña y yogur de coco.", price: 82, image_url: IMG.brunch, tipo: "otro", tags: ["granola", "tropical", "vegano"] },
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
    image: IMG.eventCata,
    tags: ["cata", "origenes", "mexico", "tostador"],
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
    image: IMG.eventLatte,
    tags: ["latte-art", "taller", "barista", "principiantes"],
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
    image: IMG.eventJazz,
    tags: ["jazz", "musica", "noche", "acustico"],
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
    image: IMG.eventBarismo,
    tags: ["barismo", "curso", "principiantes", "extraccion"],
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
    image: IMG.eventTostado,
    tags: ["tostado", "grano", "produccion", "abierto"],
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
    image: IMG.eventFiesta,
    tags: ["aniversario", "fiesta", "musica", "celebracion"],
  },
  {
    title: "Noche de vinilos y espresso",
    description: "Seleccionamos nuestros vinilos favoritos y los emparejamos con espresso de origen único.",
    type: "fiesta",
    date: "2026-09-06",
    time: "20:00",
    price: 150,
    capacity: 25,
    spots_taken: 12,
    image: IMG.eventVinyl,
    tags: ["vinilos", "musica", "noche", "espresso"],
  },
  {
    title: "Taller de chocolate a la taza",
    description: "Desde el grano de cacao hasta la bebida: aprende a preparar chocolate de origen mexicano.",
    type: "programa",
    date: "2026-09-28",
    time: "16:00",
    price: 300,
    capacity: 10,
    spots_taken: 4,
    image: IMG.eventChoco,
    tags: ["chocolate", "taller", "cacao", "mexico"],
  },
  {
    title: "Exposición fotográfica: Café en Sevilla",
    description: "Fotografías de cafeterías sevillanas del artista local Javier Morales. café incluido.",
    type: "evento",
    date: "2026-10-05",
    time: "18:00",
    price: 0,
    capacity: 30,
    spots_taken: 15,
    image: IMG.eventFotos,
    tags: ["fotografia", "exposicion", "sevilla", "gratis"],
  },
  {
    title: "Cata de cafés de finca",
    description: "Comparamos tres lotes de finca única: Huatusco, Pluma Hidalgo y Sierra Norte de Puebla.",
    type: "evento",
    date: "2026-10-18",
    time: "11:00",
    price: 280,
    capacity: 14,
    spots_taken: 7,
    image: IMG.eventCata,
    tags: ["cata", "finca", "origenes", "comparacion"],
  },
  {
    title: "Taller de repostería: croissants",
    description: "Aprende a laminar masa hojaldrada desde cero. Te llevas una docena de tus croissants.",
    type: "programa",
    date: "2026-11-14",
    time: "09:00",
    price: 450,
    capacity: 8,
    spots_taken: 6,
    image: IMG.eventPan,
    tags: ["reposteria", "croissants", "taller", "horneado"],
  },
  {
    title: "Brunch con mole negro",
    description: "Un brunch especial: chilaquiles con mole negro de Oaxaca, accompagné de café de olla.",
    type: "evento",
    date: "2026-09-14",
    time: "10:00",
    price: 180,
    capacity: 20,
    spots_taken: 10,
    image: IMG.eventMole,
    tags: ["brunch", "mole", "oaxaca", "especial"],
  },
  {
    title: "Café de la cosecha 2026",
    description: "Primera cosecha del año: degustamos los lotes nuevos de Chiapas y Veracruz.",
    type: "evento",
    date: "2026-12-05",
    time: "17:00",
    price: 200,
    capacity: 18,
    spots_taken: 3,
    image: IMG.eventHarvest,
    tags: ["cosecha", "nuevo", "chiapas", "veracruz"],
  },
  {
    title: "Taller de brew methods",
    description: "V60, Chemex, AeroPress, French Press: probamos los cuatro métodos y cada uno prepara el suyo.",
    type: "programa",
    date: "2026-11-21",
    time: "15:00",
    price: 380,
    capacity: 12,
    spots_taken: 5,
    image: IMG.pourover,
    tags: ["brewing", "v60", "chemex", "aeropress", "taller"],
  },
  {
    title: "Sábado de paella y café",
    description: "Paella valenciana en la terraza, con opción de maridaje con nuestro cold brew de coco.",
    type: "evento",
    date: "2026-10-31",
    time: "13:00",
    price: 220,
    capacity: 30,
    spots_taken: 18,
    image: IMG.eventPaella,
    tags: ["paella", "comida", "terraza", "maridaje"],
  },
  {
    title: "Noche de poesía y café",
    description: "Open mic de poesía con café ilimitado durante la velada. Inscripción previa para leer.",
    type: "fiesta",
    date: "2026-11-28",
    time: "20:00",
    price: 80,
    capacity: 25,
    spots_taken: 10,
    image: IMG.eventNocche,
    tags: ["poesia", "open-mic", "noche", "cultural"],
  },
  {
    title: "Masterclass de espresso",
    description: "Un día intensivo: control de molienda, dosificación, tiempo de extracción y troubleshooting.",
    type: "programa",
    date: "2026-12-12",
    time: "10:00",
    price: 500,
    capacity: 6,
    spots_taken: 1,
    image: IMG.eventBarismo,
    tags: ["espresso", "masterclass", "extraccion", "avanzado"],
  },
  {
    title: "Brunch de día de muertos",
    description: "Pan de muerto, champurrado y café de olla. Decoración floral de Templo Mayor.",
    type: "fiesta",
    date: "2026-11-02",
    time: "10:00",
    price: 160,
    capacity: 35,
    spots_taken: 28,
    image: IMG.eventFiesta,
    tags: ["dia-de-muertos", "brunch", "tradicional", "pan-de-muerto"],
  },
  {
    title: "Café con mariachi",
    description: "Sábado especial: mariachi en la terraza, café de olla y pan dulce. A mexican morning.",
    type: "fiesta",
    date: "2026-09-27",
    time: "09:00",
    price: 100,
    capacity: 45,
    spots_taken: 30,
    image: IMG.eventMariachi,
    tags: ["mariachi", "tradicional", "terrazza", "sabado"],
  },
];

export interface Testimonio {
  cita: string;
  nombre: string;
  rol: string;
}

export const testimonios: Testimonio[] = [
  { cita: "El mejor cold brew de la Roma, y la sala es perfecta para trabajar una tarde entera.", nombre: "Karla G.", rol: "Clienta de la colonia" },
  { cita: "Fui a la catación de orígenes y salí entendiendo el café de otra manera. Guiada y cercana.", nombre: "Diego M.", rol: "Asistente a la catación" },
  { cita: "El brunch de domingo se volvió nuestro plan fijo. El pan francés con cajeta es imperdible.", nombre: "Ana y Luis", rol: "Clientes frecuentes" },
  { cita: "Reservé una mesa para una fecha especial y todo salió perfecto: el trato, el café y la música.", nombre: "Sofía R.", rol: "Reserva para aniversario" },
  { cita: "El taller de latte art me volvió loca. Ahora hago tulipanes en casa (mal, pero los hago).", nombre: "Mariana T.", rol: "Asistente al taller" },
  { cita: "Como vegetariana, agradezco que siempre tengan opciones reales, no solo un sandwich de queso.", nombre: "Valentina P.", rol: "Clienta vegetariana" },
  { cita: "Trabajo remoto y este es mi spot fijo. El V60 de la semana nunca falla y el WiFi es estable.", nombre: "Roberto H.", rol: "Frecuente remoto" },
  { cita: "Llevé a mi mamá a la catación y se enamoró del café de Oaxaca. Ahora somos clientas habituales.", nombre: "Lucía F.", rol: "Clienta con su mamá" },
  { cita: "La nota de café en la paella del sábado fue un hito gastronómico. Maridaje imposible, perfecto.", nombre: "Andrés C.", rol: "Asistente al brunch" },
  { cita: "El espresso tonic es mi descubrimiento del verano. Refrescante, intenso, adictivo.", nombre: "Camila S.", rol: "Fan del espresso tonic" },
  { cita: "Vinimos de Puebla específicamente por el curso de barismo. Vale cada peso y cada minuto.", nombre: "Fernando y Leticia", rol: "Asistentes de fuera" },
  { cita: "La noche de jazz es mágica. Un café, un brownie y la música en vivo: la Roma en su mejor versión.", nombre: "Daniela O.", rol: "Asistente a jazz" },
  { cita: "Mi hijo descubrió el matcha en la tienda y ahora pide 'el té verde verde'. No lo cambio por nada.", nombre: "Patricia M.", rol: "Mamá cliente" },
  { cita: "La única cafetería donde el barista recuerda tu nombre y tu orden. Eso no tiene precio.", nombre: "Eduardo K.", rol: "Clienta de confianza" },
  { cita: "Pedí el affogato sin saber qué esperar y me volví adicta. Helado y café juntos: genialidad pura.", nombre: "Isabela G.", rol: "Descubrimiento reciente" },
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

export default { categories, events, horarios, testimonios };
