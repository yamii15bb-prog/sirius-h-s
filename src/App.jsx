 import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

// Sirius H&S â€” Modo propietaria
// En la versiÃ³n actual no existe todavÃ­a un sistema de cuentas/autenticaciÃ³n.
// Por eso este modo identifica la instalaciÃ³n de la creadora durante las pruebas.
// Antes de publicar para usuarios reales, OWNER_MODE debe sustituirse por
// una validaciÃ³n de cuenta en servidor.
const OWNER_MODE = true;

function App() {
  const [activeSection, setActiveSection] = useState("inicio");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // Sirius H&S Premium: estado local de acceso.
  // IMPORTANTE: la activaciÃ³n real de pago debe validarse en un backend.
  const [premiumEnabled, setPremiumEnabled] = useState(() => {
    if (OWNER_MODE) {
      return true;
    }

    return localStorage.getItem("siriusHS_premium") === "true";
  });

  const [premiumMessage, setPremiumMessage] = useState("");

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
        "ðŸ‘‘ Modo propietaria activo: tu acceso Premium no se puede desactivar."
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
      `Â¡Evento "${newEvent.name}" creado correctamente!`
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
      `Â¡Invitado "${newGuest.name}" agregado correctamente!`
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
      alert("No se encontrÃ³ el evento de este invitado.");
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
          "âŒ Este QR no pertenece a Sirius H&S."
        );
        setScanGuest(null);
        return false;
      }

      if (!data.guestId || !data.eventId) {
        setScanMessage(
          "âŒ Este QR no contiene una invitaciÃ³n vÃ¡lida."
        );
        setScanGuest(null);
        return false;
      }

      const guest = guests.find(
        (item) => item.id === Number(data.guestId)
      );

      if (!guest) {
        setScanMessage(
          "âŒ Invitado no encontrado."
        );
        setScanGuest(null);
        return false;
      }

      if (guest.qrUsed) {
        setScanMessage(
          "ðŸ”´ Pase utilizado"
        );

        setScanGuest(guest);

        return false;
      }

      setGuests((old) =>
        old.map((item) =>
          item.id === guest.id
            ? {
                ...item,
                qrUsed: true,
                confirmed: true,
              }
            : item
        )
      );

      setScanGuest({
        ...guest,
        qrUsed: true,
        confirmed: true,
      });

      setScanMessage("âœ… Pase vÃ¡lido");

      return true;
    } catch {
      setScanMessage(
        "âŒ El QR no es vÃ¡lido."
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
              "ðŸ”´ Pase utilizado"
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "âŒ Invitado no encontrado."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "âŒ Este QR no pertenece a Sirius H&S."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "âŒ Este QR no contiene una invitaciÃ³n vÃ¡lida."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "âŒ El QR no es vÃ¡lido."
            ) {
              stopCamera();
              return;
            }
          }
        }
      } else {
        setCameraError(
          "Tu navegador abriÃ³ la cÃ¡mara, pero no tiene disponible el lector automÃ¡tico de cÃ³digos QR."
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
          "Tu navegador no permite acceder a la cÃ¡mara."
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
        "No se pudo abrir la cÃ¡mara:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setCameraError(
          "Permiso de cÃ¡mara denegado. Permite el acceso a la cÃ¡mara en tu navegador."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        setCameraError(
          "No se encontrÃ³ ninguna cÃ¡mara."
        );
      } else {
        setCameraError(
          "No se pudo abrir la cÃ¡mara."
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
              Panel de administraciÃ³n
            </p>

            <h2>Â¡Hola! ðŸ‘‹</h2>
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
              SIRIUS H&S Â· INVITACIONES INTELIGENTES
            </span>

            <h2>
              Haz que cada invitaciÃ³n
              <br />
              sea especial.
            </h2>

            <p>
              Crea eventos, administra invitados,
              genera cÃ³digos QR y controla la
              asistencia desde un solo lugar.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              Crear mi primer evento â†’
            </button>
          </div>

          <div className="hero-card">
            <div className="qr-placeholder">
              <div className="qr-pattern">
                <span>â–¦</span>
              </div>
            </div>

            <div className="ticket-info">
              <span>INVITACIÃ“N</span>

              <strong>
                Mi prÃ³ximo evento
              </strong>

              <small>
                QR Ãºnico para cada invitado
              </small>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon">âœ¦</div>

            <div>
              <span>Eventos</span>
              <strong>{events.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">â™™</div>

            <div>
              <span>Invitados</span>
              <strong>{guests.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">âœ“</div>

            <div>
              <span>Confirmados</span>
              <strong>{confirmed}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">â–£</div>

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
              <div className="empty-icon">âœ¦</div>

              <h3>
                AÃºn no tienes eventos
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
                    âœ¦
                  </div>

                  <div className="event-card-info">
                    <h3>{event.name}</h3>

                    <p>
                      ðŸ“…{" "}
                      {formatDate(event.date)}
                      {event.time &&
                        ` Â· ${event.time}`}
                    </p>

                    <p>
                      ðŸ“ {event.location}
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
            <div className="empty-icon">âœ¦</div>

            <h3>
              AÃºn no tienes eventos
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
                  âœ¦
                </div>

                <div className="event-card-info">
                  <h3>{event.name}</h3>

                  <p>
                    ðŸ“…{" "}
                    {formatDate(event.date)}
                    {event.time &&
                      ` Â· ${event.time}`}
                  </p>

                  <p>
                    ðŸ“ {event.location}
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
            <div className="empty-icon">â™™</div>

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
            <div className="empty-icon">â™™</div>

            <h3>
              AÃºn no hay invitados
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
                  â™™
                </div>

                <div className="event-card-info">
                  <h3>{guest.name}</h3>

                  <p>
                    {guest.phone ||
                      "Sin telÃ©fono"}
                  </p>

                  <small>
                    {guest.passes} pase(s)
                    {" Â· "}
                    {guest.qrUsed
                      ? "ðŸ”´ Pase utilizado"
                      : "ðŸŸ¢ Pase disponible"}
                  </small>
                </div>

                <div className="guest-actions">
                  <button
                    className="outline-button"
                    onClick={() =>
                      openInvitation(guest)
                    }
                  >
                    Ver invitaciÃ³n
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
            <h3>CÃ³digos QR</h3>

            <p>
              Cada invitado tiene un QR Ãºnico.
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
            <div className="empty-icon">â–£</div>

            <h3>
              No hay invitados
            </h3>

            <p>
              Agrega invitados para generar
              sus cÃ³digos QR.
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
                  <span>INVITACIÃ“N</span>

                  <h3>{guest.name}</h3>

                  <p>
                    {
                      getEvent(
                        guest.eventId
                      )?.name
                    }
                  </p>

                  <small>
                    {guest.passes} pase(s)
                  </small>

                  <p>
                    {guest.qrUsed
                      ? "ðŸ”´ Pase utilizado"
                      : "ðŸŸ¢ Pase disponible"}
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
                  Ver invitaciÃ³n
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
            Escanear cÃ³digo QR
          </h3>

          <p>
            Apunta la cÃ¡mara al cÃ³digo QR de
            la invitaciÃ³n.
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
                  ðŸ“·
                </div>

                <strong>
                  CÃ¡mara apagada
                </strong>

                <p
                  style={{
                    marginTop: "8px",
                    opacity: 0.8,
                  }}
                >
                  Presiona el botÃ³n para
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
                âš ï¸ {cameraError}
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
                ðŸ“· Abrir cÃ¡mara
              </button>
            ) : (
              <button
                className="cancel-button"
                onClick={stopCamera}
              >
                âœ• Detener cÃ¡mara
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
                    {scanGuest.passes}
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
            <div className="empty-icon">âŒ–</div>

            <h3>
              Selecciona un evento
            </h3>

            <p>
              Elige un evento para mostrar
              su ubicaciÃ³n.
            </p>
          </div>
        ) : (
          <div className="map-card">
            <h3>{selectedEvent.name}</h3>

            <p>
              ðŸ“ {selectedEvent.location}
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

            <h3>ConfiguraciÃ³n</h3>

            <p>
              ConfiguraciÃ³n general de tu aplicaciÃ³n.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">âš™</div>

          <h3>
            ConfiguraciÃ³n
          </h3>

          <p>
            PrÃ³ximamente podrÃ¡s personalizar
            mÃ¡s opciones de Sirius H&S.
          </p>
        </div>
      </section>
    );
  };

  const renderPremium = () => {
    const premiumFeatures = [
      "Invitaciones premium",
      "DiseÃ±os exclusivos",
      "PersonalizaciÃ³n avanzada",
      "Mapas estilizados",
      "Animaciones avanzadas",
      "MÃºsica y voz",
      "Avatares",
      "Herramientas de referencia visual",
    ];

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="hero-label">SIRIUS H&S</span>
            <h3>Desbloqueos Premium</h3>
            <p>
              Administra el acceso a las funciones avanzadas de Sirius H&S.
            </p>
          </div>
        </div>

        <div className="premium-hero">
          <div className="premium-crown">â™›</div>
          <div>
            <span className="premium-label">EXPERIENCIA SIRIUS H&S</span>
            <h2>
              {premiumEnabled
                ? "Premium estÃ¡ activo"
                : "Lleva tus invitaciones al siguiente nivel"}
            </h2>
            <p>
              {premiumEnabled
                ? "Las funciones Premium estÃ¡n habilitadas en este dispositivo."
                : "DiseÃ±os, mapas, animaciones y herramientas creativas avanzadas."}
            </p>
          </div>
        </div>

        {premiumMessage && (
          <div
            className="stat-card"
            style={{ marginTop: "18px" }}
            role="status"
          >
            {premiumMessage}
          </div>
        )}

        <div className="premium-plans">
          <div className="premium-card free-plan">
            <span className="plan-badge">GRATIS</span>
            <h3>Plan Gratis</h3>
            <div className="plan-price">
              $0 <small>MXN</small>
            </div>
            <p>Todo lo necesario para comenzar a crear tus eventos.</p>
            <ul>
              <li>âœ“ Crear eventos</li>
              <li>âœ“ Administrar invitados</li>
              <li>âœ“ 1 pase por invitado</li>
              <li>âœ“ CÃ³digos QR</li>
              <li>âœ“ ConfirmaciÃ³n con cÃ¡mara</li>
              <li>âœ“ Mapa del evento</li>
              <li>âœ“ InvitaciÃ³n digital</li>
            </ul>
            <button className="outline-button" disabled>
              {premiumEnabled ? "Plan disponible" : "Plan actual"}
            </button>
          </div>

          <div className="premium-card premium-plan">
            <div className="crown-realistic">â™›</div>
            <span className="plan-badge premium-badge">PREMIUM</span>
            <h3>Sirius H&S Premium</h3>
            <div className="plan-price">
              {premiumEnabled ? "ACTIVO" : "Acceso Premium"}
            </div>
            <p>
              Desbloquea una experiencia mÃ¡s exclusiva para tus eventos.
            </p>
            <ul>
              {premiumFeatures.map((feature) => (
                <li key={feature}>âœ“ {feature}</li>
              ))}
            </ul>

            {OWNER_MODE ? (
              <button
                className="create-button premium-button"
                type="button"
                disabled
              >
                ðŸ‘‘ Premium de propietaria â€” ACTIVO
              </button>
            ) : !premiumEnabled ? (
              <button
                className="create-button premium-button"
                onClick={activatePremiumDemo}
              >
                â™› Activar Premium (prueba)
              </button>
            ) : (
              <button
                className="outline-button"
                onClick={deactivatePremium}
              >
                Desactivar en este dispositivo
              </button>
            )}
          </div>
        </div>

        <div className="premium-note">
          <strong>â™› Sirius H&S</strong>
          <p>
            El acceso Premium se guarda localmente para esta instalaciÃ³n.
            La activaciÃ³n de pago real todavÃ­a requiere un servidor y una
            pasarela de pagos; nunca debe confiarse Ãºnicamente en localStorage.
          </p>
        </div>

        <div className="premium-card" style={{ marginTop: "20px" }}>
          <span className="plan-badge">ESTADO DEL SISTEMA</span>
          <h3>{premiumEnabled ? "Premium habilitado" : "Plan Gratis activo"}</h3>
          <p>
            {premiumEnabled
              ? "Ya puedes conectar aquÃ­ las herramientas avanzadas de Sirius H&S."
              : "Las funciones gratuitas siguen funcionando normalmente. Las funciones Premium pueden protegerse mediante requirePremium()."}
          </p>
          {!premiumEnabled && (
            <button
              className="outline-button"
              onClick={() => requirePremium()}
            >
              Probar protecciÃ³n Premium
            </button>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            â™›
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
            <span>âŒ‚</span>
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
            <span>âœ¦</span>
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
            <span>â™™</span>
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
            <span>â–£</span>
            CÃ³digos QR
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
            <span>âœ“</span>
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
            <span>âŒ–</span>
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
            <span>âš™</span>
            ConfiguraciÃ³n
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
            <span>â™›</span>
            Desbloqueos Premium
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="help-box">

            <strong>
              Â¿Necesitas ayuda?
            </strong>

            <p>
              Configura tu evento paso a paso.
            </p>

            <button>
              Ver guÃ­a
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
                Ã—
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
                  placeholder="Ej. Boda de MarÃ­a y Juan"
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
                  placeholder="Ej. ZÃ³calo de Veracruz"
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
                Ã—
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
                  placeholder="Ej. MarÃ­a LÃ³pez"
                  value={guestData.name}
                  onChange={handleGuestChange}
                />

              </div>

              <div className="form-group">

                <label>
                  TelÃ©fono
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
                  INVITACIÃ“N DIGITAL
                </span>

                <h2>
                  {selectedInvitation.event.name}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={closeInvitation}
              >
                Ã—
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
                ðŸŽŸï¸{" "}
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
                ðŸ”³ Presenta este cÃ³digo QR
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
                  ðŸ“… Fecha
                </span>

                <strong>
                  {formatDate(
                    selectedInvitation.event.date
                  )}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  ðŸ• Hora
                </span>

                <strong>
                  {selectedInvitation.event.time ||
                    "Por confirmar"}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  ðŸ“ Lugar
                </span>

                <strong>
                  {selectedInvitation.event.location}
                </strong>

              </div>

            </div>

            <div className="map-card">

              <h3>
                ðŸ“ UbicaciÃ³n del evento
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
                ðŸ—ºï¸ CÃ³mo llegar
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

