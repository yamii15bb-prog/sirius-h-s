const AI_HISTORY_KEY = "siriusHS_ai_history_v2";

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getAIHistory() {
  try {
    const saved = localStorage.getItem(AI_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function clearAIHistory() {
  try {
    localStorage.removeItem(AI_HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}

export { getAIHistory };

export function saveAIMessage(message) {
  try {
    const history = getAIHistory();

    history.push({
      ...message,
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(
      AI_HISTORY_KEY,
      JSON.stringify(history.slice(-100))
    );
  } catch {
    // Sirius continÃºa funcionando aunque localStorage falle.
  }
}

function detectIntent(message) {
  const text = normalize(message);

  if (/(^|\s)(hola|hey|buenas|saludos)(\s|$)/.test(text)) {
    return "greeting";
  }

  if (/(xv|quince|15 anos|quinceanera)/.test(text)) {
    return "xv";
  }

  if (/(boda|casamiento|novios|matrimonio)/.test(text)) {
    return "boda";
  }

  if (/(cumple|cumpleanos|fiesta|birthday)/.test(text)) {
    return "cumple";
  }

  if (/(infantil|nino|nina|pequeno|pequena)/.test(text)) {
    return "infantil";
  }

  if (/(gÃ³tico|gotico|gotica|castillo|oscuro|dark|medieval)/.test(text)) {
    return "gotico";
  }

  if (/(elegante|lujo|luxury|premium|sofisticado|sofisticada)/.test(text)) {
    return "elegante";
  }

  if (/(magico|magica|magia|fantasia|encantado|encantada)/.test(text)) {
    return "magico";
  }

  if (/(musica|cancion|canciones|audio)/.test(text)) {
    return "musica";
  }

  if (/(color|colores|paleta|tonos)/.test(text)) {
    return "colores";
  }

  if (/(ayuda|ayudame|no se|no sÃ©|empezar|empiezo)/.test(text)) {
    return "ayuda";
  }

  if (/(diferente|original|unico|unica|innovador|innovadora|nuevo)/.test(text)) {
    return "diferente";
  }

  if (/(invitacion|invitaciÃ³n|crear|disenar|diseÃ±ar)/.test(text)) {
    return "crear";
  }

  if (/(gracias|perfecto|me gusta|me encanta)/.test(text)) {
    return "positive";
  }

  return "general";
}

function buildAnswer(message, context = {}) {
  const intent = detectIntent(message);
  const persona = context.persona || "heidi";

  const name = persona === "scarleth" ? "Scarleth" : "Heidi";

  const previous = getAIHistory()
    .filter((item) => item.role === "user")
    .slice(-4)
    .map((item) => normalize(item.content))
    .join(" ");

  switch (intent) {
    case "greeting":
      return pick([
        `Hola âœ¨ Soy ${name}. Estoy aquÃ­. CuÃ©ntame quÃ© tienes en mente y vamos construyÃ©ndolo juntas.`,
        `Hola ðŸ’« QuÃ© bueno tenerte aquÃ­. No necesitas tener todo decidido; podemos comenzar con una sola idea.`,
        `Hola. Soy ${name} âœ¨. Dime quÃ© celebraciÃ³n quieres crear y yo te ayudo a convertirla en una experiencia.`
      ]);

    case "xv":
      return pick([
        "Para unos XV podemos crear algo mucho mÃ¡s especial que una invitaciÃ³n tradicional. Imagino una entrada cinematogrÃ¡fica, una identidad visual propia, mÃºsica, historia, ubicaciÃ³n, confirmaciÃ³n y un pase QR para cada invitado. Si quieres, empezamos por el estilo.",
        "Los XV pueden convertirse en todo un mundo âœ¨. Podemos hacerlos elegantes, mÃ¡gicos, gÃ³ticos, de fantasÃ­a o completamente diferentes. Â¿Quieres que primero construyamos la historia o la apariencia visual?",
        "Me gusta esa idea. Para tus XV quiero que cada pantalla tenga un propÃ³sito: sorprender al abrir, emocionar con la historia y despuÃ©s llevar al invitado hasta la fecha, lugar y confirmaciÃ³n."
      ]);

    case "boda":
      return pick([
        "Para una boda podemos crear una experiencia romÃ¡ntica y cinematogrÃ¡fica. Podemos comenzar con la historia de la pareja y despuÃ©s convertirla en escenas, mÃºsica, fotografÃ­as, ubicaciÃ³n y confirmaciÃ³n.",
        "Hagamos que la invitaciÃ³n cuente algo antes de mostrar todos los datos. Una entrada elegante, la historia de ustedes, el gran momento y finalmente la confirmaciÃ³n.",
        "Una boda merece identidad propia. Podemos trabajar una estÃ©tica clÃ¡sica, moderna, floral, cinematogrÃ¡fica o completamente personalizada."
      ]);

    case "cumple":
      return pick([
        "Para un cumpleaÃ±os podemos hacer algo mucho mÃ¡s dinÃ¡mico: una entrada sorpresa, mensaje personal, mÃºsica, cuenta regresiva, galerÃ­a, ubicaciÃ³n y confirmaciÃ³n.",
        "Perfecto ðŸŽ‚. Podemos diseÃ±arlo alrededor de la personalidad de quien cumple aÃ±os en lugar de usar una plantilla genÃ©rica.",
        "Podemos convertir el cumpleaÃ±os en una pequeÃ±a experiencia interactiva. Primero definimos la personalidad y despuÃ©s construimos el mundo visual."
      ]);

    case "infantil":
      return pick([
        "Para una celebraciÃ³n infantil podemos crear un pequeÃ±o mundo interactivo ðŸŒŸ: personajes, colores, mÃºsica, animaciones y una historia que acompaÃ±e al invitado.",
        "AquÃ­ podemos jugar muchÃ­simo con la imaginaciÃ³n. Podemos hacer que la invitaciÃ³n parezca la entrada a un cuento, una aventura o un mundo fantÃ¡stico.",
        "Podemos construirlo pensando en la edad del festejado para que el resultado no se sienta como una plantilla para adultos."
      ]);

    case "gotico":
      return pick([
        "SÃ­ ðŸ–¤. Podemos llevarla hacia un universo Royal Gothic: castillo, negro, vino, dorado, velas, niebla, partÃ­culas y una entrada cinematogrÃ¡fica.",
        "El estilo gÃ³tico puede ser elegante, no solamente oscuro. Imagino arquitectura de castillo, burgundy, dorado envejecido y una iluminaciÃ³n muy cuidada.",
        "Podemos hacer que parezca una invitaciÃ³n encontrada dentro de un antiguo castillo, pero con una experiencia digital moderna."
      ]);

    case "elegante":
      return pick([
        "Entonces apostarÃ­a por una estÃ©tica Luxury: composiciÃ³n limpia, tipografÃ­a sofisticada, negro, dorado, iluminaciÃ³n cinematogrÃ¡fica y transiciones suaves.",
        "Podemos hacerla elegante sin saturarla. Menos elementos, pero cada uno con mÃ¡s intenciÃ³n.",
        "Me gusta. ConstruirÃ­a la experiencia alrededor de detalles finos: tipografÃ­a, espacios, luz, movimiento sutil y una paleta muy controlada."
      ]);

    case "magico":
      return pick([
        "HagÃ¡mosla realmente mÃ¡gica âœ¨. Podemos trabajar partÃ­culas, luz, niebla, estrellas, transiciones cinematogrÃ¡ficas y una historia que haga sentir al invitado dentro del mundo.",
        "La magia puede estar en cÃ³mo aparece cada escena, no solamente en poner efectos. Podemos hacer que la invitaciÃ³n tenga una pequeÃ±a narrativa.",
        "Podemos crear un universo completo alrededor de la celebraciÃ³n: entrada, descubrimiento, historia, gran momento y cierre."
      ]);

    case "musica":
      return "La mÃºsica puede convertirse en parte de la narrativa. Podemos elegir una canciÃ³n para la entrada, otra secciÃ³n mÃ¡s emocional o incluso sincronizar momentos visuales con ella. Si me dices quÃ© canciÃ³n tienes en mente, puedo ayudarte a decidir dÃ³nde usarla.";

    case "colores":
      return "Podemos construir la identidad desde los colores. Por ejemplo, negro + dorado da Luxury; vino + negro + dorado da Royal Gothic; tonos pastel pueden llevarnos a algo delicado; azul profundo + plata puede sentirse nocturno y mÃ¡gico. Dime quÃ© colores te gustan y los convertimos en una paleta.";

    case "ayuda":
      return pick([
        "Tranquila. No necesitas saber por dÃ³nde empezar. Yo te propongo el camino: primero definimos el tipo de celebraciÃ³n, despuÃ©s el estilo visual y finalmente construimos las escenas.",
        "Empecemos con algo muy sencillo: dime quÃ© celebraciÃ³n estÃ¡s preparando y quÃ© emociÃ³n quieres provocar cuando alguien abra la invitaciÃ³n.",
        "Podemos hacerlo paso a paso. No voy a pedirte que tengas todo decidido desde el principio."
      ]);

    case "diferente":
      return pick([
        "Entonces no quiero darte una plantilla. Quiero construir un concepto desde cero. Dime tres cosas: quÃ© celebraciÃ³n es, quÃ© emociÃ³n quieres provocar y quÃ© estilo jamÃ¡s querrÃ­as usar.",
        "Perfecto. Si quieres algo realmente diferente, primero rompemos con la estructura tradicional de una invitaciÃ³n y despuÃ©s diseÃ±amos nuestra propia narrativa.",
        "Mejor. Sirius puede pensar la invitaciÃ³n como una experiencia y no como una simple tarjeta digital."
      ]);

    case "crear":
      return "SÃ­. Vamos a crearla juntas. Dime solamente quÃ© celebraciÃ³n es y, si ya tienes una idea, cuÃ©ntamela aunque estÃ© incompleta. Yo me encargo de convertirla en una propuesta concreta.";

    case "positive":
      return pick([
        "Entonces seguimos por ahÃ­ âœ¨. Podemos profundizar esa idea y hacerla todavÃ­a mÃ¡s personal.",
        "Perfecto. Ya encontramos una direcciÃ³n. Ahora podemos darle identidad visual y convertirla en escenas.",
        "Me alegra que te guste. No quiero detenerme en una respuesta: podemos seguir construyendo sobre esa idea."
      ]);

    default:
      if (previous.includes("gothic") || previous.includes("gotico")) {
        return "Sigo teniendo presente la direcciÃ³n que venÃ­amos construyendo. Podemos llevarla mÃ¡s lejos, cambiar una parte o comenzar una escena nueva. Â¿QuÃ© quieres modificar?";
      }

      return pick([
        "Te estoy escuchando. CuÃ©ntame un poco mÃ¡s sobre lo que imaginas y voy a ayudarte a aterrizarlo.",
        "Entiendo la idea. Podemos convertirla en algo concreto. Â¿Quieres trabajar primero la apariencia, la historia, la mÃºsica o la experiencia del invitado?",
        "Quiero conocer un poco mÃ¡s de tu idea antes de decidir por ti. Â¿QuÃ© quieres que sienta una persona cuando abra la invitaciÃ³n?",
        "Podemos explorar varias direcciones. Dime quÃ© parte quieres cambiar o quÃ© te gustarÃ­a conseguir y construimos la siguiente versiÃ³n."
      ]);
  }
}

export async function askSiriusAI(message = "", context = {}) {
  const cleanMessage = String(message).trim();

  if (!cleanMessage) {
    return {
      text: "Estoy aquÃ­ contigo âœ¨ CuÃ©ntame quÃ© quieres crear.",
      suggestions: [
        "Quiero crear unos XV",
        "Quiero una boda",
        "Quiero algo mÃ¡gico",
        "Quiero algo diferente"
      ]
    };
  }

  const answer = buildAnswer(cleanMessage, context);

  return {
    text: answer,
    suggestions: [
      "Hazla mÃ¡s elegante",
      "Hazla mÃ¡s mÃ¡gica",
      "Quiero algo diferente",
      "Quiero agregar mÃºsica"
    ]
  };
}

export function generateInvitationIdea({
  eventType = "",
  style = "",
  emotion = "",
  colors = ""
} = {}) {
  const parts = [
    eventType && `evento ${eventType}`,
    style && `estilo ${style}`,
    emotion && `emociÃ³n ${emotion}`,
    colors && `colores ${colors}`
  ].filter(Boolean);

  const description = parts.length
    ? parts.join(", ")
    : "una celebraciÃ³n Ãºnica";

  return {
    title: "Experiencia Sirius",
    concept: `Crear una invitaciÃ³n interactiva basada en ${description}.`,
    scenes: [
      {
        type: "opening",
        title: "Entrada",
        description: "Una apertura cinematogrÃ¡fica que prepare emocionalmente al invitado."
      },
      {
        type: "welcome",
        title: "Bienvenida",
        description: "Mensaje personal del anfitriÃ³n."
      },
      {
        type: "story",
        title: "La historia",
        description: "Una escena que explique por quÃ© este momento es especial."
      },
      {
        type: "event",
        title: "El gran momento",
        description: "Fecha, hora, lugar y detalles principales."
      },
      {
        type: "location",
        title: "UbicaciÃ³n",
        description: "Mapa interactivo para facilitar la llegada."
      },
      {
        type: "confirmation",
        title: "Confirma tu asistencia",
        description: "ConfirmaciÃ³n y control de invitados."
      }
    ]
  };
}

export const SIRIUS_AI_PERSONAS = {
  heidi: {
    id: "heidi",
    name: "Heidi",
    role: "La creadora soÃ±adora",
    personality:
      "Creativa, soÃ±adora, imaginativa y apasionada por convertir ideas en experiencias.",
    greeting:
      "Â¡Hola! Soy Heidi âœ¨. Vamos a imaginar algo que nadie haya visto antes."
  },

  scarleth: {
    id: "scarleth",
    name: "Scarleth",
    role: "La guÃ­a de aventuras",
    personality:
      "Amable, divertida, prÃ¡ctica y enfocada en ayudar al usuario a construir su invitaciÃ³n paso a paso.",
    greeting:
      "Â¡Hola! Soy Scarleth ðŸ’«. Yo te ayudo a convertir tu idea en algo que realmente puedas crear."
  }
};

export function createSiriusProject(message = "", context = {}) {
  const text = String(message).trim();
  const normalized = normalize(text);

  let eventType = context.eventType || "";
  let style = context.style || "";
  let emotion = context.emotion || "";
  let colors = context.colors || "";

  if (!eventType) {
    if (
      normalized.includes("xv") ||
      normalized.includes("quince") ||
      normalized.includes("15 anos")
    ) {
      eventType = "XV aÃ±os";
    } else if (
      normalized.includes("boda") ||
      normalized.includes("novios") ||
      normalized.includes("matrimonio")
    ) {
      eventType = "Boda";
    } else if (
      normalized.includes("cumple") ||
      normalized.includes("cumpleanos") ||
      normalized.includes("birthday")
    ) {
      eventType = "CumpleaÃ±os";
    } else if (
      normalized.includes("bautizo") ||
      normalized.includes("bautizo")
    ) {
      eventType = "Bautizo";
    } else {
      eventType = "CelebraciÃ³n";
    }
  }

  if (!style) {
    if (
      normalized.includes("gotico") ||
      normalized.includes("gothic") ||
      normalized.includes("oscuro") ||
      normalized.includes("castillo")
    ) {
      style = "Royal Gothic";
    } else if (
      normalized.includes("elegante") ||
      normalized.includes("lujo") ||
      normalized.includes("luxury")
    ) {
      style = "Luxury";
    } else if (
      normalized.includes("magico") ||
      normalized.includes("magica") ||
      normalized.includes("fantasia")
    ) {
      style = "MÃ¡gico";
    } else if (
      normalized.includes("romantico") ||
      normalized.includes("romantica")
    ) {
      style = "RomÃ¡ntico";
    } else {
      style = "Personalizado";
    }
  }

  if (!emotion) {
    if (
      normalized.includes("magico") ||
      normalized.includes("magica") ||
      normalized.includes("sorpresa")
    ) {
      emotion = "Asombro";
    } else if (
      normalized.includes("elegante") ||
      normalized.includes("lujo")
    ) {
      emotion = "Elegancia";
    } else if (
      normalized.includes("romantico") ||
      normalized.includes("romantica")
    ) {
      emotion = "Amor";
    } else {
      emotion = "EmociÃ³n y expectativa";
    }
  }

  if (!colors) {
    if (style === "Royal Gothic") {
      colors = "Negro, borgoÃ±a y dorado";
    } else if (style === "Luxury") {
      colors = "Negro, dorado y marfil";
    } else if (style === "RomÃ¡ntico") {
      colors = "Marfil, rosa y dorado";
    } else {
      colors = "Paleta personalizada";
    }
  }

  const project = {
    id:
      context.projectId ||
      `sirius-project-${Date.now()}`,

    eventType,
    style,
    emotion,
    colors,

    title: `Experiencia ${eventType}`,

    concept:
      `Una experiencia ${style.toLowerCase()} diseÃ±ada para transmitir ${emotion.toLowerCase()}.`,

    scenes: [
      {
        id: "opening",
        type: "opening",
        title: "Entrada",
        enabled: true,
        description:
          "Una apertura cinematogrÃ¡fica que introduce el universo de la celebraciÃ³n."
      },

      {
        id: "welcome",
        type: "welcome",
        title: "Bienvenida",
        enabled: true,
        description:
          "Un mensaje especial para recibir al invitado."
      },

      {
        id: "story",
        type: "story",
        title: "La historia",
        enabled: true,
        description:
          "Una escena que cuenta el significado de este momento."
      },

      {
        id: "event",
        type: "event",
        title: "El gran momento",
        enabled: true,
        description:
          "Fecha, hora y detalles principales del evento."
      },

      {
        id: "location",
        type: "location",
        title: "UbicaciÃ³n",
        enabled: true,
        description:
          "Mapa interactivo para encontrar fÃ¡cilmente el lugar."
      },

      {
        id: "confirmation",
        type: "confirmation",
        title: "ConfirmaciÃ³n",
        enabled: true,
        description:
          "ConfirmaciÃ³n de asistencia y control de invitados."
      },

      {
        id: "qr",
        type: "qr",
        title: "Pase QR",
        enabled: true,
        description:
          "Pase digital personalizado para cada invitado."
      }
    ],

    music: {
      enabled: false,
      track: "",
      volume: 0.7
    },

    animations: {
      enabled: true,
      intensity: "medium"
    },

    qr: {
      enabled: true,
      passesPerGuest: 1,
      singleUse: true
    },

    sourceMessage: text,

    /*
     * Datos compatibles con el formulario de eventos de Sirius H&S.
     * Sirius propone el concepto; la usuaria puede completar fecha,
     * hora y ubicación antes de crear definitivamente el evento.
     */
    projectUpdate: {
      name:
        context.name ||
        `Experiencia ${eventType}`,
      date:
        context.date || "",
      time:
        context.time || "",
      location:
        context.location || "",
      passes:
        Number(context.passes) || 1,
      eventType,
      style,
      emotion,
      colors
    },

    createdAt: new Date().toISOString()
  };

  return project;
}


