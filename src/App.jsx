 import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import { LANGUAGES, getSavedLanguage, saveLanguage, t } from "./lib/i18n";
import { detectSiriusCommand, executeSiriusCommand } from "./lib/siriusCommands";
import { createSiriusState } from "./lib/siriusState";
import { PremiumStudio } from './premium';
import SiriusAssistant from "./ai/SiriusAssistant";
import {
  getCurrentUser,
  getProfile,
  createProfile,
  getPremiumStatus,
} from "./lib/siriusApi";
// Sirius H&S — Modo propietaria
// En la versión actual no existe todavía un sistema de cuentas/autenticación.
// Por eso este modo identifica la instalación de la creadora durante las pruebas.
// Antes de publicar para usuarios reales, OWNER_MODE debe sustituirse por
// una validación de cuenta en servidor.
const OWNER_MODE = true;

function App() {
const [language, setLanguage] = useState(getSavedLanguage);

  useEffect(() => {
    saveLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const [activeSection, setActiveSection] = useState("inicio");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // Sirius H&S Premium: estado local de acceso.
  // IMPORTANTE: la activación real de pago debe validarse en un backend.
  const [premiumEnabled, setPremiumEnabled] = useState(() => {
    if (OWNER_MODE) {
      return true;
    }

    return localStorage.getItem("siriusHS_premium") === "true";
  });

  const [premiumMessage, setPremiumMessage] = useState("");
// =========================================================
// CUENTA Y PERFIL SUPABASE
// =========================================================

const [currentUser, setCurrentUser] = useState(null);
const [userProfile, setUserProfile] = useState(null);
const [accountLoading, setAccountLoading] = useState(true);
const [accountError, setAccountError] = useState("");
const [supabasePremium, setSupabasePremium] = useState(false);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("siriusHS_events");
    return saved ? JSON.parse(saved) : [];
  });

  const [guests, setGuests] = useState(() => {
    const saved = localStorage.getItem("siriusHS_guests");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedEventId, setSelectedEventId] = useState("");

  const [eventData, setEventData] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    passes: 1,
  });

  const [guestData, setGuestData] = useState({
    name: "",
    phone: "",
    passes: 1,
  });

  const [scanMessage, setScanMessage] = useState("");
  const [scanGuest, setScanGuest] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    video.play().catch((error) => {
      console.error("No se pudo reproducir la cámara:", error);
    });

    return () => {
      if (video) {
        video.pause();
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    localStorage.setItem(
      "siriusHS_events",
      JSON.stringify(events)
    );
  }, [events]);

  useEffect(() => {
    localStorage.setItem(
      "siriusHS_guests",
      JSON.stringify(guests)
    );
  }, [guests]);

  useEffect(() => {
    localStorage.setItem("siriusHS_premium", String(premiumEnabled));
  }, [premiumEnabled]);
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);


  const activatePremiumDemo = () => {
    setPremiumEnabled(true);
    setPremiumMessage(
      "Premium activado en este dispositivo. Para cobrar pagos reales, conecta una pasarela y valida el pago en un servidor."
    );
  };

  const deactivatePremium = () => {
    if (OWNER_MODE) {
      setPremiumEnabled(true);
      setPremiumMessage(
        "👑 Modo propietaria activo: tu acceso Premium no se puede desactivar."
      );
      return;
    }

    setPremiumEnabled(false);
    setPremiumMessage("Premium desactivado en este dispositivo.");
  };

  const requirePremium = (action) => {
    if (premiumEnabled) {
      if (typeof action === "function") action();
      return true;
    }

    setActiveSection("premium");
    setPremiumMessage(
      "Esta herramienta pertenece a Sirius H&S Premium. Activa Premium para continuar."
    );
    return false;
  };

  const changeSection = (section) => {
    if (section !== "confirmaciones") {
      stopCamera();
    }

    setActiveSection(section);
    setShowCreateEvent(false);
    setShowAddGuest(false);
    setSelectedInvitation(null);
    setScanMessage("");
    setScanGuest(null);
    setCameraError("");
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;

    setEventData((old) => ({
      ...old,
      [name]: value,
    }));
  };

  const handleGuestChange = (e) => {
    const { name, value } = e.target;

    setGuestData((old) => ({
      ...old,
      [name]: value,
    }));
  };

  const createEvent = (e) => {
    e.preventDefault();

    if (
      !eventData.name ||
      !eventData.date ||
      !eventData.location
    ) {
      alert(
        "Completa el nombre, fecha y lugar del evento."
      );
      return;
    }

    const newEvent = {
      id: Date.now(),
      name: eventData.name,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      passes: Number(eventData.passes),
    };

    setEvents((old) => [...old, newEvent]);

    setEventData({
      name: "",
      date: "",
      time: "",
      location: "",
      passes: 1,
    });

    setSelectedEventId(String(newEvent.id));
    setShowCreateEvent(false);
    setActiveSection("eventos");

    alert(
      `📅 Evento "${newEvent.name}" creado correctamente!`
    );
  };

  const addGuest = (e) => {
    e.preventDefault();

    if (!selectedEventId) {
      alert("Primero selecciona un evento.");
      return;
    }

    if (!guestData.name) {
      alert("Escribe el nombre del invitado.");
      return;
    }

    const newGuest = {
      id: Date.now(),
      eventId: Number(selectedEventId),
      name: guestData.name,
      phone: guestData.phone,
      passes: Number(guestData.passes),
      qrUsed: false,
      confirmed: false,
    };

    setGuests((old) => [...old, newGuest]);

    setGuestData({
      name: "",
      phone: "",
      passes: 1,
    });

    setShowAddGuest(false);

    alert(
      `👤 Invitado "${newGuest.name}" agregado correctamente!`
    );
  };

  const getEvent = (eventId) => {
    return events.find(
      (event) => event.id === Number(eventId)
    );
  };

  const getGuests = (eventId) => {
    return guests.filter(
      (guest) => guest.eventId === Number(eventId)
    );
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const createQRUrl = (guest) => {
    const event = getEvent(guest.eventId);

    const qrData = JSON.stringify({
      app: "SiriusHS",
      guestId: guest.id,
      eventId: guest.eventId,
      guest: guest.name,
      event: event?.name || "",
      passes: guest.passes,
    });

    return (
      "https://api.qrserver.com/v1/create-qr-code/" +
      `?size=300x300&data=${encodeURIComponent(qrData)}`
    );
  };

  const openInvitation = (guest) => {
    const event = getEvent(guest.eventId);

    if (!event) {
      alert("No se encontró el evento de este invitado.");
      return;
    }

    setSelectedInvitation({
      guest,
      event,
    });
  };

  const closeInvitation = () => {
    setSelectedInvitation(null);
  };

  const validateQR = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);

      if (
        data.app !== "SiriusHS" &&
        data.app !== "InvitaQR"
      ) {
        setScanMessage(
          "❌ Este QR no pertenece a Sirius H&S."
        );
        setScanGuest(null);
        return false;
      }

      if (!data.guestId || !data.eventId) {
        setScanMessage(
          "❌ Este QR no contiene una invitación válida."
        );
        setScanGuest(null);
        return false;
      }

      const guest = guests.find(
        (item) => item.id === Number(data.guestId)
      );

      if (!guest) {
        setScanMessage(
          "❌ Invitado no encontrado."
        );
        setScanGuest(null);
        return false;
      }
      const totalPasses = Math.max(
        1,
        Number(guest.passes || 1)
      );

      const alreadyUsed = Math.max(
        0,
        Number(guest.passesUsed || 0)
      );

      const remainingPasses =
        totalPasses - alreadyUsed;

      if (remainingPasses <= 0) {

        setScanMessage(
          "🔴 Todos los pases de este invitado ya fueron utilizados."
        );

        setScanGuest({
          ...guest,
          passesUsed: totalPasses,
          qrUsed: true,
          confirmed: true,
        });

        return;
      }

      const newPassesUsed =
        alreadyUsed + 1;

      const newRemainingPasses =
        totalPasses - newPassesUsed;

      const qrNowUsed =
        newPassesUsed >= totalPasses;

      setGuests((old) =>
        old.map((item) =>
          item.id === guest.id
            ? {
                ...item,
                passesUsed: newPassesUsed,
                qrUsed: qrNowUsed,
                confirmed: true,
              }
            : item
        )
      );

      setScanGuest({
        ...guest,
        passesUsed: newPassesUsed,
        qrUsed: qrNowUsed,
        confirmed: true,
      });

      if (newRemainingPasses > 0) {

        setScanMessage(
          `✅ Pase válido. Quedan ${newRemainingPasses} pase(s) disponibles.`
        );

      } else {

        setScanMessage(
          "✅ Último pase utilizado. Invitación agotada."
        );

      }
return true;
    } catch {
      setScanMessage(
        "❌ El QR no es válido."
      );

      setScanGuest(null);

      return false;
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current) {
      return;
    }

    if (!streamRef.current) {
      return;
    }

    if (
      videoRef.current.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      scanTimerRef.current = setTimeout(
        scanQRCode,
        300
      );

      return;
    }

    try {
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({
          formats: ["qr_code"],
        });

        const barcodes =
          await detector.detect(
            videoRef.current
          );

        if (barcodes.length > 0) {
          const value =
            barcodes[0].rawValue;

          if (value) {
            const valid = validateQR(value);

            if (valid) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "🔴 Pase utilizado"
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "❌ Invitado no encontrado."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "❌ Este QR no pertenece a Sirius H&S."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "❌ Este QR no contiene una invitación válida."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "❌ El QR no es válido."
            ) {
              stopCamera();
              return;
            }
          }
        }
      } else {
        setCameraError(
          "Tu navegador abrió la cámara, pero no tiene disponible el lector automático de códigos QR."
        );

        return;
      }
    } catch (error) {
      console.log(
        "Error leyendo QR:",
        error
      );
    }

    if (streamRef.current) {
      scanTimerRef.current = setTimeout(
        scanQRCode,
        400
      );
    }
  };

  const startCamera = async () => {
    setCameraError("");
    setScanMessage("");
    setScanGuest(null);

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Tu navegador no permite acceder a la cámara."
        );

        return;
      }

      stopCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      setCameraActive(true);

      setTimeout(() => {
        scanQRCode();
      }, 500);
    } catch (error) {
      console.error(
        "No se pudo abrir la cámara:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setCameraError(
          "Permiso de cámara denegado. Permite el acceso a la cámara en tu navegador."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        setCameraError(
          "No se encontró ninguna cámara."
        );
      } else {
        setCameraError(
          "No se pudo abrir la cámara."
        );
      }

      setCameraActive(false);
    }
  };

  const renderInicio = () => {
    const confirmed = guests.filter(
      (guest) => guest.confirmed
    ).length;

    const used = guests.filter(
      (guest) => guest.qrUsed
    ).length;

    return (
      <>
        <header className="topbar">
          <div>
            <p className="welcome">
              Panel de administración
            </p>

            <h2>📷Hola! 👋</h2>
          </div>

          <button
            className="create-button"
            onClick={() =>
              setShowCreateEvent(true)
            }
          >
            + Crear evento
          </button>
        </header>

        <section className="hero">
          <div>
            <span className="hero-label">
              SIRIUS H&S 📷 INVITACIONES INTELIGENTES
            </span>

            <h2>
              Haz que cada invitación
              <br />
              sea especial.
            </h2>

            <p>
              Crea eventos, administra invitados,
              genera códigos QR y controla la
              asistencia desde un solo lugar.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              Crear mi primer evento →
            </button>
          </div>

          <div className="hero-card">
            <div className="qr-placeholder">
              <div className="qr-pattern">
                <span>📍</span>
              </div>
            </div>

            <div className="ticket-info">
              <span>INVITACIÓN</span>

              <strong>
                Mi próximo evento
              </strong>

              <small>
                QR único para cada invitado
              </small>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon">✦</div>

            <div>
              <span>Eventos</span>
              <strong>{events.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">♙</div>

            <div>
              <span>Invitados</span>
              <strong>{guests.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>

            <div>
              <span>Confirmados</span>
              <strong>{confirmed}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📍</div>

            <div>
              <span>Pases utilizados</span>
              <strong>{used}</strong>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h3>Mis eventos</h3>

              <p>
                Administra tus eventos y sus
                invitaciones.
              </p>
            </div>

            <button
              className="outline-button"
              onClick={() =>
                changeSection("eventos")
              }
            >
              Ver todos
            </button>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>

              <h3>
                Aún no tienes eventos
              </h3>

              <p>
                Crea tu primer evento y comienza
                a enviar invitaciones inteligentes.
              </p>

              <button
                className="create-button"
                onClick={() =>
                  setShowCreateEvent(true)
                }
              >
                + Crear evento
              </button>
            </div>
          ) : (
            <div className="events-list">
              {events.map((event) => (
                <div
                  className="event-card"
                  key={event.id}
                >
                  <div className="event-card-icon">
                    ✦
                  </div>

                  <div className="event-card-info">
                    <h3>{event.name}</h3>

                    <p>
                      📅{" "}
                      {formatDate(event.date)}
                      {event.time &&
                        ` 📷 ${event.time}`}
                    </p>

                    <p>
                      📍 {event.location}
                    </p>

                    <small>
                      {
                        getGuests(event.id).length
                      }{" "}
                      invitado(s)
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  const renderEventos = () => {
    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Mis eventos</h3>

            <p>
              Administra tus eventos y sus
              invitaciones.
            </p>
          </div>

          <button
            className="create-button"
            onClick={() =>
              setShowCreateEvent(true)
            }
          >
            + Crear evento
          </button>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>

            <h3>
              Aún no tienes eventos
            </h3>

            <button
              className="create-button"
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              + Crear evento
            </button>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div
                className="event-card"
                key={event.id}
              >
                <div className="event-card-icon">
                  ✦
                </div>

                <div className="event-card-info">
                  <h3>{event.name}</h3>

                  <p>
                    📅{" "}
                    {formatDate(event.date)}
                    {event.time &&
                      ` 📷 ${event.time}`}
                  </p>

                  <p>
                    📍 {event.location}
                  </p>

                  <small>
                    {
                      getGuests(event.id).length
                    }{" "}
                    invitado(s)
                  </small>
                </div>

                <button
                  className="outline-button"
                  onClick={() => {
                    setSelectedEventId(
                      String(event.id)
                    );
                    changeSection(
                      "invitados"
                    );
                  }}
                >
                  Invitados
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderInvitados = () => {
    const selectedGuests =
      selectedEventId
        ? getGuests(selectedEventId)
        : [];

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Invitados</h3>

            <p>
              Administra los invitados de tus
              eventos.
            </p>
          </div>

          <button
            className="create-button"
            onClick={() =>
              setShowAddGuest(true)
            }
          >
            + Agregar invitado
          </button>
        </div>

        <div className="form-group">
          <label>
            Selecciona un evento
          </label>

          <select
            value={selectedEventId}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value
              )
            }
          >
            <option value="">
              Selecciona un evento
            </option>

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedEventId ? (
          <div className="empty-state">
            <div className="empty-icon">♙</div>

            <h3>
              Selecciona un evento
            </h3>

            <p>
              Elige un evento para ver sus
              invitados.
            </p>
          </div>
        ) : selectedGuests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♙</div>

            <h3>
              Aún no hay invitados
            </h3>

            <p>
              Agrega el primer invitado de este
              evento.
            </p>

            <button
              className="create-button"
              onClick={() =>
                setShowAddGuest(true)
              }
            >
              + Agregar invitado
            </button>
          </div>
        ) : (
          <div className="events-list">
            {selectedGuests.map((guest) => (
              <div
                className="event-card"
                key={guest.id}
              >
                <div className="event-card-icon">
                  ♙
                </div>

                <div className="event-card-info">
                  <h3>{guest.name}</h3>

                  <p>
                    {guest.phone ||
                      "Sin teléfono"}
                  </p>

                  <small>
                    <div className="guest-passes-info">
  <div>
    🎟️ <strong>Pases asignados:</strong>{" "}
    {Math.max(1, Number(guest.passes || 1))}
  </div>
  <div>
    🟢 <strong>Pases disponibles:</strong>{" "}
    {Math.max(
      0,
      Number(guest.passes || 1) -
        Number(guest.passesUsed || 0)
    )}
  </div>
</div>
                    {" 📷 "}
                    {guest.qrUsed
                      ? "🔴 Pase utilizado"
                      : "🟢 Pase disponible"}
                  </small>
                </div>

                <div className="guest-actions">
                  <button
                    className="outline-button"
                    onClick={() =>
                      openInvitation(guest)
                    }
                  >
                    Ver invitación
                  </button>

                  <button
                    className="outline-button"
                    onClick={() => {
                      setSelectedEventId(
                        String(guest.eventId)
                      );
                      changeSection("qr");
                    }}
                  >
                    Ver QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderQR = () => {
    const selectedGuests =
      selectedEventId
        ? getGuests(selectedEventId)
        : [];

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Códigos QR</h3>

            <p>
              Cada invitado tiene un QR único.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label>
            Selecciona un evento
          </label>

          <select
            value={selectedEventId}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value
              )
            }
          >
            <option value="">
              Selecciona un evento
            </option>

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGuests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📍</div>

            <h3>
              No hay invitados
            </h3>

            <p>
              Agrega invitados para generar
              sus códigos QR.
            </p>
          </div>
        ) : (
          <div className="qr-grid">
            {selectedGuests.map((guest) => (
              <div
                className="qr-card"
                key={guest.id}
              >
                <div className="qr-card-image">
                  <img
                    src={createQRUrl(guest)}
                    alt={`QR de ${guest.name}`}
                  />
                </div>

                <div className="qr-card-info">
                  <span>INVITACIÓN</span>

                  <h3>{guest.name}</h3>

                  <p>
                    {
                      getEvent(
                        guest.eventId
                      )?.name
                    }
                  </p>

                  <small>
                    <div className="guest-passes-info">
  <div>
    🎟️ <strong>Pases asignados:</strong>{" "}
    {Math.max(1, Number(guest.passes || 1))}
  </div>
  <div>
    🟢 <strong>Pases disponibles:</strong>{" "}
    {Math.max(
      0,
      Number(guest.passes || 1) -
        Number(guest.passesUsed || 0)
    )}
  </div>
</div>
                  </small>

                  <p>
                    {guest.qrUsed
                      ? "🔴 Pase utilizado"
                      : "🟢 Pase disponible"}
                  </p>
                </div>

                <button
                  className="create-button"
                  onClick={() =>
                    window.open(
                      createQRUrl(guest),
                      "_blank"
                    )
                  }
                >
                  Abrir QR
                </button>

                <button
                  className="outline-button"
                  onClick={() =>
                    openInvitation(guest)
                  }
                >
                  Ver invitación
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderConfirmaciones = () => {
    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Confirmaciones</h3>

            <p>
              Valida la entrada de tus invitados.
            </p>
          </div>
        </div>

        <div className="scanner-box">
          <h3>
            Escanear código QR
          </h3>

          <p>
            Apunta la cámara al código QR de
            la invitación.
          </p>

          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              margin: "20px auto",
              borderRadius: "20px",
              overflow: "hidden",
              background: "#111",
              position: "relative",
              minHeight: cameraActive
                ? "360px"
                : "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: "20px",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    width: "65%",
                    height: "65%",
                    border:
                      "3px solid white",
                    borderRadius: "18px",
                    pointerEvents: "none",
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  color: "white",
                  textAlign: "center",
                  padding: "35px",
                }}
              >
                <div
                  style={{
                    fontSize: "55px",
                    marginBottom: "10px",
                  }}
                >
                  📷
                </div>

                <strong>
                  Cámara apagada
                </strong>

                <p
                  style={{
                    marginTop: "8px",
                    opacity: 0.8,
                  }}
                >
                  Presiona el botón para
                  comenzar.
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <div
              className="scan-result"
              style={{
                marginBottom: "15px",
              }}
            >
              <p>
                ⚠️ {cameraError}
              </p>
            </div>
          )}

          <div
            className="modal-actions"
            style={{
              justifyContent: "center",
            }}
          >
            {!cameraActive ? (
              <button
                className="create-button"
                onClick={startCamera}
              >
                📷 Abrir cámara
              </button>
            ) : (
              <button
                className="cancel-button"
                onClick={stopCamera}
              >
                ✕ Detener cámara
              </button>
            )}
          </div>
        </div>

        {scanMessage && (
          <div
            className="scan-result"
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <h2>{scanMessage}</h2>

            {scanGuest && (
              <div
                style={{
                  marginTop: "15px",
                }}
              >
                <p>
                  Invitado:{" "}
                  <strong>
                    {scanGuest.name}
                  </strong>
                </p>

                <p>
                  Pases:{" "}
                  <strong>
                    <div className="scan-passes-info">
  <div>
    🎟️ <strong>Pases asignados:</strong>{" "}
    {Math.max(1, Number(scanGuest.passes || 1))}
  </div>
  <div>
    🟢 <strong>Pases disponibles:</strong>{" "}
    {Math.max(
      0,
      Number(scanGuest.passes || 1) -
        Number(scanGuest.passesUsed || 0)
    )}
  </div>
</div>
                  </strong>
                </p>

                {getEvent(
                  scanGuest.eventId
                ) && (
                  <p>
                    Evento:{" "}
                    <strong>
                      {
                        getEvent(
                          scanGuest.eventId
                        ).name
                      }
                    </strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const renderMapa = () => {
    const selectedEvent =
      selectedEventId
        ? getEvent(selectedEventId)
        : null;

    const mapUrl = selectedEvent
      ? `https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(
          selectedEvent.location
        )}`
      : "";

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Mapa</h3>

            <p>
              Ubica el lugar de tu evento.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label>
            Selecciona un evento
          </label>

          <select
            value={selectedEventId}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value
              )
            }
          >
            <option value="">
              Selecciona un evento
            </option>

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedEvent ? (
          <div className="empty-state">
            <div className="empty-icon">📷</div>

            <h3>
              Selecciona un evento
            </h3>

            <p>
              Elige un evento para mostrar
              su ubicación.
            </p>
          </div>
        ) : (
          <div className="map-card">
            <h3>{selectedEvent.name}</h3>

            <p>
              📍 {selectedEvent.location}
            </p>

            <div className="map-container">
              <iframe
                title={`Mapa de ${selectedEvent.name}`}
                src={mapUrl}
                width="100%"
                height="450"
                style={{
                  border: 0,
                  borderRadius: "18px",
                }}
                loading="lazy"
              />
            </div>

            <a
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                selectedEvent.location
              )}`}
              target="_blank"
              rel="noreferrer"
              className="outline-button map-link"
            >
              Abrir mapa completo
            </a>
          </div>
        )}
      </section>
    );
  };

  const renderConfiguracion = () => {
    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="hero-label">
              SIRIUS H&S
            </span>

            <h3>Configuración</h3>

            <p>
              Configuración general de tu aplicación.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">⚙</div>

          <h3>
            Configuración
          </h3>

          <p>
            Próximamente podrás personalizar
            más opciones de Sirius H&S.
          </p>
        </div>
      </section>
    );
  };


  const renderPremium = () => {
    const selectedEvent = selectedEventId
      ? events.find((item) => item.id === selectedEventId)
      : null;

    if (!premiumEnabled && !OWNER_MODE) {
      setPremiumMessage(
        "Esta herramienta pertenece a Sirius H&S Premium. Activa Premium para continuar."
      );
      return null;
    }

    return (
      <PremiumStudio
        event={selectedEvent}
        onClose={() => setActiveSection("inicio")}
      />
    );
  };
  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ♛

        <div className="language-selector">
          <span className="language-label">?? Idioma</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Seleccionar idioma"
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.name}
              </option>
            ))}
          </select>
        </div>
          </div>

          <div>
            <h1>
              Sirius H&S
            </h1>

            <span>
              Invitaciones inteligentes
            </span>
          </div>

        </div>

        <nav>

          <button
            className={`nav-item ${
              activeSection === "inicio"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("inicio")
            }
          >
            <span>⌂</span>
            Inicio
          </button>

          <button
            className={`nav-item ${
              activeSection === "eventos"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("eventos")
            }
          >
            <span>✦</span>
            Mis eventos
          </button>

          <button
            className={`nav-item ${
              activeSection === "invitados"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("invitados")
            }
          >
            <span>♙</span>
            Invitados
          </button>

          <button
            className={`nav-item ${
              activeSection === "qr"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("qr")
            }
          >
            <span>📍</span>
            Códigos QR
          </button>

          <button
            className={`nav-item ${
              activeSection === "confirmaciones"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("confirmaciones")
            }
          >
            <span>✓</span>
            Confirmaciones
          </button>

          <button
            className={`nav-item ${
              activeSection === "mapa"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("mapa")
            }
          >
            <span>📷</span>
            Mapa
          </button>

          <button
            className={`nav-item ${
              activeSection === "configuracion"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("configuracion")
            }
          >
            <span>⚙</span>
            Configuración
          </button>

          <button
            className={`nav-item premium-nav-item ${
              activeSection === "premium"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("premium")
            }
          >
            <span>♛</span>
            Desbloqueos Premium
          </button>
          <button
            className={`nav-item sirius-ai-nav-item ${
              activeSection === "assistant"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("assistant")
            }
          >
            <span>✧</span>
            Sirius AI
          </button>
        </nav>

        <div className="sidebar-bottom">

          <div className="help-box">

            <strong>
              📷Necesitas ayuda?
            </strong>

            <p>
              Configura tu evento paso a paso.
            </p>

            <button>
              Ver guía
            </button>

          </div>

          <div className="profile">

            <div className="avatar">
              U
            </div>

            <div>
              <strong>
                Mi cuenta
              </strong>

              <span>
                {premiumEnabled ? "Plan Premium" : "Plan Gratis"}
              </span>
            </div>

          </div>

        </div>

      </aside>

<main className="main">

        {activeSection === "inicio" &&
          renderInicio()}

        {activeSection === "eventos" &&
          renderEventos()}

        {activeSection === "invitados" &&
          renderInvitados()}

        {activeSection === "qr" &&
          renderQR()}

        {activeSection === "confirmaciones" &&
          renderConfirmaciones()}

        {activeSection === "mapa" &&
          renderMapa()}

        {activeSection === "configuracion" &&
          renderConfiguracion()}

        {activeSection === "premium" &&
          renderPremium()}

        {activeSection === "assistant" && (
          <SiriusAssistant
            project={
              selectedEventId
                ? events.find(
                    (item) => item.id === selectedEventId
                  )
                : null
            }
            onApplySuggestion={(projectUpdate) => {
              console.log("Sirius AI → proyecto:", projectUpdate);

              if (!projectUpdate) return;

              setEventData((previous) => ({
                ...previous,
                ...(projectUpdate.name !== undefined
                  ? { name: projectUpdate.name }
                  : {}),
                ...(projectUpdate.date !== undefined
                  ? { date: projectUpdate.date }
                  : {}),
                ...(projectUpdate.time !== undefined
                  ? { time: projectUpdate.time }
                  : {}),
                ...(projectUpdate.location !== undefined
                  ? { location: projectUpdate.location }
                  : {}),
                ...(projectUpdate.passes !== undefined
                  ? { passes: Number(projectUpdate.passes) || 1 }
                  : {}),
              }));

              setShowCreateEvent(true);
            }}
          />
        )}

      </main>

      {showCreateEvent && (
        <div className="modal-overlay">

          <div className="event-modal">

            <div className="modal-header">

              <div>

                <span className="hero-label">
                  NUEVO EVENTO
                </span>

                <h2>
                  Crear evento
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCreateEvent(false)
                }
              >
                📷
              </button>

            </div>

            <form onSubmit={createEvent}>

              <div className="form-group">

                <label>
                  Nombre del evento
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Ej. Boda de María y Juan"
                  value={eventData.name}
                  onChange={handleEventChange}
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Fecha
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={eventData.date}
                    onChange={handleEventChange}
                  />

                </div>

                <div className="form-group">

                  <label>
                    Hora
                  </label>

                  <input
                    type="time"
                    name="time"
                    value={eventData.time}
                    onChange={handleEventChange}
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Lugar del evento
                </label>

                <input
                  type="text"
                  name="location"
                  placeholder="Ej. Zócalo de Veracruz"
                  value={eventData.location}
                  onChange={handleEventChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Pases por invitado
                </label>

                <select
                  name="passes"
                  value={eventData.passes}
                  onChange={handleEventChange}
                >

                  <option value="1">
                    1 pase
                  </option>

                  <option value="2">
                    2 pases
                  </option>

                  <option value="3">
                    3 pases
                  </option>

                  <option value="4">
                    4 pases
                  </option>

                  <option value="5">
                    5 pases
                  </option>

                </select>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowCreateEvent(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="create-button"
                >
                  Crear evento
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {showAddGuest && (
        <div className="modal-overlay">

          <div className="event-modal">

            <div className="modal-header">

              <div>

                <span className="hero-label">
                  NUEVO INVITADO
                </span>

                <h2>
                  Agregar invitado
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddGuest(false)
                }
              >
                📷
              </button>

            </div>

            <form onSubmit={addGuest}>

              <div className="form-group">

                <label>
                  Nombre del invitado
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Ej. María López"
                  value={guestData.name}
                  onChange={handleGuestChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Teléfono
                </label>

                <input
                  type="tel"
                  name="phone"
                  placeholder="Ej. 229 123 4567"
                  value={guestData.phone}
                  onChange={handleGuestChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Pases para este invitado
                </label>

                <select
                  name="passes"
                  value={guestData.passes}
                  onChange={handleGuestChange}
                >

                  <option value="1">
                    1 pase
                  </option>

                  <option value="2">
                    2 pases
                  </option>

                  <option value="3">
                    3 pases
                  </option>

                  <option value="4">
                    4 pases
                  </option>

                  <option value="5">
                    5 pases
                  </option>

                </select>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowAddGuest(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="create-button"
                >
                  Agregar invitado
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {selectedInvitation && (
        <div className="modal-overlay">

          <div
            className="event-modal invitation-modal"
            style={{
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >

            <div className="modal-header">

              <div>

                <span className="hero-label">
                  INVITACIÓN DIGITAL
                </span>

                <h2>
                  {selectedInvitation.event.name}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={closeInvitation}
              >
                📷
              </button>

            </div>

            <div
              style={{
                textAlign: "center",
                padding: "10px 0 25px",
              }}
            >

              <p>
                Tenemos el gusto de invitar a
              </p>

              <h1
                style={{
                  fontSize: "34px",
                  margin: "10px 0",
                }}
              >
                {selectedInvitation.guest.name}
              </h1>

              <p>
                🎟️{" "}
                <strong>
                  {selectedInvitation.guest.passes}
                </strong>{" "}
                pase(s)
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "20px 0",
                }}
              >

                <img
                  src={createQRUrl(
                    selectedInvitation.guest
                  )}
                  alt={`QR de ${selectedInvitation.guest.name}`}
                  width="220"
                  height="220"
                  style={{
                    borderRadius: "12px",
                  }}
                />

              </div>

              <p>
                🔳 Presenta este código QR
                al ingresar al evento.
              </p>

            </div>

            <div
              className="invitation-details"
              style={{
                display: "grid",
                gap: "12px",
                marginBottom: "20px",
              }}
            >

              <div className="stat-card">

                <span>
                  📅 Fecha
                </span>

                <strong>
                  {formatDate(
                    selectedInvitation.event.date
                  )}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  🕐 Hora
                </span>

                <strong>
                  {selectedInvitation.event.time ||
                    "Por confirmar"}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  📍 Lugar
                </span>

                <strong>
                  {selectedInvitation.event.location}
                </strong>

              </div>

            </div>

            <div className="map-card">

              <h3>
                📍 Ubicación del evento
              </h3>

              <p>
                {selectedInvitation.event.location}
              </p>

              <div className="map-container">

                <iframe
                  title={`Mapa de ${selectedInvitation.event.name}`}
                  src={`https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(
                    selectedInvitation.event.location
                  )}`}
                  width="100%"
                  height="350"
                  style={{
                    border: 0,
                    borderRadius: "18px",
                  }}
                  loading="lazy"
                />

              </div>

              <a
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                  selectedInvitation.event.location
                )}`}
                target="_blank"
                rel="noreferrer"
                className="outline-button map-link"
                style={{
                  display: "inline-block",
                  marginTop: "15px",
                }}
              >
                🗺️ Cómo llegar
              </a>

            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={closeInvitation}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="create-button"
                onClick={() =>
                  window.open(
                    createQRUrl(
                      selectedInvitation.guest
                    ),
                    "_blank"
                  )
                }
              >
                Abrir QR
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;


































