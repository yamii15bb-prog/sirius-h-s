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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanGuest, setScanGuest] = useState(null);

  const [editorData, setEditorData] = useState(() => {
    const saved = localStorage.getItem("siriusHS_editor");
    return saved
      ? JSON.parse(saved)
      : {
          title: "Nuestra celebración",
          subtitle: "Tenemos el gusto de invitarte",
          message: "Será un honor compartir este momento contigo.",
          theme: "elegante",
          animation: "suave",
          music: false,
          map: true,
          qr: true,
        };
  });

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

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("siriusHS_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("siriusHS_guests", JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem("siriusHS_editor", JSON.stringify(editorData));
  }, [editorData]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const changeSection = (section) => {
    if (section !== "confirmaciones") stopCamera();

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
    setEventData((old) => ({ ...old, [name]: value }));
  };

  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestData((old) => ({ ...old, [name]: value }));
  };

  const getEvent = (eventId) =>
    events.find((event) => String(event.id) === String(eventId));

  const getGuests = (eventId) =>
    guests.filter((guest) => String(guest.eventId) === String(eventId));

  const formatDate = (date) => {
    if (!date) return "";
    const parts = date.split("-");
    return parts.length === 3
      ? `${parts[2]}/${parts[1]}/${parts[0]}`
      : date;
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

    if (!eventData.name || !eventData.date || !eventData.location) {
      alert("Completa el nombre, fecha y lugar del evento.");
      return;
    }

    if (editingEventId) {
      setEvents((old) =>
        old.map((event) =>
          String(event.id) === String(editingEventId)
            ? {
                ...event,
                ...eventData,
                passes: Number(eventData.passes),
              }
            : event
        )
      );
      alert(`¡Evento "${eventData.name}" actualizado correctamente!`);
      setEditingEventId(null);
    } else {
      const newEvent = {
        id: Date.now(),
        name: eventData.name,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        passes: Number(eventData.passes),
      };
      setEvents((old) => [...old, newEvent]);
      setSelectedEventId(String(newEvent.id));
      alert(`¡Evento "${newEvent.name}" creado correctamente!`);
    }

    setEventData({
      name: "",
      date: "",
      time: "",
      location: "",
      passes: 1,
    });
    setShowCreateEvent(false);
    setActiveSection("eventos");
  };

  const addGuest = (e) => {
    e.preventDefault();

    if (!selectedEventId) {
      alert("Primero selecciona un evento.");
      return;
    }

    if (!guestData.name.trim()) {
      alert("Escribe el nombre del invitado.");
      return;
    }

    const newGuest = {
      id: Date.now(),
      eventId: Number(selectedEventId),
      name: guestData.name.trim(),
      phone: guestData.phone.trim(),
      passes: Number(guestData.passes),
      qrUsed: false,
      confirmed: false,
    };

    setGuests((old) => [...old, newGuest]);
    setGuestData({ name: "", phone: "", passes: 1 });
    setShowAddGuest(false);
    alert(`¡Invitado "${newGuest.name}" agregado correctamente!`);
  };

  const createQRUrl = (guest) => {
    const event = getEvent(guest.eventId);
    const qrData = JSON.stringify({
      app: "SiriusHS",
      version: 1,
      guestId: guest.id,
      eventId: guest.eventId,
      guest: guest.name,
      event: event?.name || "",
      passes: guest.passes,
    });

    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      qrData
    )}`;
  };

  const openInvitation = (guest) => {
    const event = getEvent(guest.eventId);
    if (!event) {
      alert("No se encontró el evento de este invitado.");
      return;
    }
    setSelectedInvitation({ guest, event });
  };

  const validateQR = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);

      if (data.app !== "SiriusHS" && data.app !== "InvitaQR") {
        setScanMessage("❌ Este QR no pertenece a Sirius H&S.");
        setScanGuest(null);
        return false;
      }

      if (!data.guestId || !data.eventId) {
        setScanMessage("❌ Este QR no contiene una invitación válida.");
        setScanGuest(null);
        return false;
      }

      const guest = guests.find(
        (item) => item.id === Number(data.guestId)
      );

      if (!guest) {
        setScanMessage("❌ Invitado no encontrado.");
        setScanGuest(null);
        return false;
      }

      if (String(guest.eventId) !== String(data.eventId)) {
        setScanMessage("❌ El QR no corresponde a este evento.");
        setScanGuest(null);
        return false;
      }

      if (guest.qrUsed) {
        setScanMessage("🔴 Pase utilizado");
        setScanGuest(guest);
        return false;
      }

      const updated = { ...guest, qrUsed: true, confirmed: true };
      setGuests((old) =>
        old.map((item) => (item.id === guest.id ? updated : item))
      );
      setScanGuest(updated);
      setScanMessage("✅ Pase válido");
      return true;
    } catch {
      setScanMessage("❌ El QR no es válido.");
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
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !streamRef.current) return;

    if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scanTimerRef.current = setTimeout(scanQRCode, 300);
      return;
    }

    try {
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await detector.detect(videoRef.current);

        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const valid = validateQR(barcodes[0].rawValue);
          if (valid || scanMessage) {
            stopCamera();
            return;
          }
        }
      } else {
        setCameraError(
          "Tu navegador abrió la cámara, pero no tiene disponible el lector automático de códigos QR."
        );
        return;
      }
    } catch (error) {
      console.log("Error leyendo QR:", error);
    }

    if (streamRef.current) {
      scanTimerRef.current = setTimeout(scanQRCode, 400);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    setScanMessage("");
    setScanGuest(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Tu navegador no permite acceder a la cámara.");
      return;
    }

    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setTimeout(scanQRCode, 500);
    } catch (error) {
      console.error("No se pudo abrir la cámara:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Permiso de cámara denegado. Permite el acceso a la cámara en tu navegador."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("No se encontró ninguna cámara.");
      } else {
        setCameraError("No se pudo abrir la cámara.");
      }
    }
  };

  const updateEditor = (key, value) => {
    setEditorData((old) => ({ ...old, [key]: value }));
  };

  const renderInicio = () => {
    const confirmed = guests.filter((guest) => guest.confirmed).length;
    const used = guests.filter((guest) => guest.qrUsed).length;

    return (
      <>
        <header className="topbar">
          <div>
            <p className="welcome">Panel de administración</p>
            <h2>¡Hola! 👋</h2>
          </div>
          <button
            className="create-button"
            onClick={() => setShowCreateEvent(true)}
          >
            + Crear evento
          </button>
        </header>

        <section className="hero">
          <div>
            <span className="hero-label">SIRIUS H&S · INVITACIONES INTELIGENTES</span>
            <h2>
              Haz que cada invitación
              <br />
              sea especial.
            </h2>
            <p>
              Crea eventos, administra invitados, genera códigos QR y controla
              la asistencia desde un solo lugar.
            </p>
            <button
              className="hero-button"
              onClick={() => setShowCreateEvent(true)}
            >
              Crear mi primer evento →
            </button>
          </div>

          <div className="hero-card">
            <div className="qr-placeholder">
              <div className="qr-pattern">✦</div>
            </div>
            <div className="ticket-info">
              <span>INVITACIÓN</span>
              <strong>Mi próximo evento</strong>
              <small>QR único para cada invitado</small>
            </div>
          </div>
        </section>

        <section className="stats">
          {[
            ["✦", "Eventos", events.length],
            ["♣", "Invitados", guests.length],
            ["✓", "Confirmados", confirmed],
            ["▣", "Pases utilizados", used],
          ].map(([icon, label, value]) => (
            <div className="stat-card" key={label}>
              <div className="stat-icon">{icon}</div>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h3>Mis eventos</h3>
              <p>Administra tus eventos y sus invitaciones.</p>
            </div>
            <button
              className="outline-button"
              onClick={() => changeSection("eventos")}
            >
              Ver todos
            </button>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h3>Aún no tienes eventos</h3>
              <p>Crea tu primer evento y comienza a enviar invitaciones inteligentes.</p>
              <button className="create-button" onClick={() => setShowCreateEvent(true)}>
                + Crear evento
              </button>
            </div>
          ) : (
            <div className="events-list">
              {events.map((event) => (
                <div className="event-card" key={event.id}>
                  <div className="event-card-icon">✦</div>
                  <div className="event-card-info">
                    <h3>{event.name}</h3>
                    <p>📅 {formatDate(event.date)}{event.time && ` · ${event.time}`}</p>
                    <p>📍 {event.location}</p>
                    <small>{getGuests(event.id).length} invitado(s)</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  const renderEventos = () => (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <h3>Mis eventos</h3>
          <p>Administra tus eventos y sus invitaciones.</p>
        </div>
        <button className="create-button" onClick={() => setShowCreateEvent(true)}>
          + Crear evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <h3>Aún no tienes eventos</h3>
          <button className="create-button" onClick={() => setShowCreateEvent(true)}>
            + Crear evento
          </button>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <div className="event-card" key={event.id}>
              <div className="event-card-icon">✦</div>
              <div className="event-card-info">
                <h3>{event.name}</h3>
                <p>📅 {formatDate(event.date)}{event.time && ` · ${event.time}`}</p>
                <p>📍 {event.location}</p>
                <small>{getGuests(event.id).length} invitado(s)</small>
              </div>

              <button
                className="outline-button"
                onClick={() => {
                  setSelectedEventId(String(event.id));
                  changeSection("invitados");
                }}
              >
                Invitados
              </button>

              <button className="outline-button" onClick={() => editEvent(event)}>
                Editar
              </button>

              <button
                className="outline-button"
                onClick={() => {
                  setSelectedEventId(String(event.id));
                  changeSection("editor");
                }}
              >
                Diseñar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderInvitados = () => {
    const selectedGuests = selectedEventId ? getGuests(selectedEventId) : [];

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Invitados</h3>
            <p>Administra los invitados de tus eventos.</p>
          </div>
          <button className="create-button" onClick={() => setShowAddGuest(true)}>
            + Agregar invitado
          </button>
        </div>

        <div className="form-group">
          <label>Selecciona un evento</label>
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            <option value="">Selecciona un evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        {!selectedEventId ? (
          <div className="empty-state">
            <div className="empty-icon">♣</div>
            <h3>Selecciona un evento</h3>
            <p>Elige un evento para ver sus invitados.</p>
          </div>
        ) : selectedGuests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♣</div>
            <h3>Aún no hay invitados</h3>
            <p>Agrega el primer invitado de este evento.</p>
            <button className="create-button" onClick={() => setShowAddGuest(true)}>
              + Agregar invitado
            </button>
          </div>
        ) : (
          <div className="events-list">
            {selectedGuests.map((guest) => (
              <div className="event-card" key={guest.id}>
                <div className="event-card-icon">♣</div>
                <div className="event-card-info">
                  <h3>{guest.name}</h3>
                  <p>{guest.phone || "Sin teléfono"}</p>
                  <small>
                    {guest.passes} pase(s) · {guest.qrUsed ? "🔴 Pase utilizado" : "🟢 Pase disponible"}
                  </small>
                </div>

                <div className="guest-actions">
                  <button className="outline-button" onClick={() => openInvitation(guest)}>
                    Ver invitación
                  </button>
                  <button
                    className="outline-button"
                    onClick={() => {
                      setSelectedEventId(String(guest.eventId));
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
    const selectedGuests = selectedEventId ? getGuests(selectedEventId) : [];

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Códigos QR</h3>
            <p>Cada invitado tiene un QR único.</p>
          </div>
        </div>

        <div className="form-group">
          <label>Selecciona un evento</label>
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            <option value="">Selecciona un evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        {selectedGuests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▣</div>
            <h3>No hay invitados</h3>
            <p>Agrega invitados para generar sus códigos QR.</p>
          </div>
        ) : (
          <div className="qr-grid">
            {selectedGuests.map((guest) => (
              <div className="qr-card" key={guest.id}>
                <div className="qr-card-image">
                  <img src={createQRUrl(guest)} alt={`QR de ${guest.name}`} />
                </div>
                <div className="qr-card-info">
                  <span>INVITACIÓN</span>
                  <h3>{guest.name}</h3>
                  <p>{getEvent(guest.eventId)?.name}</p>
                  <small>{guest.passes} pase(s)</small>
                  <p>{guest.qrUsed ? "🔴 Pase utilizado" : "🟢 Pase disponible"}</p>
                </div>
                <button className="create-button" onClick={() => window.open(createQRUrl(guest), "_blank")}>
                  Abrir QR
                </button>
                <button className="outline-button" onClick={() => openInvitation(guest)}>
                  Ver invitación
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderConfirmaciones = () => (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <h3>Confirmaciones</h3>
          <p>Valida la entrada de tus invitados con la cámara.</p>
        </div>
      </div>

      <div className="scanner-box">
        <h3>Escanear código QR</h3>
        <p>Apunta la cámara al código QR de la invitación.</p>

        <div
          style={{
            width: "100%",
            maxWidth: 520,
            margin: "20px auto",
            borderRadius: 20,
            overflow: "hidden",
            background: "#111",
            position: "relative",
            minHeight: cameraActive ? 360 : 180,
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
                style={{ width: "100%", display: "block" }}
              />
              <div
                style={{
                  position: "absolute",
                  width: "65%",
                  height: "65%",
                  border: "3px solid #fff",
                  borderRadius: 18,
                  pointerEvents: "none",
                }}
              />
            </>
          ) : (
            <div style={{ color: "white", textAlign: "center", padding: 35 }}>
              <div style={{ fontSize: 55 }}>📷</div>
              <strong>Cámara apagada</strong>
              <p>Presiona el botón para comenzar.</p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="scan-result">
            <p>⚠️ {cameraError}</p>
          </div>
        )}

        <div className="modal-actions" style={{ justifyContent: "center" }}>
          {!cameraActive ? (
            <button className="create-button" onClick={startCamera}>
              📷 Abrir cámara
            </button>
          ) : (
            <button className="cancel-button" onClick={stopCamera}>
              ✕ Detener cámara
            </button>
          )}
        </div>
      </div>

      {scanMessage && (
        <div className="scan-result" style={{ marginTop: 20, textAlign: "center" }}>
          <h2>{scanMessage}</h2>
          {scanGuest && (
            <div style={{ marginTop: 15 }}>
              <p>Invitado: <strong>{scanGuest.name}</strong></p>
              <p>Pases: <strong>{scanGuest.passes}</strong></p>
              <p>Evento: <strong>{getEvent(scanGuest.eventId)?.name}</strong></p>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const renderMapa = () => {
    const selectedEvent = selectedEventId ? getEvent(selectedEventId) : null;
    const mapUrl = selectedEvent
      ? `https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(selectedEvent.location)}`
      : "";

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h3>Mapa</h3>
            <p>Ubica el lugar de tu evento.</p>
          </div>
        </div>

        <div className="form-group">
          <label>Selecciona un evento</label>
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            <option value="">Selecciona un evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        {!selectedEvent ? (
          <div className="empty-state">
            <div className="empty-icon">⌖</div>
            <h3>Selecciona un evento</h3>
            <p>Elige un evento para mostrar su ubicación.</p>
          </div>
        ) : (
          <div className="map-card">
            <h3>{selectedEvent.name}</h3>
            <p>📍 {selectedEvent.location}</p>
            <div className="map-container">
              <iframe
                title={`Mapa de ${selectedEvent.name}`}
                src={mapUrl}
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: 18 }}
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(selectedEvent.location)}`}
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

  const renderEditor = () => {
    const event = selectedEventId ? getEvent(selectedEventId) : events[0];
    const previewTitle = editorData.title || event?.name || "Nuestra celebración";

    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="hero-label">SIRIUS H&S · EDITOR</span>
            <h3>Diseña tu invitación</h3>
            <p>Esta es la primera versión del editor. Todo lo que cambies se guarda localmente.</p>
          </div>
        </div>

        <div className="form-group">
          <label>Evento que vas a diseñar</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Selecciona un evento</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        {!event ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <h3>Primero crea un evento</h3>
            <p>Después podrás comenzar a diseñar su invitación.</p>
            <button className="create-button" onClick={() => setShowCreateEvent(true)}>
              + Crear evento
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(280px, 360px) minmax(320px, 1fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div className="event-modal" style={{ maxWidth: "none" }}>
              <span className="hero-label">HERRAMIENTAS</span>

              <div className="form-group">
                <label>Título</label>
                <input
                  value={editorData.title}
                  onChange={(e) => updateEditor("title", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Subtítulo</label>
                <input
                  value={editorData.subtitle}
                  onChange={(e) => updateEditor("subtitle", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Mensaje</label>
                <textarea
                  rows="4"
                  value={editorData.message}
                  onChange={(e) => updateEditor("message", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Estilo</label>
                <select
                  value={editorData.theme}
                  onChange={(e) => updateEditor("theme", e.target.value)}
                >
                  <option value="elegante">Elegante</option>
                  <option value="romantico">Romántico</option>
                  <option value="minimalista">Minimalista</option>
                  <option value="dorado">Dorado Premium</option>
                </select>
              </div>

              <div className="form-group">
                <label>Animación</label>
                <select
                  value={editorData.animation}
                  onChange={(e) => updateEditor("animation", e.target.value)}
                >
                  <option value="suave">Suave</option>
                  <option value="cinematografica">Cinematográfica</option>
                  <option value="particulas">Partículas</option>
                </select>
              </div>

              <label style={{ display: "block", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={editorData.music}
                  onChange={(e) => updateEditor("music", e.target.checked)}
                />{" "}
                Música
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={editorData.map}
                  onChange={(e) => updateEditor("map", e.target.checked)}
                />{" "}
                Mapa
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={editorData.qr}
                  onChange={(e) => updateEditor("qr", e.target.checked)}
                />{" "}
                Código QR
              </label>

              <button
                className="create-button"
                onClick={() => changeSection("premium")}
              >
                ✦ Ver herramientas Premium
              </button>
            </div>

            <div
              style={{
                minHeight: 620,
                borderRadius: 28,
                padding: 24,
                background:
                  editorData.theme === "dorado"
                    ? "linear-gradient(145deg,#090909,#2a210b,#090909)"
                    : "linear-gradient(145deg,#0b0b0b,#171717,#090909)",
                color: "#fff",
                boxShadow: "0 20px 60px rgba(0,0,0,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
                <span className="hero-label">{event.name}</span>
                <h1 style={{ fontSize: 46, margin: "25px 0 10px" }}>
                  {previewTitle}
                </h1>
                <p style={{ fontSize: 18, opacity: 0.8 }}>{editorData.subtitle}</p>

                <div style={{ margin: "35px auto", maxWidth: 430 }}>
                  <p style={{ lineHeight: 1.8 }}>{editorData.message}</p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    padding: 20,
                    borderRadius: 20,
                    background: "rgba(255,255,255,.06)",
                  }}
                >
                  <strong>📅 {formatDate(event.date)}</strong>
                  <strong>🕐 {event.time || "Hora por confirmar"}</strong>
                  <strong>📍 {event.location}</strong>
                </div>

                {editorData.qr && (
                  <div style={{ marginTop: 25 }}>
                    <span>QR de invitación</span>
                  </div>
                )}

                {editorData.map && (
                  <div style={{ marginTop: 15, opacity: 0.7 }}>
                    📍 Ubicación interactiva
                  </div>
                )}

                {editorData.music && (
                  <div style={{ marginTop: 15, opacity: 0.7 }}>
                    ♪ Música activada
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderConfiguracion = () => (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <span className="hero-label">SIRIUS H&S</span>
          <h3>Configuración</h3>
          <p>Configuración general de tu aplicación.</p>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">⚙</div>
        <h3>Configuración</h3>
        <p>Próximamente podrás personalizar más opciones de Sirius H&S.</p>
      </div>
    </section>
  );

  const renderPremium = () => (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <span className="hero-label">SIRIUS H&S</span>
          <h3>Desbloqueos Premium</h3>
          <p>Comienza gratis y descubre las herramientas avanzadas.</p>
        </div>
      </div>

      <div className="premium-hero">
        <div className="premium-crown">♛</div>
        <div>
          <span className="premium-label">EXPERIENCIA SIRIUS H&S</span>
          <h2>Lleva tus invitaciones al siguiente nivel</h2>
          <p>Diseños, mapas, animaciones y herramientas creativas avanzadas.</p>
        </div>
      </div>

      <div className="premium-plans">
        <div className="premium-card free-plan">
          <span className="plan-badge">GRATIS</span>
          <h3>Plan Gratis</h3>
          <div className="plan-price">$0 <small>MXN</small></div>
          <ul>
            <li>✓ Crear eventos</li>
            <li>✓ Administrar invitados</li>
            <li>✓ Pases</li>
            <li>✓ Códigos QR</li>
            <li>✓ Confirmación con cámara</li>
            <li>✓ Mapa</li>
            <li>✓ Editor básico</li>
          </ul>
          <button className="outline-button" disabled>Plan actual</button>
        </div>

        <div className="premium-card premium-plan">
          <div className="crown-realistic">♛</div>
          <span className="plan-badge premium-badge">PREMIUM</span>
          <h3>Sirius H&S Premium</h3>
          <div className="plan-price">Próximamente</div>
          <ul>
            <li>✓ Todo lo incluido en Gratis</li>
            <li>✓ Editor avanzado</li>
            <li>✓ Plantillas Premium</li>
            <li>✓ Mapas estilizados</li>
            <li>✓ Animaciones avanzadas</li>
            <li>✓ Música y voz</li>
            <li>✓ Avatares</li>
            <li>✓ Herramientas de referencia visual</li>
          </ul>
          <button
            className="create-button premium-button"
            onClick={() => alert("Sirius H&S Premium estará disponible próximamente.")}
          >
            ♛ Desbloquear Premium
          </button>
        </div>
      </div>
    </section>
  );

  const navItems = [
    ["inicio", "⌂", "Inicio"],
    ["eventos", "✦", "Mis eventos"],
    ["editor", "✎", "Invitaciones / Editor"],
    ["invitados", "♣", "Invitados"],
    ["qr", "▣", "Códigos QR"],
    ["confirmaciones", "✓", "Confirmaciones"],
    ["mapa", "⌖", "Mapa"],
    ["premium", "♛", "Desbloqueos Premium"],
    ["configuracion", "⚙", "Configuración"],
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">♛</div>
          <div>
            <h1>Sirius H&S</h1>
            <span>Invitaciones inteligentes</span>
          </div>
        </div>

        <nav>
          {navItems.map(([section, icon, label]) => (
            <button
              key={section}
              className={`nav-item ${activeSection === section ? "active" : ""} ${
                section === "premium" ? "premium-nav-item" : ""
              }`}
              onClick={() => changeSection(section)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-box">
            <strong>¿Necesitas ayuda?</strong>
            <p>Configura tu evento paso a paso.</p>
            <button onClick={() => changeSection("editor")}>Abrir editor</button>
          </div>

          <div className="profile">
            <div className="avatar">U</div>
            <div>
              <strong>Mi cuenta</strong>
              <span>Plan Gratis</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        {activeSection === "inicio" && renderInicio()}
        {activeSection === "eventos" && renderEventos()}
        {activeSection === "editor" && renderEditor()}
        {activeSection === "invitados" && renderInvitados()}
        {activeSection === "qr" && renderQR()}
        {activeSection === "confirmaciones" && renderConfirmaciones()}
        {activeSection === "mapa" && renderMapa()}
        {activeSection === "configuracion" && renderConfiguracion()}
        {activeSection === "premium" && renderPremium()}
      </main>

      {showCreateEvent && (
        <div className="modal-overlay">
          <div className="event-modal">
            <div className="modal-header">
              <div>
                <span className="hero-label">
                  {editingEventId ? "EDITAR EVENTO" : "NUEVO EVENTO"}
                </span>
                <h2>{editingEventId ? "Editar evento" : "Crear evento"}</h2>
              </div>
              <button className="close-button" onClick={() => setShowCreateEvent(false)}>×</button>
            </div>

            <form onSubmit={createEvent}>
              <div className="form-group">
                <label>Nombre del evento</label>
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
                  <label>Fecha</label>
                  <input type="date" name="date" value={eventData.date} onChange={handleEventChange} />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input type="time" name="time" value={eventData.time} onChange={handleEventChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Lugar del evento</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Ej. Zócalo de Veracruz"
                  value={eventData.location}
                  onChange={handleEventChange}
                />
              </div>

              <div className="form-group">
                <label>Pases por invitado</label>
                <select name="passes" value={eventData.passes} onChange={handleEventChange}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "pase" : "pases"}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowCreateEvent(false)}>
                  Cancelar
                </button>
                <button type="submit" className="create-button">
                  {editingEventId ? "Guardar cambios" : "Crear evento"}
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
                <span className="hero-label">NUEVO INVITADO</span>
                <h2>Agregar invitado</h2>
              </div>
              <button className="close-button" onClick={() => setShowAddGuest(false)}>×</button>
            </div>

            <form onSubmit={addGuest}>
              <div className="form-group">
                <label>Nombre del invitado</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ej. María López"
                  value={guestData.name}
                  onChange={handleGuestChange}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Ej. 229 123 4567"
                  value={guestData.phone}
                  onChange={handleGuestChange}
                />
              </div>

              <div className="form-group">
                <label>Pases para este invitado</label>
                <select name="passes" value={guestData.passes} onChange={handleGuestChange}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "pase" : "pases"}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowAddGuest(false)}>
                  Cancelar
                </button>
                <button type="submit" className="create-button">
                  Agregar invitado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvitation && (
        <div className="modal-overlay">
          <div className="event-modal invitation-modal" style={{ maxWidth: 900, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <div>
                <span className="hero-label">INVITACIÓN DIGITAL</span>
                <h2>{selectedInvitation.event.name}</h2>
              </div>
              <button className="close-button" onClick={() => setSelectedInvitation(null)}>×</button>
            </div>

            <div style={{ textAlign: "center", padding: "10px 0 25px" }}>
              <p>Tenemos el gusto de invitar a</p>
              <h1 style={{ fontSize: 34, margin: "10px 0" }}>
                {selectedInvitation.guest.name}
              </h1>
              <p>🎟️ <strong>{selectedInvitation.guest.passes}</strong> pase(s)</p>

              <img
                src={createQRUrl(selectedInvitation.guest)}
                alt={`QR de ${selectedInvitation.guest.name}`}
                width="220"
                height="220"
                style={{ borderRadius: 12, margin: "20px 0" }}
              />

              <p>🔳 Presenta este código QR al ingresar al evento.</p>
            </div>

            <div className="invitation-details" style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              <div className="stat-card">
                <span>📅 Fecha</span>
                <strong>{formatDate(selectedInvitation.event.date)}</strong>
              </div>
              <div className="stat-card">
                <span>🕐 Hora</span>
                <strong>{selectedInvitation.event.time || "Por confirmar"}</strong>
              </div>
              <div className="stat-card">
                <span>📍 Lugar</span>
                <strong>{selectedInvitation.event.location}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setSelectedInvitation(null)}>
                Cerrar
              </button>
              <button
                className="create-button"
                onClick={() => window.open(createQRUrl(selectedInvitation.guest), "_blank")}
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
