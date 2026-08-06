 import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [activeSection, setActiveSection] = useState("inicio");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

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
    return () => {
      stopCamera();
    };
  }, []);

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

  const editEvent = (event) => {
    setEditingEventId(String(event.id));

    setEventData({
      name: event.name || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      passes: event.passes || 1,
    });

    setShowCreateEvent(true);
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

    if (editingEventId) {
      setEvents((old) =>
        old.map((event) =>
          String(event.id) === String(editingEventId)
            ? {
                ...event,
                name: eventData.name,
                date: eventData.date,
                time: eventData.time,
                location: eventData.location,
                passes: Number(eventData.passes),
              }
            : event
        )
      );

      setEventData({
        name: "",
        date: "",
        time: "",
        location: "",
        passes: 1,
      });

      setShowCreateEvent(false);
      setEditingEventId(null);
      setActiveSection("eventos");

      alert(
        `Â¡Evento "${eventData.name}" actualizado correctamente!`
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
      `Ã‚Â¡Invitado "${newGuest.name}" agregado correctamente!`
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
      alert("No se encontrÃƒÂ³ el evento de este invitado.");
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
          "Ã¢ÂÅ’ Este QR no pertenece a Sirius H&S."
        );
        setScanGuest(null);
        return false;
      }

      if (!data.guestId || !data.eventId) {
        setScanMessage(
          "Ã¢ÂÅ’ Este QR no contiene una invitaciÃƒÂ³n vÃƒÂ¡lida."
        );
        setScanGuest(null);
        return false;
      }

      const guest = guests.find(
        (item) => item.id === Number(data.guestId)
      );

      if (!guest) {
        setScanMessage(
          "Ã¢ÂÅ’ Invitado no encontrado."
        );
        setScanGuest(null);
        return false;
      }

      if (guest.qrUsed) {
        setScanMessage(
          "Ã°Å¸â€Â´ Pase utilizado"
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

      setScanMessage("Ã¢Å“â€¦ Pase vÃƒÂ¡lido");

      return true;
    } catch {
      setScanMessage(
        "Ã¢ÂÅ’ El QR no es vÃƒÂ¡lido."
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
              "Ã°Å¸â€Â´ Pase utilizado"
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "Ã¢ÂÅ’ Invitado no encontrado."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "Ã¢ÂÅ’ Este QR no pertenece a Sirius H&S."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "Ã¢ÂÅ’ Este QR no contiene una invitaciÃƒÂ³n vÃƒÂ¡lida."
            ) {
              stopCamera();
              return;
            }

            if (
              scanMessage ===
              "Ã¢ÂÅ’ El QR no es vÃƒÂ¡lido."
            ) {
              stopCamera();
              return;
            }
          }
        }
      } else {
        setCameraError(
          "Tu navegador abriÃƒÂ³ la cÃƒÂ¡mara, pero no tiene disponible el lector automÃƒÂ¡tico de cÃƒÂ³digos QR."
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
          "Tu navegador no permite acceder a la cÃƒÂ¡mara."
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
        "No se pudo abrir la cÃƒÂ¡mara:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setCameraError(
          "Permiso de cÃƒÂ¡mara denegado. Permite el acceso a la cÃƒÂ¡mara en tu navegador."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        setCameraError(
          "No se encontrÃƒÂ³ ninguna cÃƒÂ¡mara."
        );
      } else {
        setCameraError(
          "No se pudo abrir la cÃƒÂ¡mara."
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
              Panel de administraciÃƒÂ³n
            </p>

            <h2>Ã‚Â¡Hola! Ã°Å¸â€˜â€¹</h2>
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
              SIRIUS H&S Ã‚Â· INVITACIONES INTELIGENTES
            </span>

            <h2>
              Haz que cada invitaciÃƒÂ³n
              <br />
              sea especial.
            </h2>

            <p>
              Crea eventos, administra invitados,
              genera cÃƒÂ³digos QR y controla la
              asistencia desde un solo lugar.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              Crear mi primer evento Ã¢â€ â€™
            </button>
          </div>

          <div className="hero-card">
            <div className="qr-placeholder">
              <div className="qr-pattern">
                <span>Ã¢â€“Â¦</span>
              </div>
            </div>

            <div className="ticket-info">
              <span>INVITACIÃƒâ€œN</span>

              <strong>
                Mi prÃƒÂ³ximo evento
              </strong>

              <small>
                QR ÃƒÂºnico para cada invitado
              </small>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon">Ã¢Å“Â¦</div>

            <div>
              <span>Eventos</span>
              <strong>{events.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">Ã¢â„¢â„¢</div>

            <div>
              <span>Invitados</span>
              <strong>{guests.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">Ã¢Å“â€œ</div>

            <div>
              <span>Confirmados</span>
              <strong>{confirmed}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">Ã¢â€“Â£</div>

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
              <div className="empty-icon">Ã¢Å“Â¦</div>

              <h3>
                AÃƒÂºn no tienes eventos
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
                    Ã¢Å“Â¦
                  </div>

                  <div className="event-card-info">
                    <h3>{event.name}</h3>

                    <p>
                      Ã°Å¸â€œâ€¦{" "}
                      {formatDate(event.date)}
                      {event.time &&
                        ` Ã‚Â· ${event.time}`}
                    </p>

                    <p>
                      Ã°Å¸â€œÂ {event.location}
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
            <div className="empty-icon">Ã¢Å“Â¦</div>

            <h3>
              AÃƒÂºn no tienes eventos
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
                  Ã¢Å“Â¦
                </div>

                <div className="event-card-info">
                  <h3>{event.name}</h3>

                  <p>
                    Ã°Å¸â€œâ€¦{" "}
                    {formatDate(event.date)}
                    {event.time &&
                      ` Ã‚Â· ${event.time}`}
                  </p>

                  <p>
                    Ã°Å¸â€œÂ {event.location}
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

                <button
                  className="outline-button"
                  onClick={() => editEvent(event)}
                >
                  Editar
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
            <div className="empty-icon">Ã¢â„¢â„¢</div>

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
            <div className="empty-icon">Ã¢â„¢â„¢</div>

            <h3>
              AÃƒÂºn no hay invitados
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
                  Ã¢â„¢â„¢
                </div>

                <div className="event-card-info">
                  <h3>{guest.name}</h3>

                  <p>
                    {guest.phone ||
                      "Sin telÃƒÂ©fono"}
                  </p>

                  <small>
                    {guest.passes} pase(s)
                    {" Ã‚Â· "}
                    {guest.qrUsed
                      ? "Ã°Å¸â€Â´ Pase utilizado"
                      : "Ã°Å¸Å¸Â¢ Pase disponible"}
                  </small>
                </div>

                <div className="guest-actions">
                  <button
                    className="outline-button"
                    onClick={() =>
                      openInvitation(guest)
                    }
                  >
                    Ver invitaciÃƒÂ³n
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
            <h3>CÃƒÂ³digos QR</h3>

            <p>
              Cada invitado tiene un QR ÃƒÂºnico.
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
            <div className="empty-icon">Ã¢â€“Â£</div>

            <h3>
              No hay invitados
            </h3>

            <p>
              Agrega invitados para generar
              sus cÃƒÂ³digos QR.
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
                  <span>INVITACIÃƒâ€œN</span>

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
                      ? "Ã°Å¸â€Â´ Pase utilizado"
                      : "Ã°Å¸Å¸Â¢ Pase disponible"}
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
                  Ver invitaciÃƒÂ³n
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
            Escanear cÃƒÂ³digo QR
          </h3>

          <p>
            Apunta la cÃƒÂ¡mara al cÃƒÂ³digo QR de
            la invitaciÃƒÂ³n.
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
                  Ã°Å¸â€œÂ·
                </div>

                <strong>
                  CÃƒÂ¡mara apagada
                </strong>

                <p
                  style={{
                    marginTop: "8px",
                    opacity: 0.8,
                  }}
                >
                  Presiona el botÃƒÂ³n para
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
                Ã¢Å¡Â Ã¯Â¸Â {cameraError}
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
                Ã°Å¸â€œÂ· Abrir cÃƒÂ¡mara
              </button>
            ) : (
              <button
                className="cancel-button"
                onClick={stopCamera}
              >
                Ã¢Å“â€¢ Detener cÃƒÂ¡mara
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
            <div className="empty-icon">Ã¢Å’â€“</div>

            <h3>
              Selecciona un evento
            </h3>

            <p>
              Elige un evento para mostrar
              su ubicaciÃƒÂ³n.
            </p>
          </div>
        ) : (
          <div className="map-card">
            <h3>{selectedEvent.name}</h3>

            <p>
              Ã°Å¸â€œÂ {selectedEvent.location}
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

            <h3>ConfiguraciÃƒÂ³n</h3>

            <p>
              ConfiguraciÃƒÂ³n general de tu aplicaciÃƒÂ³n.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">Ã¢Å¡â„¢</div>

          <h3>
            ConfiguraciÃƒÂ³n
          </h3>

          <p>
            PrÃƒÂ³ximamente podrÃƒÂ¡s personalizar
            mÃƒÂ¡s opciones de Sirius H&S.
          </p>
        </div>
      </section>
    );
  };

  const renderPremium = () => {
    return (
      <section className="content-section">

        <div className="section-heading">
          <div>
            <span className="hero-label">
              SIRIUS H&S
            </span>

            <h3>
              Desbloqueos Premium
            </h3>

            <p>
              Comienza gratis y desbloquea
              funciones premium cuando las necesites.
            </p>
          </div>
        </div>

        <div className="premium-hero">

          <div className="premium-crown">
            Ã¢â„¢â€º
          </div>

          <div>
            <span className="premium-label">
              EXPERIENCIA SIRIUS H&S
            </span>

            <h2>
              Lleva tus invitaciones
              al siguiente nivel
            </h2>

            <p>
              Una experiencia elegante,
              exclusiva y personalizable.
            </p>
          </div>

        </div>

        <div className="premium-plans">

          <div className="premium-card free-plan">

            <span className="plan-badge">
              GRATIS
            </span>

            <h3>
              Plan Gratis
            </h3>

            <div className="plan-price">
              $0 <small>MXN</small>
            </div>

            <p>
              Todo lo necesario para comenzar
              a crear tus eventos.
            </p>

            <ul>
              <li>Ã¢Å“â€œ Crear eventos</li>
              <li>Ã¢Å“â€œ Administrar invitados</li>
              <li>Ã¢Å“â€œ 1 pase por invitado</li>
              <li>Ã¢Å“â€œ CÃƒÂ³digos QR</li>
              <li>Ã¢Å“â€œ ConfirmaciÃƒÂ³n con cÃƒÂ¡mara</li>
              <li>Ã¢Å“â€œ Mapa del evento</li>
              <li>Ã¢Å“â€œ InvitaciÃƒÂ³n digital</li>
            </ul>

            <button
              className="outline-button"
              disabled
            >
              Plan actual
            </button>

          </div>

          <div className="premium-card premium-plan">

            <div className="crown-realistic">
              Ã¢â„¢â€º
            </div>

            <span className="plan-badge premium-badge">
              PREMIUM
            </span>

            <h3>
              Sirius H&S Premium
            </h3>

            <div className="plan-price">
              PrÃƒÂ³ximamente
            </div>

            <p>
              Desbloquea una experiencia mÃƒÂ¡s
              exclusiva para tus eventos.
            </p>

            <ul>
              <li>Ã¢Å“â€œ Todo lo incluido en Gratis</li>
              <li>Ã¢Å“â€œ Invitaciones premium</li>
              <li>Ã¢Å“â€œ DiseÃƒÂ±os exclusivos</li>
              <li>Ã¢Å“â€œ PersonalizaciÃƒÂ³n avanzada</li>
              <li>Ã¢Å“â€œ Herramientas premium</li>
              <li>Ã¢Å“â€œ Funciones adicionales futuras</li>
              <li>Ã¢Å“â€œ Experiencia Sirius H&S</li>
            </ul>

            <button
              className="create-button premium-button"
              onClick={() =>
                alert(
                  "Sirius H&S Premium estarÃƒÂ¡ disponible prÃƒÂ³ximamente."
                )
              }
            >
              Ã¢â„¢â€º Desbloquear Premium
            </button>

          </div>

        </div>

        <div className="premium-note">

          <strong>
            Ã¢â„¢â€º Sirius H&S
          </strong>

          <p>
            La versiÃƒÂ³n gratuita seguirÃƒÂ¡ disponible.
            Las funciones Premium serÃƒÂ¡n opcionales.
          </p>

        </div>

      </section>
    );
  };

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            Ã¢â„¢â€º
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
            <span>Ã¢Å’â€š</span>
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
            <span>Ã¢Å“Â¦</span>
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
            <span>Ã¢â„¢â„¢</span>
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
            <span>Ã¢â€“Â£</span>
            CÃƒÂ³digos QR
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
            <span>Ã¢Å“â€œ</span>
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
            <span>Ã¢Å’â€“</span>
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
            <span>Ã¢Å¡â„¢</span>
            ConfiguraciÃƒÂ³n
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
            <span>Ã¢â„¢â€º</span>
            Desbloqueos Premium
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="help-box">

            <strong>
              Ã‚Â¿Necesitas ayuda?
            </strong>

            <p>
              Configura tu evento paso a paso.
            </p>

            <button>
              Ver guÃƒÂ­a
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
                Plan Gratis
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
                Ãƒâ€”
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
                  placeholder="Ej. Boda de MarÃƒÂ­a y Juan"
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
                  placeholder="Ej. ZÃƒÂ³calo de Veracruz"
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
                Ãƒâ€”
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
                  placeholder="Ej. MarÃƒÂ­a LÃƒÂ³pez"
                  value={guestData.name}
                  onChange={handleGuestChange}
                />

              </div>

              <div className="form-group">

                <label>
                  TelÃƒÂ©fono
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
                  INVITACIÃƒâ€œN DIGITAL
                </span>

                <h2>
                  {selectedInvitation.event.name}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={closeInvitation}
              >
                Ãƒâ€”
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
                Ã°Å¸Å½Å¸Ã¯Â¸Â{" "}
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
                Ã°Å¸â€Â³ Presenta este cÃƒÂ³digo QR
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
                  Ã°Å¸â€œâ€¦ Fecha
                </span>

                <strong>
                  {formatDate(
                    selectedInvitation.event.date
                  )}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  Ã°Å¸â€¢Â Hora
                </span>

                <strong>
                  {selectedInvitation.event.time ||
                    "Por confirmar"}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  Ã°Å¸â€œÂ Lugar
                </span>

                <strong>
                  {selectedInvitation.event.location}
                </strong>

              </div>

            </div>

            <div className="map-card">

              <h3>
                Ã°Å¸â€œÂ UbicaciÃƒÂ³n del evento
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
                Ã°Å¸â€”ÂºÃ¯Â¸Â CÃƒÂ³mo llegar
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



