const BASE_STORAGE_KEY = "siriusHS_premium_experience";

const DEFAULT_EXPERIENCE = {
  version: 1,
  world: "royal-gothic",
  scenes: [],
  visualStyle: "black-gold",
  dreamExperience: true,
  thematicMap: null,
  voice: null,
  music: null,
  avatar: null,
  multimedia: {
    enabled: true,
    images: [],
    videos: [],
  },
  eventControl: {
    enabled: true,
    confirmations: true,
    qrAccess: true,
  },
  distribution: {
    whatsapp: true,
    web: true,
  },
};

export const PREMIUM_FEATURES = [
  "world-lab",
  "scene-system",
  "visual-styles",
  "dream-experiences",
  "thematic-maps",
  "voice",
  "multimedia",
  "avatars",
  "event-control",
  "distribution",
];

export const PREMIUM_FEATURE_LABELS = {
  "world-lab": "World Lab",
  "scene-system": "Sistema de escenas",
  "visual-styles": "Estilos visuales",
  "dream-experiences": "Experiencias Dream",
  "thematic-maps": "Mapas temáticos",
  voice: "Voz y locución",
  multimedia: "Multimedia",
  avatars: "Avatares",
  "event-control": "Control del evento",
  distribution: "Distribución",
};

function getStorageKey(eventId = null) {
  if (!eventId) {
    return BASE_STORAGE_KEY;
  }

  return `${BASE_STORAGE_KEY}_${eventId}`;
}

function createSceneId() {
  return `scene-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeScene(scene = {}) {
  return {
    id: scene.id || createSceneId(),
    title: scene.title || "Nueva escena",
    type: scene.type || "visual",
    description: scene.description || "",
    duration: Number(scene.duration) || 5,
    background: scene.background || null,
    music: scene.music || null,
    voice: scene.voice || null,
    avatar: scene.avatar || null,
    interactive: Boolean(scene.interactive),
    buttons: Array.isArray(scene.buttons)
      ? scene.buttons
      : [],
    ...scene,
  };
}

export function createPremiumExperience(overrides = {}) {
  const experience = {
    ...DEFAULT_EXPERIENCE,
    ...overrides,
  };

  experience.scenes = Array.isArray(overrides.scenes)
    ? overrides.scenes.map(normalizeScene)
    : [];

  experience.distribution = {
    ...DEFAULT_EXPERIENCE.distribution,
    ...(overrides.distribution || {}),
  };

  experience.multimedia = {
    ...DEFAULT_EXPERIENCE.multimedia,
    ...(overrides.multimedia || {}),
  };

  experience.eventControl = {
    ...DEFAULT_EXPERIENCE.eventControl,
    ...(overrides.eventControl || {}),
  };

  return experience;
}

export function savePremiumExperience(
  experience,
  eventId = null
) {
  try {
    const normalized = createPremiumExperience(experience);

    localStorage.setItem(
      getStorageKey(eventId),
      JSON.stringify(normalized)
    );

    return true;
  } catch (error) {
    console.error(
      "No se pudo guardar la experiencia Premium:",
      error
    );

    return false;
  }
}

export function loadPremiumExperience(eventId = null) {
  try {
    const saved = localStorage.getItem(
      getStorageKey(eventId)
    );

    if (!saved) {
      return createPremiumExperience();
    }

    const parsed = JSON.parse(saved);

    return createPremiumExperience(parsed);
  } catch (error) {
    console.error(
      "No se pudo cargar la experiencia Premium:",
      error
    );

    return createPremiumExperience();
  }
}

export function addScene(experience, scene = {}) {
  const currentExperience =
    createPremiumExperience(experience);

  return {
    ...currentExperience,
    scenes: [
      ...currentExperience.scenes,
      normalizeScene(scene),
    ],
  };
}

export function updateScene(
  experience,
  sceneId,
  changes = {}
) {
  const currentExperience =
    createPremiumExperience(experience);

  return {
    ...currentExperience,
    scenes: currentExperience.scenes.map((scene) =>
      scene.id === sceneId
        ? normalizeScene({
            ...scene,
            ...changes,
          })
        : scene
    ),
  };
}

export function removeScene(
  experience,
  sceneId
) {
  const currentExperience =
    createPremiumExperience(experience);

  return {
    ...currentExperience,
    scenes: currentExperience.scenes.filter(
      (scene) => scene.id !== sceneId
    ),
  };
}

export function duplicateScene(
  experience,
  sceneId
) {
  const currentExperience =
    createPremiumExperience(experience);

  const original = currentExperience.scenes.find(
    (scene) => scene.id === sceneId
  );

  if (!original) {
    return currentExperience;
  }

  const copy = normalizeScene({
    ...original,
    id: createSceneId(),
    title: `${original.title} - copia`,
  });

  return {
    ...currentExperience,
    scenes: [
      ...currentExperience.scenes,
      copy,
    ],
  };
}

export function updatePremiumSettings(
  experience,
  changes = {}
) {
  return createPremiumExperience({
    ...experience,
    ...changes,
  });
}

export function resetPremiumExperience(
  eventId = null
) {
  const experience =
    createPremiumExperience();

  savePremiumExperience(
    experience,
    eventId
  );

  return experience;
}

export function deletePremiumExperience(
  eventId = null
) {
  try {
    localStorage.removeItem(
      getStorageKey(eventId)
    );

    return true;
  } catch (error) {
    console.error(
      "No se pudo eliminar la experiencia Premium:",
      error
    );

    return false;
  }
}

export function hasPremiumExperience(
  eventId = null
) {
  try {
    return Boolean(
      localStorage.getItem(
        getStorageKey(eventId)
      )
    );
  } catch {
    return false;
  }
}
