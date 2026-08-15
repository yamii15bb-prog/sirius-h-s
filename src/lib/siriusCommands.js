/**
 * SIRIUS H&S
 * Motor central de comandos + detección de intención.
 */

export const SIRIUS_COMMANDS = {
  aparecer: { type: "movement", action: "appear" },
  desaparecer: { type: "movement", action: "disappear" },
  entrar: { type: "movement", action: "enter" },
  salir: { type: "movement", action: "exit" },
  acercarse: { type: "movement", action: "approach" },
  alejarse: { type: "movement", action: "moveAway" },
  izquierda: { type: "movement", action: "left" },
  derecha: { type: "movement", action: "right" },
  arriba: { type: "movement", action: "up" },
  abajo: { type: "movement", action: "down" },
  señalar: { type: "movement", action: "point" },
  mirar: { type: "movement", action: "look" },

  saludar: { type: "interaction", action: "greet" },
  despedirse: { type: "interaction", action: "goodbye" },
  escuchar: { type: "interaction", action: "listen" },
  pensar: { type: "interaction", action: "think" },
  explicar: { type: "interaction", action: "explain" },
  confirmar: { type: "interaction", action: "confirm" },
  cancelar: { type: "interaction", action: "cancel" },
  ayudar: { type: "interaction", action: "help" },

  feliz: { type: "reaction", action: "happy" },
  alegre: { type: "reaction", action: "joy" },
  sorprendida: { type: "reaction", action: "surprised" },
  seria: { type: "reaction", action: "serious" },
  preocupada: { type: "reaction", action: "concerned" },
  confundida: { type: "reaction", action: "confused" },
  emocionada: { type: "reaction", action: "excited" },
  tranquila: { type: "reaction", action: "calm" },
  atenta: { type: "reaction", action: "attentive" },
  celebrando: { type: "reaction", action: "celebrate" },

  cargando: { type: "system", action: "loading" },
  lista: { type: "system", action: "ready" },
  error: { type: "system", action: "error" },
  exito: { type: "system", action: "success" },
};

export function createSiriusCommand(command, payload = {}) {
  const normalized = String(command || "")
    .trim()
    .toLowerCase();

  const definition = SIRIUS_COMMANDS[normalized];

  if (!definition) {
    return {
      ok: false,
      command: normalized,
      error: "Comando Sirius desconocido",
    };
  }

  return {
    ok: true,
    command: normalized,
    type: definition.type,
    action: definition.action,
    payload,
    timestamp: Date.now(),
  };
}

export function executeSiriusCommand(command, payload = {}, handlers = {}) {
  const result = createSiriusCommand(command, payload);

  if (!result.ok) {
    return result;
  }

  if (typeof handlers === "function") {
    handlers(result);
  } else {
    if (typeof handlers.onCommand === "function") {
      handlers.onCommand(result);
    }

    if (typeof handlers.onStateChange === "function") {
      handlers.onStateChange(result);
    }
  }

  return result;
}

export function isSiriusCommand(command) {
  const normalized = String(command || "")
    .trim()
    .toLowerCase();

  return Boolean(SIRIUS_COMMANDS[normalized]);
}

export function getSiriusCommands() {
  return Object.keys(SIRIUS_COMMANDS);
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectSiriusCommand(text) {
  const value = normalizeText(text);

  if (!value) return null;

  const patterns = [
    {
      command: "saludar",
      words: ["hola", "saluda", "saludar"],
    },
    {
      command: "despedirse",
      words: ["adios", "despidete", "despidete"],
    },
    {
      command: "feliz",
      words: ["feliz", "sonrie", "alegrate", "sonriente"],
    },
    {
      command: "sorprendida",
      words: ["sorprendete", "sorpresa", "sorprendida"],
    },
    {
      command: "seria",
      words: ["ponte seria", "seria", "modo serio"],
    },
    {
      command: "preocupada",
      words: ["preocupate", "preocupada", "preocupacion"],
    },
    {
      command: "confundida",
      words: ["confundida", "confundete", "no entiendo"],
    },
    {
      command: "pensar",
      words: ["piensa", "pensar", "dejame pensar"],
    },
    {
      command: "escuchar",
      words: ["escucha", "escuchar", "pon atencion"],
    },
    {
      command: "ayudar",
      words: ["ayuda", "ayudar", "ayudame"],
    },
    {
      command: "explicar",
      words: ["explica", "explicar"],
    },
    {
      command: "emocionada",
      words: ["emocionada", "emocionate", "emocion"],
    },
    {
      command: "tranquila",
      words: ["tranquila", "calmate", "calma"],
    },
    {
      command: "atenta",
      words: ["atenta", "atencion"],
    },
    {
      command: "celebrando",
      words: ["celebra", "celebrando", "celebracion"],
    },
    {
      command: "acercarse",
      words: ["acercate", "acercarse", "acercate mas"],
    },
    {
      command: "alejarse",
      words: ["alejate", "alejarse"],
    },
    {
      command: "arriba",
      words: ["sube", "arriba"],
    },
    {
      command: "abajo",
      words: ["baja", "abajo"],
    },
    {
      command: "izquierda",
      words: ["izquierda", "ve a la izquierda"],
    },
    {
      command: "derecha",
      words: ["derecha", "ve a la derecha"],
    },
    {
      command: "señalar",
      words: ["senala", "señala", "apunta"],
    },
    {
      command: "mirar",
      words: ["mira", "mirame", "mirar"],
    },
    {
      command: "aparecer",
      words: ["aparece", "aparecer", "entra"],
    },
    {
      command: "desaparecer",
      words: ["desaparece", "desaparecer", "vete"],
    },
  ];

  for (const item of patterns) {
    if (item.words.some((word) => value.includes(normalizeText(word)))) {
      return createSiriusCommand(item.command, {
        originalMessage: text,
      });
    }
  }

  return null;
}
