import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PREMIUM_FEATURES,
  PREMIUM_FEATURE_LABELS,
  addScene,
  loadPremiumExperience,
  removeScene,
  duplicateScene,
  resetPremiumExperience,
  savePremiumExperience,
  updatePremiumSettings,
} from "./premiumEngine";

export default function PremiumStudio({
  event = null,
  onClose = null,
}) {
  const eventId = event?.id || null;

  const [experience, setExperience] = useState(() =>
    loadPremiumExperience(eventId)
  );

  const [activeCategory, setActiveCategory] =
    useState("scene-system");

  const [message, setMessage] = useState("");

  const [editingSceneId, setEditingSceneId] =
    useState(null);

  const [sceneDraft, setSceneDraft] = useState({
    title: "",
    description: "",
    duration: 5,
    type: "visual",
    interactive: false,
  });

  useEffect(() => {
    setExperience(loadPremiumExperience(eventId));
    setMessage("");
    setEditingSceneId(null);
  }, [eventId]);

  useEffect(() => {
    savePremiumExperience(experience, eventId);
  }, [experience, eventId]);

  const featureItems = useMemo(
    () =>
      PREMIUM_FEATURES.map((feature) => ({
        id: feature,
        label:
          PREMIUM_FEATURE_LABELS[feature] ||
          feature
            .replaceAll("-", " ")
            .replace(/\b\w/g, (letter) =>
              letter.toUpperCase()
            ),
      })),
    []
  );

  const notify = (text) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const selectModule = (featureId) => {
    setActiveCategory(featureId);
    setMessage("");
  };

  const updateExperience = (
    changes,
    successMessage = "Cambios guardados."
  ) => {
    const next = updatePremiumSettings(
      experience,
      changes
    );

    setExperience(next);
    notify(successMessage);
  };

  const createScene = () => {
    const next = addScene(experience, {
      title: `Escena ${
        experience.scenes.length + 1
      }`,
      type: "visual",
      description: "Nueva escena Premium",
      duration: 5,
      interactive: false,
    });

    setExperience(next);
    notify("Nueva escena creada.");
  };

  const startEditScene = (scene) => {
    setEditingSceneId(scene.id);

    setSceneDraft({
      title: scene.title || "",
      description: scene.description || "",
      duration: scene.duration || 5,
      type: scene.type || "visual",
      interactive: Boolean(scene.interactive),
    });
  };

  const saveSceneEdit = () => {
    if (!editingSceneId) return;

    const nextExperience = {
      ...experience,
      scenes: experience.scenes.map((scene) =>
        scene.id === editingSceneId
          ? {
              ...scene,
              title:
                sceneDraft.title.trim() ||
                "Escena sin título",
              description:
                sceneDraft.description.trim(),
              duration:
                Number(sceneDraft.duration) || 5,
              type: sceneDraft.type,
              interactive:
                Boolean(sceneDraft.interactive),
            }
          : scene
      ),
    };

    setExperience(nextExperience);
    setEditingSceneId(null);
    notify("Escena actualizada.");
  };

  const deleteScene = (sceneId) => {
    setExperience(
      removeScene(experience, sceneId)
    );

    if (editingSceneId === sceneId) {
      setEditingSceneId(null);
    }

    notify("Escena eliminada.");
  };

  const copyText = async (text, success) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(success);
    } catch {
      notify(
        "No fue posible copiar automáticamente. Selecciona el texto manualmente."
      );
    }
  };

  const getInvitationUrl = () => {
    const base =
      window.location.origin || "";

    return `${base}/?event=${encodeURIComponent(
      eventId || ""
    )}`;
  };

 const openWhatsApp = () => {
  const url = getInvitationUrl();

  const text =
    `? ${event?.name || "Mi invitación"} ?\n\n` +
    `Te invito a consultar los detalles de mi evento:\n\n` +
    url;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );

  notify("WhatsApp preparado para compartir.");
};
  const renderWorldLab = () => {
    const worlds = [
      ["royal-gothic", "Castillo Royal Gothic"],
      ["enchanted-forest", "Bosque Encantado"],
      ["celestial", "Mundo Celestial"],
      ["vintage-palace", "Palacio Vintage"],
      ["dark-fantasy", "Dark Fantasy"],
      ["modern-luxury", "Luxury Modern"],
    ];

    return (
      <section className="premium-creator">
        <div className="premium-creator-heading">
          <span>??</span>
          <div>
            <h2>World Lab</h2>
            <p>
              Construye el universo visual de
              tu invitación.
            </p>
          </div>
        </div>

        <div className="premium-module-options">
          {worlds.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={
                experience.world === id
                  ? "premium-option active"
                  : "premium-option"
              }
              onClick={() =>
                updateExperience(
                  { world: id },
                  `Mundo seleccionado: ${label}.`
                )
              }
            >
              {experience.world === id
                ? "? "
                : ""}
              {label}
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderSceneSystem = () => (
    <section className="premium-creator">
      <div className="premium-creator-heading">
        <span>??</span>
        <div>
          <h2>Sistema de escenas</h2>
          <p>
            Crea y organiza las escenas de tu
            invitación.
          </p>
        </div>
      </div>

      <div className="premium-project-status">
        <span>Escenas creadas</span>
        <strong>
          {experience.scenes.length}
        </strong>

        <span>
          Mundo: {experience.world}
        </span>

        <span>
          Estilo: {experience.visualStyle}
        </span>
      </div>

      <div className="premium-actions">
        <button
          type="button"
          className="premium-main-button"
          onClick={createScene}
        >
          + Nueva escena
        </button>

        <button
          type="button"
          className="premium-secondary-button"
          onClick={() => {
            const next =
              resetPremiumExperience(
                eventId
              );

            setExperience(next);
            setEditingSceneId(null);
            notify(
              "Experiencia Premium restablecida."
            );
          }}
        >
          Restablecer
        </button>
      </div>

      {experience.scenes.length === 0 ? (
        <div className="premium-empty-state">
          <div className="premium-feature-icon">
            ?
          </div>

          <h3>
            Tu experiencia comienza aquí
          </h3>

          <p>
            Crea la primera escena de tu
            invitación.
          </p>

          <button
            type="button"
            className="premium-main-button"
            onClick={createScene}
          >
            Crear primera escena
          </button>
        </div>
      ) : (
        <div className="premium-scene-list">
          {experience.scenes.map(
            (scene, index) => (
              <article
                className="premium-scene-item"
                key={scene.id}
              >
                {editingSceneId ===
                scene.id ? (
                  <div
                    style={{
                      width: "100%",
                    }}
                  >
                    <input
                      value={sceneDraft.title}
                      onChange={(e) =>
                        setSceneDraft({
                          ...sceneDraft,
                          title: e.target.value,
                        })
                      }
                      placeholder="Título"
                    />

                    <textarea
                      value={
                        sceneDraft.description
                      }
                      onChange={(e) =>
                        setSceneDraft({
                          ...sceneDraft,
                          description:
                            e.target.value,
                        })
                      }
                      placeholder="Descripción"
                    />

                    <input
                      type="number"
                      min="1"
                      value={
                        sceneDraft.duration
                      }
                      onChange={(e) =>
                        setSceneDraft({
                          ...sceneDraft,
                          duration:
                            e.target.value,
                        })
                      }
                    />

                    <select
                      value={sceneDraft.type}
                      onChange={(e) =>
                        setSceneDraft({
                          ...sceneDraft,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="visual">
                        Visual
                      </option>
                      <option value="intro">
                        Introducción
                      </option>
                      <option value="story">
                        Historia
                      </option>
                      <option value="gallery">
                        Galería
                      </option>
                      <option value="final">
                        Final
                      </option>
                    </select>

                    <label>
                      <input
                        type="checkbox"
                        checked={
                          sceneDraft.interactive
                        }
                        onChange={(e) =>
                          setSceneDraft({
                            ...sceneDraft,
                            interactive:
                              e.target.checked,
                          })
                        }
                      />
                      Escena interactiva
                    </label>

                    <div className="premium-actions">
                      <button
                        type="button"
                        className="premium-main-button"
                        onClick={
                          saveSceneEdit
                        }
                      >
                        Guardar escena
                      </button>

                      <button
                        type="button"
                        className="premium-secondary-button"
                        onClick={() =>
                          setEditingSceneId(
                            null
                          )
                        }
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span>
                        Escena {index + 1}
                      </span>

                      <strong>
                        {scene.title}
                      </strong>

                      <small>
                        {scene.type} ·{" "}
                        {scene.duration}s
                      </small>

                      {scene.description && (
                        <p>
                          {scene.description}
                        </p>
                      )}
                    </div>

                    <div className="premium-actions">
                      <button
                        type="button"
                        className="premium-secondary-button"
                        onClick={() =>
                          startEditScene(
                            scene
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="premium-secondary-button"
                        onClick={() => {
                          setExperience(
                            duplicateScene(
                              experience,
                              scene.id
                            )
                          );

                          notify(
                            "Escena duplicada."
                          );
                        }}
                      >
                        Duplicar
                      </button>

                      <button
                        type="button"
                        className="premium-secondary-button"
                        onClick={() =>
                          deleteScene(
                            scene.id
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          )}
        </div>
      )}
    </section>
  );

  const renderVisualStyles = () => {
    const styles = [
      ["black-gold", "Black & Gold"],
      ["royal-gothic", "Royal Gothic"],
      ["burgundy", "Burgundy Luxury"],
      ["midnight", "Midnight"],
      ["romantic", "Romantic"],
      ["celestial", "Celestial"],
    ];

    return (
      <section className="premium-creator">
        <div className="premium-creator-heading">
          <span>??</span>
          <div>
            <h2>Estilos visuales</h2>
            <p>
              Define la estética principal de
              tu experiencia.
            </p>
          </div>
        </div>

        <div className="premium-module-options">
          {styles.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={
                experience.visualStyle === id
                  ? "premium-option active"
                  : "premium-option"
              }
              onClick={() =>
                updateExperience(
                  { visualStyle: id },
                  `Estilo "${label}" seleccionado.`
                )
              }
            >
              {experience.visualStyle === id
                ? "? "
                : ""}
              {label}
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderDreamExperiences = () => (
    <section className="premium-creator">
      <div className="premium-creator-heading">
        <span>?</span>
        <div>
          <h2>Experiencias Dream</h2>
          <p>
            Activa una experiencia inmersiva
            para tu invitación.
          </p>
        </div>
      </div>

      <div className="premium-module-options">
        <button
          type="button"
          className={
            experience.dreamExperience
              ? "premium-option active"
              : "premium-option"
          }
          onClick={() =>
            updateExperience(
              {
                dreamExperience:
                  !experience.dreamExperience,
              },
              experience.dreamExperience
                ? "Experiencia Dream desactivada."
                : "Experiencia Dream activada."
            )
          }
        >
          {experience.dreamExperience
            ? "? Dream activo"
            : "Dream desactivado"}
        </button>
      </div>

      <div className="premium-module-panel">
        <h3>Intensidad visual</h3>

        <input
          type="range"
          min="1"
          max="10"
          value={
            experience.dreamIntensity || 7
          }
          onChange={(e) =>
            updateExperience({
              dreamIntensity:
                Number(e.target.value),
            })
          }
        />

        <p>
          Nivel actual:{" "}
          <strong>
            {experience.dreamIntensity || 7}
          </strong>
          /10
        </p>
      </div>
    </section>
  );

  const renderThematicMaps = () => (
    <section className="premium-creator">
      <div className="premium-creator-heading">
        <span>???</span>
        <div>
          <h2>Mapas temáticos</h2>
          <p>
            Configura el mapa o ubicación de
            tu evento.
          </p>
        </div>
      </div>

      <input
        type="text"
        value={
          experience.thematicMap?.location ||
          ""
        }
        placeholder="Ubicación del evento"
        onChange={(e) =>
          updateExperience({
            thematicMap: {
              ...(experience.thematicMap || {}),
              location: e.target.value,
            },
          })
        }
      />

      <input
        type="url"
        value={
          experience.thematicMap?.url || ""
        }
        placeholder="URL del mapa"
        onChange={(e) =>
          updateExperience({
            thematicMap: {
              ...(experience.thematicMap || {}),
              url: e.target.value,
            },
          })
        }
      />

      <div className="premium-actions">
        <button
          type="button"
          className="premium-main-button"
          onClick={() => {
            const location =
              experience.thematicMap
                ?.location;

            if (!location) {
              notify(
                "Escribe primero una ubicación."
              );
              return;
            }

            const url =
              `https://www.google.com/maps/search/?api=1&query=` +
              encodeURIComponent(location);

            updateExperience(
              {
                thematicMap: {
                  ...(experience.thematicMap ||
                    {}),
                  location,
                  url,
                },
              },
              "Mapa preparado correctamente."
            );
          }}
        >
          Generar mapa
        </button>

        {experience.thematicMap?.url && (
          <button
            type="button"
            className="premium-secondary-button"
            onClick={() =>
              window.open(
                experience.thematicMap.url,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            Abrir mapa
          </button>
        )}
      </div>
    </section>
  );

  const renderVoice = () => (
    <section className="premium-creator">
      <div className="premium-creator-heading">
        <span>???</span>
        <div>
          <h2>Voz y locución</h2>
          <p>
            Escribe y prueba la locución de
            tu invitación.
          </p>
        </div>
      </div>

      <textarea
        value={
          experience.voice?.text || ""
        }
        placeholder="Escribe aquí la locución de tu invitación..."
        onChange={(e) =>
          updateExperience({
            voice: {
              ...(experience.voice || {}),
              text: e.target.value,
              enabled: true,
            },
          })
        }
      />

      <div className="premium-actions">
        <button
          type="button"
          className="premium-main-button"
          onClick={() => {
            const text =
              experience.voice?.text?.trim();

            if (!text) {
              notify(
                "Escribe primero un texto para la locución."
              );
              return;
            }

            if (
              "speechSynthesis" in window
            ) {
              window.speechSynthesis.cancel();

              const utterance =
                new SpeechSynthesisUtterance(
                  text
                );

              utterance.lang = "es-MX";
              utterance.rate = 0.9;

              window.speechSynthesis.speak(
                utterance
              );

              updateExperience(
                {
                  voice: {
                    ...(experience.voice ||
                      {}),
                    enabled: true,
                    configured: true,
                  },
                },
                "Locución reproducida y guardada."
              );
            } else {
              notify(
                "Tu navegador no permite reproducción de voz."
              );
            }
          }}
        >
          ? Probar locución
        </button>

        <button
          type="button"
          className="premium-secondary-button"
          onClick={() => {
            if (
              "speechSynthesis" in window
            ) {
              window.speechSynthesis.cancel();
            }

            notify("Locución detenida.");
          }}
        >
          ¦ Detener
        </button>
      </div>
    </section>
  );

  const addMedia = (type) => {
    const value = window.prompt(
      type === "image"
        ? "Introduce la URL de la imagen:"
        : "Introduce la URL del vídeo:"
    );

    if (!value?.trim()) return;

    const multimedia =
      experience.multimedia || {
        enabled: true,
        images: [],
        videos: [],
      };

    const key =
      type === "image"
        ? "images"
        : "videos";

    updateExperience(
      {
        multimedia: {
          ...multimedia,
          enabled: true,
          [key]: [
            ...(multimedia[key] || []),
            value.trim(),
          ],
        },
      },
      `${
        type === "image"
          ? "Imagen"
          : "Vídeo"
      } agregado.`
    );
  };

  const renderMultimedia = () => {
    const multimedia =
      experience.multimedia || {
        enabled: true,
        images: [],
        videos: [],
      };

    return (
      <section className="premium-creator">
        <div className="premium-creator-heading">
          <span>???</span>
          <div>
            <h2>Multimedia</h2>
            <p>
              Agrega imágenes y vídeos a tu
              experiencia.
            </p>
          </div>
        </div>

        <div className="premium-actions">
          <button
            type="button"
            className="premium-main-button"
            onClick={() =>
              addMedia("image")
            }
          >
            + Agregar imagen
          </button>

          <button
            type="button"
            className="premium-main-button"
            onClick={() =>
              addMedia("video")
            }
          >
            + Agregar vídeo
          </button>
        </div>

        <div className="premium-module-panel">
          <h3>
            Imágenes:{" "}
            {multimedia.images?.length || 0}
          </h3>

          {(multimedia.images || []).map(
            (url, index) => (
              <div
                key={`${url}-${index}`}
                className="premium-scene-item"
              >
                <div>
                  <strong>
                    Imagen {index + 1}
                  </strong>
                  <small>{url}</small>
                </div>

                <button
                  type="button"
                  className="premium-secondary-button"
                  onClick={() =>
                    updateExperience(
                      {
                        multimedia: {
                          ...multimedia,
                          images:
                            multimedia.images.filter(
                              (_, i) =>
                                i !== index
                            ),
                        },
                      },
                      "Imagen eliminada."
                    )
                  }
                >
                  Eliminar
                </button>
              </div>
            )
          )}

          <h3>
            Vídeos:{" "}
            {multimedia.videos?.length || 0}
          </h3>

          {(multimedia.videos || []).map(
            (url, index) => (
              <div
                key={`${url}-${index}`}
                className="premium-scene-item"
              >
                <div>
                  <strong>
                    Vídeo {index + 1}
                  </strong>
                  <small>{url}</small>
                </div>

                <button
                  type="button"
                  className="premium-secondary-button"
                  onClick={() =>
                    updateExperience(
                      {
                        multimedia: {
                          ...multimedia,
                          videos:
                            multimedia.videos.filter(
                              (_, i) =>
                                i !== index
                            ),
                        },
                      },
                      "Vídeo eliminado."
                    )
                  }
                >
                  Eliminar
                </button>
              </div>
            )
          )}
        </div>
      </section>
    );
  };

  const renderAvatars = () => (
    <section className="premium-creator">
      <div className="premium-creator-heading">
        <span>??</span>
        <div>
          <h2>Avatares</h2>
          <p>
            Configura el personaje que
            acompañará tu invitación.
          </p>
        </div>
      </div>

      <input
        type="text"
        value={
          experience.avatar?.name || ""
        }
        placeholder="Nombre del avatar"
        onChange={(e) =>
          updateExperience({
            avatar: {
              ...(experience.avatar || {}),
              name: e.target.value,
              enabled: true,
            },
          })
        }
      />

      <select
        value={
          experience.avatar?.style ||
          "royal"
        }
        onChange={(e) =>
          updateExperience({
            avatar: {
              ...(experience.avatar || {}),
              style: e.target.value,
              enabled: true,
            },
          })
        }
      >
        <option value="royal">
          Princesa / Príncipe
        </option>
        <option value="gothic">
          Gothic Fantasy
        </option>
        <option value="celestial">
          Celestial
        </option>
        <option value="elegant">
          Elegante
        </option>
        <option value="fantasy">
          Fantasía
        </option>
      </select>

      <textarea
        value={
          experience.avatar?.description ||
          ""
        }
        placeholder="Describe el avatar..."
        onChange={(e) =>
          updateExperience({
            avatar: {
              ...(experience.avatar || {}),
              description:
                e.target.value,
              enabled: true,
            },
          })
        }
      />

      <button
        type="button"
        className="premium-main-button"
        onClick={() => {
          updateExperience(
            {
              avatar: {
                ...(experience.avatar || {}),
                enabled: true,
                configured: true,
              },
            },
            "? Avatar preparado y guardado."
          );
        }}
      >
        {experience.avatar?.configured
          ? "? Avatar configurado"
          : "Preparar avatar"}
      </button>

      {experience.avatar?.configured && (
        <div className="premium-module-panel">
          <h3>
            {experience.avatar.name ||
              "Avatar Premium"}
          </h3>

          <p>
            Estilo:{" "}
            {experience.avatar.style ||
              "royal"}
          </p>

          <p>
            {experience.avatar.description ||
              "Sin descripción todavía."}
          </p>
        </div>
      )}
    </section>
  );

  const renderEventControl = () => {
    const control =
      experience.eventControl || {
        enabled: true,
        confirmations: true,
        qrAccess: true,
      };

    return (
      <section className="premium-creator">
        <div className="premium-creator-heading">
          <span>???</span>
          <div>
            <h2>Control del evento</h2>
            <p>
              Configura confirmaciones y
              acceso QR.
            </p>
          </div>
        </div>

        <div className="premium-module-options">
          <button
            type="button"
            className={
              control.confirmations
                ? "premium-option active"
                : "premium-option"
            }
            onClick={() =>
              updateExperience({
                eventControl: {
                  ...control,
                  confirmations:
                    !control.confirmations,
                },
              })
            }
          >
            {control.confirmations
              ? "? Confirmaciones activas"
              : "Confirmaciones desactivadas"}
          </button>

          <button
            type="button"
            className={
              control.qrAccess
                ? "premium-option active"
                : "premium-option"
            }
            onClick={() =>
              updateExperience({
                eventControl: {
                  ...control,
                  qrAccess:
                    !control.qrAccess,
                },
              })
            }
          >
            {control.qrAccess
              ? "? Acceso QR activo"
              : "Acceso QR desactivado"}
          </button>
        </div>

        <div className="premium-module-panel">
          <h3>Estado del control</h3>

          <p>
            Confirmaciones:{" "}
            {control.confirmations
              ? "activadas"
              : "desactivadas"}
          </p>

          <p>
            Acceso QR:{" "}
            {control.qrAccess
              ? "activado"
              : "desactivado"}
          </p>
        </div>
      </section>
    );
  };

  const renderDistribution = () => {
    const distribution =
      experience.distribution || {
        whatsapp: true,
        web: true,
      };

    const invitationUrl =
      getInvitationUrl();

    return (
      <section className="premium-creator">
        <div className="premium-creator-heading">
          <span>??</span>
          <div>
            <h2>Distribución</h2>
            <p>
              Prepara y comparte tu
              invitación Premium.
            </p>
          </div>
        </div>

        <div className="premium-module-options">
          <button
            type="button"
            className={
              distribution.whatsapp
                ? "premium-option active"
                : "premium-option"
            }
            onClick={() =>
              updateExperience({
                distribution: {
                  ...distribution,
                  whatsapp:
                    !distribution.whatsapp,
                },
              })
            }
          >
            {distribution.whatsapp
              ? "? WhatsApp activo"
              : "WhatsApp desactivado"}
          </button>

          <button
            type="button"
            className={
              distribution.web
                ? "premium-option active"
                : "premium-option"
            }
            onClick={() =>
              updateExperience({
                distribution: {
                  ...distribution,
                  web: !distribution.web,
                },
              })
            }
          >
            {distribution.web
              ? "? Enlace web activo"
              : "Enlace web desactivado"}
          </button>
        </div>

        <div className="premium-module-panel">
          <h3>
            Enlace de invitación
          </h3>

          <input
            type="text"
            readOnly
            value={invitationUrl}
          />

          <div className="premium-actions">
            <button
              type="button"
              className="premium-main-button"
              onClick={() =>
                copyText(
                  invitationUrl,
                  "Enlace copiado."
                )
              }
            >
              Copiar enlace
            </button>

            {distribution.web && (
              <button
                type="button"
                className="premium-secondary-button"
                onClick={() =>
                  window.open(
                    invitationUrl,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Abrir invitación
              </button>
            )}
          </div>
        </div>

        {distribution.whatsapp && (
          <div className="premium-module-panel">
            <h3>
              Compartir por WhatsApp
            </h3>

            <p>
              Genera automáticamente un
              mensaje con el nombre del
              evento y el enlace.
            </p>

            <button
              type="button"
              className="premium-main-button"
              onClick={openWhatsApp}
            >
              ?? Preparar WhatsApp
            </button>
          </div>
        )}
      </section>
    );
  };

  const renderActiveModule = () => {
    switch (activeCategory) {
      case "world-lab":
        return renderWorldLab();

      case "scene-system":
        return renderSceneSystem();

      case "visual-styles":
        return renderVisualStyles();

      case "dream-experiences":
        return renderDreamExperiences();

      case "thematic-maps":
        return renderThematicMaps();

      case "voice":
        return renderVoice();

      case "multimedia":
        return renderMultimedia();

      case "avatars":
        return renderAvatars();

      case "event-control":
        return renderEventControl();

      case "distribution":
        return renderDistribution();

      default:
        return renderSceneSystem();
    }
  };

  return (
    <section className="sirius-premium-studio">
      <header className="premium-header">
        <div>
          <span className="premium-kicker">
            SIRIUS H&S · PREMIUM
          </span>

          <h1>
            Premium Experience Studio
          </h1>

          <p>
            Diseña experiencias visuales,
            interactivas y multimedia para
            tus invitaciones.
          </p>

          {event?.name && (
            <p className="premium-event-name">
              Evento:{" "}
              <strong>{event.name}</strong>
            </p>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            className="premium-close"
            onClick={onClose}
          >
            Cerrar
          </button>
        )}
      </header>

      <div className="premium-categories">
        {featureItems.map((feature) => (
          <button
            key={feature.id}
            type="button"
            className={
              activeCategory === feature.id
                ? "premium-category active"
                : "premium-category"
            }
            onClick={() =>
              selectModule(feature.id)
            }
          >
            {feature.label}
          </button>
        ))}
      </div>

      <section className="premium-feature-grid">
        {featureItems.map((feature) => (
          <article
            key={feature.id}
            className={
              activeCategory === feature.id
                ? "premium-feature-card active"
                : "premium-feature-card"
            }
          >
            <div className="premium-feature-icon">
              ?
            </div>

            <h3>{feature.label}</h3>

            <p>
              Configura y guarda esta
              herramienta Premium para el
              evento actual.
            </p>

            <button
              type="button"
              onClick={() =>
                selectModule(feature.id)
              }
            >
              Abrir módulo
            </button>
          </article>
        ))}
      </section>

      {message && (
        <div className="premium-message">
          {message}
        </div>
      )}

      {renderActiveModule()}
    </section>
  );
}


