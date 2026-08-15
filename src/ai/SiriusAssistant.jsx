import { useMemo, useState } from "react";
import HeidiAvatar from "../assets/avatars/HeidiAvatar.jsx";
import ScarlethAvatar from "../assets/avatars/ScarlethAvatar.jsx";

import {
  askSiriusAI,
  getAIHistory,
  saveAIMessage,
  SIRIUS_AI_PERSONAS,
} from "./siriusAI";

import {
  detectSiriusCommand,
  executeSiriusCommand,
} from "../lib/siriusCommands";

import {
  createSiriusState,
} from "../lib/siriusState";
const AVATARS = {
  heidi: {
    id: "heidi",
    name: "Heidi",
    Avatar: HeidiAvatar,
    role: "La creadora soñadora",
    symbol: "H",
    greeting:
      "Hola. Soy Heidi, la creadora soñadora. Vamos a convertir lo que imaginas en una experiencia completamente tuya.",
  },

  scarleth: {
    id: "scarleth",
    name: "Scarleth",
    Avatar: ScarlethAvatar,
    role: "La guía de Sirius",
    symbol: "S",
    greeting:
      "Hola. Soy Scarleth. Voy contigo paso a paso hasta que tu invitación cobre vida.",
  },
};

export default function SiriusAssistant({
  project = null,
  onApplySuggestion = null,
}) {
  const [activeAvatar, setActiveAvatar] = useState("heidi");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState(() => getAIHistory());
  const [loading, setLoading] = useState(false);
  const [creativePreview, setCreativePreview] = useState({
    eventType: "",
    style: "",
    emotion: "",
    colors: "",
    title: "Tu experiencia Sirius",
    concept: "CuÃƒÆ’Ã‚Â©ntame quÃƒÆ’Ã‚Â© imaginas y comenzaremos a construirlo."
  });

  const [creativeStage, setCreativeStage] = useState("ready");

  const [visualState, setVisualState] = useState("idle");

  // ============================================
  // CONTROLADOR VISUAL SIRIUS
  // ============================================

  const [siriusVisualState, setSiriusVisualState] = useState("idle");
  const [siriusVisualCommand, setSiriusVisualCommand] = useState(null);

  console.log("SIRIUS VISUAL:", {
    state: siriusVisualState,
    command: siriusVisualCommand,
  });

  const siriusVisualClass = [
    "sirius-avatar-large",
    "sirius-state-" +
      String(siriusVisualState || "idle").toLowerCase(),
    siriusVisualCommand
      ? "sirius-command-active"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const avatar = AVATARS[activeAvatar];

  const selectAvatar = (id) => {
    setActiveAvatar(id);
  };

  const visibleHistory = useMemo(() => {
    return history.slice(-20);
  }, [history]);

  const projectContext = useMemo(() => {
    if (!project) {
      return {};
    }

    return {
      projectId: project.id || "",
      eventType: project.eventType || project.type || "",
      name: project.name || "",
      style: project.style || "",
      world: project.world || "",
      emotion: project.emotion || "",
      colors: project.palette || project.colors || "",
    };
  }, [project]);

  const refreshHistory = () => {
    setHistory(getAIHistory());
  };

  const sendMessage = async (customMessage = null) => {
    const cleanMessage = String(
      customMessage !== null ? customMessage : message
    ).trim();

    if (!cleanMessage || loading) {
      return;
    }

    setLoading(true);
    setVisualState("listening");

    try {
      let detectedCommand = null;
      let commandResult = null;
      let siriusState = createSiriusState("listen", {
        persona: activeAvatar,
        message: cleanMessage,
      });

      setSiriusVisualState(siriusState.state);
      setSiriusVisualCommand(null);

      try {
        detectedCommand = detectSiriusCommand(cleanMessage);

        if (detectedCommand) {
          siriusState = createSiriusState(
            detectedCommand.action,
            {
              persona: activeAvatar,
              message: cleanMessage,
              project: projectContext,
            }
          );

          setSiriusVisualState(siriusState.state);
          setSiriusVisualCommand(detectedCommand.command);

          if (siriusState.duration > 0) {
            setTimeout(() => {
              setSiriusVisualState("idle");
              setSiriusVisualCommand(null);
            }, siriusState.duration);
          }

          commandResult = executeSiriusCommand(
            detectedCommand.command,
            {
              persona: activeAvatar,
              message: cleanMessage,
              project: projectContext,
              state: siriusState,
            },
            {
              onStateChange: (state) => {
                console.log("SIRIUS STATE:", state);
              },
              onCommand: (command) => {
                console.log("SIRIUS COMMAND:", command);
              },
            }
          );
        }
      } catch (commandError) {
        console.warn(
          "Sirius: no se pudo ejecutar el comando:",
          commandError
        );
      }

      const userMessage = {
        role: "user",
        content: cleanMessage,
        persona: activeAvatar,
        context: projectContext,
      };

      saveAIMessage(userMessage);

      setVisualState("thinking");

      const result = await Promise.resolve(
        askSiriusAI(cleanMessage, {
          ...projectContext,
          persona: activeAvatar,
        })
      );

      const answer =
        result?.text ||
        "Estoy contigo. Vamos a darle forma a esa idea y convertirla en una experiencia Sirius.";

      if (!detectedCommand) {
        setSiriusVisualState("speaking");
      }

      saveAIMessage({
        role: "assistant",
        content: answer,
        persona: activeAvatar,
        context: projectContext,
      });

      setMessage("");
      refreshHistory();

      if (typeof onApplySuggestion === "function" && result?.projectUpdate) {
        onApplySuggestion(result.projectUpdate);
      }
    } catch (error) {
      console.error("Error en Sirius Assistant:", error);

      saveAIMessage({
        role: "assistant",
        content:
          "Tu idea sigue a salvo. Hubo un pequeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o problema al procesar el mensaje, pero podemos continuar.",
        persona: activeAvatar,
        context: projectContext,
      });

      refreshHistory();
    } finally {
      setLoading(false);
      setTimeout(() => setVisualState("idle"), 1800);

      setTimeout(() => {
        setSiriusVisualState("idle");
        setSiriusVisualCommand(null);
      }, 1200);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    "No sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mo empezar",
    "Quiero que se vea mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡gico",
    "Quiero algo completamente diferente",
    "AyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºdame a crear mi invitaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n",
  ];

  const visualProject = {
  eventType:
    project?.eventType ||
    project?.type ||
    "Tu celebraciÃƒÂ³n",

  style:
    project?.style ||
    "Personalizado",

  emotion:
    project?.emotion ||
    "EmociÃƒÂ³n y expectativa",

  colors:
    project?.colors ||
    "Paleta personalizada",

  title:
    project?.title ||
    "Nueva experiencia Sirius",

  concept:
    project?.concept ||
    "CuÃƒÂ©ntame cÃƒÂ³mo imaginas tu evento y comenzarÃƒÂ© a construir la experiencia contigo.",

  scenes:
    Array.isArray(project?.scenes)
      ? project.scenes
      : [],
};

const avatarStateLabel = {
  idle: "Lista para crear",
  appearing: "Apareciendo",
  listening: "Te escucha",
  thinking: "EstÃƒÂ¡ imaginando",
  speaking: "Te estÃƒÂ¡ respondiendo",
  happy: "Le encanta la idea",
  excited: "Ã‚Â¡Tenemos algo!",
};

const currentAvatarState =
  avatarStateLabel[siriusVisualState] ||
  "Lista para crear";

const avatarInteractionClass =
  `sirius-avatar-interaction sirius-interaction-${siriusVisualState}`;

const visualCommandText =
  siriusVisualCommand
    ? String(siriusVisualCommand).replace(/[-_]/g, " ")
    : "";

const conceptStatus =
  siriusVisualState === "thinking"
    ? "Sirius estÃ¡ construyendo una idea..."
    : siriusVisualState === "listening"
      ? "Te estoy escuchando..."
      : siriusVisualState === "speaking"
        ? "Estoy preparando tu propuesta..."
        : siriusVisualState === "happy" ||
            siriusVisualState === "excited"
          ? "Â¡Esta idea tiene potencial!"
          : "Lista para crear contigo.";

return (
    <section className="sirius-assistant sirius-creative-studio">

      <div className="sirius-studio-header">

        <div>
          <span className="sirius-assistant-kicker">
            SIRIUS H&S Ãƒâ€šÃ‚Â· ESTUDIO CREATIVO
          </span>

          <h2>
            DiseÃƒÆ’Ã‚Â±a tu experiencia con nosotras
          </h2>

          <p>
            No solo hablamos de tu invitaciÃƒÆ’Ã‚Â³n.
            La construimos contigo.
          </p>
        </div>

        <div className="sirius-live-indicator">
          <span></span>
          SIRIUS ACTIVO
        </div>

      </div>


      <div className="sirius-visual-preview">

        <div className={avatarInteractionClass}>

          <div className="sirius-avatar-thought-orbit">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="sirius-preview-avatar">

            <div
              className={
                "sirius-preview-avatar-orb sirius-state-" +
                siriusVisualState
              }
            >

            <div className="sirius-preview-avatar-vector">
              {avatar?.Avatar ? <avatar.Avatar /> : <span>{avatar?.symbol || "S"}</span>}
            </div>

          </div>

            <div className="sirius-preview-avatar-info">
              <strong>{avatar?.name || "Sirius"}</strong>
              <span>{currentAvatarState}</span>
            </div>

          </div>

          <div className="sirius-avatar-live-message">
            {conceptStatus}
          </div>

          {visualCommandText && (
            <div className="sirius-avatar-command">
              âœ¦ {visualCommandText}
            </div>
          )}

        </div>


        <div className="sirius-preview-content">

          <div className="sirius-preview-label">
            CONCEPTO EN DESARROLLO
          </div>

          <div className="sirius-concept-title-row">

            <h3>
              {visualProject.title}
            </h3>

            <span
              className={
                "sirius-concept-live-dot sirius-state-" +
                siriusVisualState
              }
            ></span>

          </div>

          <p className="sirius-preview-concept">
            {visualProject.concept}
          </p>


          <div className="sirius-preview-tags">

            <span>
              Ã¢Å“Â¦ {visualProject.eventType}
            </span>

            <span>
              Ã¢â€”Ë† {visualProject.style}
            </span>

            <span>
              Ã¢â„¢Â¢ {visualProject.emotion}
            </span>

          </div>


          <div className="sirius-preview-colors">

            <span>Paleta</span>

            <strong>
              {visualProject.colors}
            </strong>

          </div>


          {visualProject.scenes.length > 0 && (

            <div className="sirius-preview-scenes">

              <span className="sirius-preview-scenes-title">
                EXPERIENCIA
              </span>

              <div className="sirius-preview-scene-list">

                {visualProject.scenes
                  .slice(0, 5)
                  .map((scene) => (

                    <div
                      key={scene.id}
                      className={
                        scene.enabled === false
                          ? "sirius-preview-scene disabled"
                          : "sirius-preview-scene"
                      }
                    >

                      <span>
                        {scene.enabled === false
                          ? "Ã¢â€”â€¹"
                          : "Ã¢â€”Â"}
                      </span>

                      {scene.title}

                    </div>

                  ))}

              </div>

            </div>

          )}

        </div>

      </div>
      <div className="sirius-creative-workspace">


        {/* =================================================
            AVATAR
        ================================================= */}

        <aside className="sirius-creative-avatar-panel">

          <div className="sirius-avatar-selector-mini">

            {Object.values(AVATARS).map((item) => {

              const selected = item.id === activeAvatar;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    selected
                      ? "sirius-mini-avatar-button active"
                      : "sirius-mini-avatar-button"
                  }
                  onClick={() => setActiveAvatar(item.id)}
                >

                  <div className="sirius-mini-avatar">

                    <item.Avatar className="sirius-mini-avatar-svg" />

                  </div>

                  <span>{item.name}</span>

                </button>
              );

            })}

          </div>


          <div
            className={
              "sirius-creative-avatar " +
              (loading ? "is-thinking " : "") +
              (creativeStage === "creating" ? "is-creating" : "")
            }
          >

            <div className="sirius-avatar-glow"></div>

            <div className={siriusVisualClass}>

              <avatar.Avatar className="sirius-avatar-svg" />

            </div>

            <div className="sirius-avatar-status">

              <strong>{avatar.name}</strong>

              <span>
                {loading
                  ? "Estoy creando..."
                  : creativeStage === "creating"
                  ? "Dando forma a tu idea..."
                  : "Lista para crear contigo"}
              </span>

            </div>

          </div>


          <div className="sirius-avatar-speech">

            <span className="sirius-speech-name">
              {avatar.name}
            </span>

            <p>
              {loading
                ? "Espera... estoy imaginando cÃƒÆ’Ã‚Â³mo llevar esta idea a la pantalla."
                : creativeStage === "creating"
                ? "Mira el concepto. Estoy construyendo una primera versiÃƒÆ’Ã‚Â³n."
                : avatar.greeting}
            </p>

          </div>

        </aside>


        {/* =================================================
            CONCEPTO VISUAL
        ================================================= */}

        <main className="sirius-concept-panel">

          <div className="sirius-concept-toolbar">

            <div>

              <span className="sirius-concept-label">
                CONCEPTO EN DESARROLLO
              </span>

              <h3>
                {creativePreview.title}
              </h3>

            </div>

            <div className="sirius-concept-state">

              <span
                className={
                  creativeStage === "creating"
                    ? "active"
                    : ""
                }
              ></span>

              {creativeStage === "creating"
                ? "Creando"
                : "Vista previa"}

            </div>

          </div>


          <div
            className={
              "sirius-visual-preview " +
              (creativeStage === "creating"
                ? "preview-creating"
                : "")
            }
          >

            <div className="sirius-preview-stars">
              ÃƒÂ¢Ã…â€œÃ‚Â¦ÃƒÂ£Ã¢â€šÂ¬Ã¢â€šÂ¬Ãƒâ€šÃ‚Â·ÃƒÂ£Ã¢â€šÂ¬Ã¢â€šÂ¬ÃƒÂ¢Ã…â€œÃ‚Â§ÃƒÂ£Ã¢â€šÂ¬Ã¢â€šÂ¬Ãƒâ€šÃ‚Â·ÃƒÂ£Ã¢â€šÂ¬Ã¢â€šÂ¬ÃƒÂ¢Ã…â€œÃ‚Â¦
            </div>

            <div className="sirius-preview-content">

              <span className="sirius-preview-eyebrow">
                SIRIUS H&S
              </span>

              <h1>
                {creativePreview.eventType ||
                  "Tu celebraciÃƒÆ’Ã‚Â³n"}
              </h1>

              <div className="sirius-preview-line"></div>

              <p>
                {creativePreview.style ||
                  "Estilo personalizado"}
              </p>

              <strong>
                {creativePreview.emotion ||
                  "Una experiencia creada para ti"}
              </strong>

            </div>

            <div className="sirius-preview-bottom">

              <span>
                {creativePreview.colors ||
                  "Paleta personalizada"}
              </span>

            </div>

          </div>


          {/* CARACTERISTICAS */}

          <div className="sirius-concept-details">

            <div className="sirius-detail-card">

              <span>EVENTO</span>

              <strong>
                {creativePreview.eventType || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
              </strong>

            </div>


            <div className="sirius-detail-card">

              <span>ESTILO</span>

              <strong>
                {creativePreview.style || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
              </strong>

            </div>


            <div className="sirius-detail-card">

              <span>EMOCIÃƒÆ’Ã¢â‚¬Å“N</span>

              <strong>
                {creativePreview.emotion || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
              </strong>

            </div>


            <div className="sirius-detail-card">

              <span>PALETA</span>

              <strong>
                {creativePreview.colors || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
              </strong>

            </div>

          </div>


          {/* CHAT COMPACTO */}

          <div className="sirius-creative-chat">

            <div className="sirius-chat-history">

              {visibleHistory.length === 0 ? (

                <div className="sirius-creative-empty">

                  <span>ÃƒÂ¢Ã…â€œÃ‚Â¦</span>

                  <strong>
                    Comencemos a crear
                  </strong>

                  <p>
                    Dime quÃƒÆ’Ã‚Â© celebraciÃƒÆ’Ã‚Â³n imaginas
                    y veremos cÃƒÆ’Ã‚Â³mo cobra vida.
                  </p>

                </div>

              ) : (

                visibleHistory.slice(-4).map((item) => (

                  <div
                    key={
                      item.id ||
                      item.createdAt ||
                      item.content
                    }
                    className={
                      item.role === "user"
                        ? "sirius-creative-message user"
                        : "sirius-creative-message assistant"
                    }
                  >

                    <span>
                      {item.role === "user"
                        ? "TÃƒÆ’Ã‚Âº"
                        : item.persona === "scarleth"
                        ? "Scarleth"
                        : "Heidi"}
                    </span>

                    <p>
                      {item.content}
                    </p>

                  </div>

                ))

              )}

              {loading && (

                <div className="sirius-creative-message assistant">

                  <span>{avatar.name}</span>

                  <p>
                    Estoy imaginando tu experiencia...
                  </p>

                </div>

              )}

            </div>


            <div className="sirius-creative-actions">

              {quickActions.slice(0, 3).map((action) => (

                <button
                  key={action}
                  type="button"
                  onClick={() => sendMessage(action)}
                  disabled={loading}
                >
                  {action}
                </button>

              ))}

            </div>


            <div className="sirius-creative-input">

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  "Dile a " +
                  avatar.name +
                  " quÃƒÆ’Ã‚Â© quieres crear..."
                }
                rows={2}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={
                  loading ||
                  !message.trim()
                }
              >
                {loading ? "Creando..." : "Crear"}
              </button>

            </div>

          </div>

        </main>

      </div>

    </section>
  );
}





































