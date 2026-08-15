export const SIRIUS_DEFAULT_PROJECT = {
  id: "",
  name: "",
  eventType: "",
  description: "",
  emotion: "",
  style: "royal-gothic",
  palette: {
    primary: "#0b0710",
    secondary: "#6f1734",
    accent: "#d4af37",
    text: "#fff8ed",
  },
  music: {
    enabled: false,
    url: "",
    title: "",
  },
  scenes: [],
  guests: [],
  status: "draft",
  createdAt: null,
  updatedAt: null,
};

export const EVENT_TYPES = [
  {
    id: "xv",
    name: "XV años",
    description: "Una celebración única, elegante y llena de emoción.",
    icon: "👑",
  },
  {
    id: "wedding",
    name: "Boda",
    description: "Una historia de amor convertida en experiencia.",
    icon: "💍",
  },
  {
    id: "birthday",
    name: "Cumpleaños",
    description: "Una celebración hecha completamente a tu estilo.",
    icon: "🎂",
  },
  {
    id: "baby",
    name: "Baby shower",
    description: "Un momento dulce para celebrar una nueva historia.",
    icon: "🍼",
  },
  {
    id: "graduation",
    name: "Graduación",
    description: "El comienzo de una nueva etapa.",
    icon: "🎓",
  },
  {
    id: "other",
    name: "Otro evento",
    description: "Crea algo completamente diferente.",
    icon: "✨",
  },
];

export const EMOTION_OPTIONS = [
  "Elegante",
  "Mágica",
  "Romántica",
  "Emocionante",
  "Divertida",
  "Misteriosa",
  "Familiar",
  "Sofisticada",
  "Soñadora",
];

export const SIRIUS_CREATION_STEPS = [
  {
    id: "story",
    title: "Tu historia",
    description: "Cuéntanos qué quieres celebrar.",
  },
  {
    id: "style",
    title: "Tu esencia",
    description: "Elige el estilo que más te representa.",
  },
  {
    id: "world",
    title: "Tu mundo",
    description: "Transforma tu idea en un escenario.",
  },
  {
    id: "design",
    title: "Tu invitación",
    description: "Construye cada detalle visual.",
  },
  {
    id: "experience",
    title: "La experiencia",
    description: "Añade música, animaciones e interacciones.",
  },
  {
    id: "share",
    title: "Compartir",
    description: "Haz que tus invitados vivan el momento.",
  },
];
