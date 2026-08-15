const STORAGE_KEY = "siriusHS_studio_v2";

export const SIRIUS_WORLDS = [
  {
    id: "royal-gothic",
    name: "Royal Gothic",
    description: "Castillos, misterio, elegancia y magia.",
    emoji: "ðŸ°",
  },
  {
    id: "enchanted-forest",
    name: "Bosque Encantado",
    description: "Naturaleza mÃ¡gica, luces y fantasÃ­a.",
    emoji: "ðŸŒ²",
  },
  {
    id: "celestial",
    name: "Celestial",
    description: "Estrellas, cielo, luz y sueÃ±os.",
    emoji: "ðŸŒŒ",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegancia moderna y sofisticaciÃ³n.",
    emoji: "âœ¨",
  },
  {
    id: "romantic",
    name: "Romantic",
    description: "EmociÃ³n, amor, flores y luz.",
    emoji: "ðŸŒ¹",
  },
  {
    id: "dark-fantasy",
    name: "Dark Fantasy",
    description: "FantasÃ­a oscura, castillos y misterio.",
    emoji: "ðŸ–¤",
  },
];

export const SIRIUS_STYLES = [
  {
    id: "black-gold",
    name: "Black & Gold",
    emoji: "ðŸ–¤",
  },
  {
    id: "burgundy",
    name: "Burgundy Luxury",
    emoji: "ðŸ·",
  },
  {
    id: "royal",
    name: "Royal",
    emoji: "ðŸ‘‘",
  },
  {
    id: "midnight",
    name: "Midnight",
    emoji: "ðŸŒ™",
  },
  {
    id: "celestial",
    name: "Celestial",
    emoji: "â­",
  },
  {
    id: "romantic",
    name: "Romantic",
    emoji: "ðŸ’—",
  },
];

export const SIRIUS_SCENE_TYPES = [
  "intro",
  "story",
  "visual",
  "gallery",
  "interactive",
  "final",
];

function createId(prefix = "sirius") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createScene(overrides = {}) {
  return {
    id: createId("scene"),
    title: overrides.title || "Nueva escena",
    type: overrides.type || "visual",
    description: overrides.description || "",
    duration: Number(overrides.duration) || 5,
    background:
      overrides.background ||
      "linear-gradient(135deg,#090909,#1b0d16,#4b1825)",
    text: overrides.text || "",
    music: overrides.music || "",
    voice: overrides.voice || "",
    interactive: Boolean(overrides.interactive),
    buttons: Array.isArray(overrides.buttons)
      ? overrides.buttons
      : [],
    ...overrides,
  };
}

export function createStudio(event = null) {
  return {
    version: 2,

    eventId: event?.id || null,

    eventName:
      event?.name ||
      "Mi experiencia Sirius",

    world: "royal-gothic",

    visualStyle: "black-gold",

    mood: "magical",

    description: "",

    scenes: [
      createScene({
        title: "Bienvenida",
        type: "intro",
        description:
          "La primera impresiÃ³n de la experiencia.",
        text:
          "Bienvenidos a un momento que jamÃ¡s olvidaremos.",
      }),
    ],

    settings: {
      musicEnabled: true,
      voiceEnabled: true,
      animationsEnabled: true,
      interactiveEnabled: true,
    },

    assistant: {
      active: true,
      avatar: "heidi",
    },

    updatedAt: new Date().toISOString(),
  };
}

export function normalizeStudio(studio = {}) {
  const base = createStudio();

  return {
    ...base,
    ...studio,

    scenes: Array.isArray(studio.scenes)
      ? studio.scenes.map((scene) =>
          createScene(scene)
        )
      : base.scenes,

    settings: {
      ...base.settings,
      ...(studio.settings || {}),
    },

    assistant: {
      ...base.assistant,
      ...(studio.assistant || {}),
    },

    updatedAt: new Date().toISOString(),
  };
}

function storageKey(eventId = null) {
  return eventId
    ? `${STORAGE_KEY}_${eventId}`
    : STORAGE_KEY;
}

export function saveStudio(studio, eventId = null) {
  try {
    const normalized = normalizeStudio(studio);

    localStorage.setItem(
      storageKey(eventId || normalized.eventId),
      JSON.stringify(normalized)
    );

    return true;
  } catch (error) {
    console.error(
      "Sirius Studio no pudo guardar:",
      error
    );

    return false;
  }
}

export function loadStudio(eventId = null) {
  try {
    const saved = localStorage.getItem(
      storageKey(eventId)
    );

    if (!saved) {
      return createStudio();
    }

    return normalizeStudio(
      JSON.parse(saved)
    );
  } catch (error) {
    console.error(
      "Sirius Studio no pudo cargar:",
      error
    );

    return createStudio();
  }
}

export function addScene(
  studio,
  scene = {}
) {
  const current = normalizeStudio(studio);

  return {
    ...current,
    scenes: [
      ...current.scenes,
      createScene(scene),
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function updateScene(
  studio,
  sceneId,
  changes = {}
) {
  const current = normalizeStudio(studio);

  return {
    ...current,

    scenes: current.scenes.map(
      (scene) =>
        scene.id === sceneId
          ? createScene({
              ...scene,
              ...changes,
            })
          : scene
    ),

    updatedAt: new Date().toISOString(),
  };
}

export function deleteScene(
  studio,
  sceneId
) {
  const current = normalizeStudio(studio);

  return {
    ...current,

    scenes: current.scenes.filter(
      (scene) => scene.id !== sceneId
    ),

    updatedAt: new Date().toISOString(),
  };
}

export function duplicateScene(
  studio,
  sceneId
) {
  const current = normalizeStudio(studio);

  const original =
    current.scenes.find(
      (scene) => scene.id === sceneId
    );

  if (!original) {
    return current;
  }

  const copy = createScene({
    ...original,
    title: `${original.title} Â· copia`,
  });

  return {
    ...current,

    scenes: [
      ...current.scenes,
      copy,
    ],

    updatedAt: new Date().toISOString(),
  };
}

export function updateStudio(
  studio,
  changes = {}
) {
  return normalizeStudio({
    ...studio,
    ...changes,
  });
}

export function resetStudio(
  event = null
) {
  const studio = createStudio(event);

  saveStudio(
    studio,
    event?.id || null
  );

  return studio;
}

export function getWorld(id) {
  return (
    SIRIUS_WORLDS.find(
      (world) => world.id === id
    ) ||
    SIRIUS_WORLDS[0]
  );
}

export function getStyle(id) {
  return (
    SIRIUS_STYLES.find(
      (style) => style.id === id
    ) ||
    SIRIUS_STYLES[0]
  );
}