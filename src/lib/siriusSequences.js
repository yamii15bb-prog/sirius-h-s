/**
 * SIRIUS H&S
 * Secuencias de comportamiento
 */

export const SIRIUS_SEQUENCES = {

  welcome: [
    "aparecer",
    "saludar",
    "feliz",
  ],

  welcomeOwner: [
    "aparecer",
    "saludar",
    "feliz",
    "celebrando",
  ],

  thinking: [
    "escuchar",
    "pensar",
    "explicar",
  ],

  success: [
    "feliz",
    "celebrando",
    "exito",
  ],

  warning: [
    "seria",
    "preocupada",
  ],

  error: [
    "seria",
    "preocupada",
    "error",
  ],

  goodbye: [
    "saludar",
    "despedirse",
    "desaparecer",
  ],
};


export function getSiriusSequence(name) {
  return SIRIUS_SEQUENCES[name] || [];
}


export function listSiriusSequences() {
  return Object.keys(SIRIUS_SEQUENCES);
}
