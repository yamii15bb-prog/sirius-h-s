/**
 * SIRIUS H&S
 * Sistema central de estados visuales.
 */

export const SIRIUS_STATES = {
  IDLE: "idle",
  APPEARING: "appearing",
  DISAPPEARING: "disappearing",
  GREETING: "greeting",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  HAPPY: "happy",
  JOY: "joy",
  SURPRISED: "surprised",
  SERIOUS: "serious",
  CONCERNED: "concerned",
  CONFUSED: "confused",
  EXCITED: "excited",
  CALM: "calm",
  ATTENTIVE: "attentive",
  CELEBRATING: "celebrating",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export const SIRIUS_STATE_DURATION = {
  appearing: 700,
  disappearing: 700,
  greeting: 1800,
  listening: 0,
  thinking: 0,
  speaking: 0,
  happy: 2200,
  joy: 2200,
  surprised: 1800,
  serious: 2200,
  concerned: 2200,
  confused: 2200,
  excited: 2200,
  calm: 2200,
  attentive: 2200,
  celebrating: 2800,
  loading: 0,
  success: 2200,
  error: 2400,
};

export function getSiriusStateForAction(action) {
  const map = {
    appear: SIRIUS_STATES.APPEARING,
    disappear: SIRIUS_STATES.DISAPPEARING,

    enter: SIRIUS_STATES.APPEARING,
    exit: SIRIUS_STATES.DISAPPEARING,

    greet: SIRIUS_STATES.GREETING,
    goodbye: SIRIUS_STATES.DISAPPEARING,

    listen: SIRIUS_STATES.LISTENING,
    think: SIRIUS_STATES.THINKING,
    explain: SIRIUS_STATES.SPEAKING,

    happy: SIRIUS_STATES.HAPPY,
    joy: SIRIUS_STATES.JOY,
    surprised: SIRIUS_STATES.SURPRISED,
    serious: SIRIUS_STATES.SERIOUS,
    concerned: SIRIUS_STATES.CONCERNED,
    confused: SIRIUS_STATES.CONFUSED,
    excited: SIRIUS_STATES.EXCITED,
    calm: SIRIUS_STATES.CALM,
    attentive: SIRIUS_STATES.ATTENTIVE,
    celebrate: SIRIUS_STATES.CELEBRATING,

    loading: SIRIUS_STATES.LOADING,
    ready: SIRIUS_STATES.IDLE,
    success: SIRIUS_STATES.SUCCESS,
    error: SIRIUS_STATES.ERROR,
  };

  return map[action] || SIRIUS_STATES.IDLE;
}

export function getStateDuration(state) {
  return SIRIUS_STATE_DURATION[state] ?? 0;
}

export function createSiriusState(action, payload = {}) {
  const state = getSiriusStateForAction(action);

  return {
    state,
    action,
    payload,
    startedAt: Date.now(),
    duration: getStateDuration(state),
  };
}
