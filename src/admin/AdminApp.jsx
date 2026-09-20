import React, { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

import EventEditor from "./EventEditor";
import "./admin.css";

const API_BASE = (
  import.meta.env.VITE_COMMUNITY_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

/* ============================================================
   HELPERS
============================================================ */

function getEventId(event) {
  return event?.id || event?._id || event?.eventId || "";
}

function getEventTitle(event) {
  return event?.title || event?.name || "Event Tanpa Nama";
}

function getEventStatus(event) {
  return event?.status || "draft";
}

function getEventChallenges(event) {
  return Array.isArray(event?.challenges) ? event.challenges : [];
}

function getChallengeParticipants(challenge) {
  if (Array.isArray(challenge?.participants)) {
    return challenge.participants;
  }

  if (Array.isArray(challenge?.winners)) {
    return challenge.winners;
  }

  return [];
}

function getParticipantCount(event) {
  if (typeof event?.participantCount === "number") {
    return event.participantCount;
  }

  if (Array.isArray(event?.participants)) {
    return event.participants.length;
  }

  const challenges = getEventChallenges(event);

  return challenges.reduce((total, challenge) => {
    return total + getChallengeParticipants(challenge).length;
  }, 0);
}

function getChallengeCount(event) {
  return getEventChallenges(event).length;
}

function getEventDate(event) {
  if (!event?.date) {
    return null;
  }

  try {
    const dateValue = event.time
      ? `${event.date}T${event.time}:00`
      : `${event.date}T00:00:00`;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

function formatEventDate(event) {
  const date = getEventDate(event);

  if (!date) {
    return event?.date || "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatEventTime(event) {
  if (!event?.time) {
    return "";
  }

  return event.time;
}

function getStatusLabel(status) {
  const labels = {
    draft: "Draft",
    upcoming: "Akan Datang",
    ongoing: "Berlangsung",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status] || status || "Draft";
}

function getStatusClass(status) {
  const classes = {
    draft: "draft",
    upcoming: "upcoming",
    ongoing: "ongoing",
    completed: "completed",
    cancelled: "cancelled",
  };

  return classes[status] || "draft";
}

function cleanUsername(username) {
  return String(username || "")
    .trim()
    .replace(/^@+/, "");
}

function getClaimUsername(participant) {
  if (!participant || typeof participant === "string") {
    return "";
  }

  return (
    participant?.claimUsername ||
    participant?.claim ||
    participant?.claimedBy ||
    ""
  );
}

function getClaimTelegramUrl(participant) {
  const username = cleanUsername(getClaimUsername(participant));

  if (!username) {
    return null;
  }

  return `https://t.me/${encodeURIComponent(username)}`;
}

/* ============================================================
   MAIN APP
============================================================ */

export default function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setChecking(true);

    try {
      const response = await fetch(apiUrl("/api/admin/me"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthenticated(false);
        setAdmin(null);
        return;
      }

      const data = await response.json();

      if (data?.authenticated === true && data?.admin) {
        setAdmin(data.admin);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        setAdmin(null);
      }
    } catch (error) {
      console.error("[ADMIN] Session check failed:", error);
      setAuthenticated(false);
      setAdmin(null);
    } finally {
      setChecking(false);
    }
  }

  async function handleLogin(username, password) {
    const response = await fetch(apiUrl("/api/admin/login"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Username atau password salah.");
    }

    if (!data?.authenticated || !data?.admin) {
      throw new Error(
        "Login berhasil tetapi sesi admin tidak berhasil dibuat."
      );
    }

    setAdmin(data.admin);
    setAuthenticated(true);
  }

  async function handleLogout() {
    try {
      await fetch(apiUrl("/api/admin/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("[ADMIN] Logout failed:", error);
    }

    setAdmin(null);
    setAuthenticated(false);
  }

  if (checking) {
    return (
      <div className="ppk-admin-loading">
        <div className="ppk-admin-loading-card">
          <div className="ppk-admin-spinner" />
          <span>Memeriksa sesi admin...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard admin={admin} onLogout={handleLogout} />;
}

/* ============================================================
   LOGIN
============================================================ */

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanUsernameValue = username.trim();

    if (!cleanUsernameValue) {
      setError("Username admin wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password admin wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      await onLogin(cleanUsernameValue, password);
    } catch (loginError) {
      console.error("[ADMIN] Login failed:", loginError);

      setError(
        loginError?.message ||
          "Gagal masuk ke admin panel."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ppk-admin-login">
      <div className="ppk-admin-login-glow ppk-admin-login-glow-one" />
      <div className="ppk-admin-login-glow ppk-admin-login-glow-two" />

      <section className="ppk-admin-login-card">
        <div className="ppk-admin-login-logo">PPK</div>

        <div className="ppk-admin-login-badge">
          <ShieldCheck size={14} />
          PPK ADMIN
        </div>

        <h1>Admin Login</h1>

        <p>
          Masuk untuk mengelola event, challenge,
          pemenang, hadiah, dan informasi PPK.
        </p>

        {error && (
          <div className="ppk-admin-login-error">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form
          className="ppk-admin-login-form"
          onSubmit={handleSubmit}
        >
          <label className="ppk-admin-login-field">
            <span>Username</span>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Username admin"
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label className="ppk-admin-login-field">
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Password admin"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            className="ppk-admin-login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="ppk-admin-button-spinner" />
                Memproses...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Masuk ke Admin
              </>
            )}
          </button>
        </form>

        <div className="ppk-admin-login-footer">
          PPK — Para Pemancing Kocak
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function AdminDashboard({ admin, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents(options = {}) {
    const isRefresh = options.refresh === true;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(apiUrl("/api/events"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "Gagal mengambil data event."
        );
      }

      const nextEvents = Array.isArray(data)
        ? data
        : Array.isArray(data?.events)
          ? data.events
          : [];

      setEvents(nextEvents);
    } catch (loadError) {
      console.error(
        "[ADMIN] Load events failed:",
        loadError
      );

      setError(
        loadError?.message ||
          "Gagal mengambil daftar event."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openCreateEditor() {
    setError("");
    setSuccess("");
    setEditingEvent(null);
    setShowEditor(true);
  }

  function openEditEditor(event) {
    setError("");
    setSuccess("");
    setEditingEvent(event);
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditingEvent(null);
  }

  function handleEditorSaved(savedEvent) {
    const wasEditing = Boolean(editingEvent?.id);

    setShowEditor(false);
    setEditingEvent(null);

    if (savedEvent?.id) {
      setEvents((currentEvents) => {
        const exists = currentEvents.some(
          (event) => getEventId(event) === savedEvent.id
        );

        if (exists) {
          return currentEvents.map((event) =>
            getEventId(event) === savedEvent.id
              ? savedEvent
              : event
          );
        }

        return [savedEvent, ...currentEvents];
      });
    }

    setSuccess(
      wasEditing
        ? "Event berhasil diperbarui."
        : "Event berhasil dibuat."
    );

    setError("");

    loadEvents();
  }

  async function handleDelete(event) {
    const eventId = getEventId(event);

    if (!eventId) {
      setError("ID event tidak ditemukan.");
      return;
    }

    const confirmed = window.confirm(
      `Hapus event "${getEventTitle(event)}"?\n\nData event dan challenge di dalamnya akan dihapus.`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        apiUrl(
          `/api/admin/events/${encodeURIComponent(eventId)}`
        ),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "Gagal menghapus event."
        );
      }

      setEvents((currentEvents) =>
        currentEvents.filter(
          (item) => getEventId(item) !== eventId
        )
      );

      setSuccess("Event berhasil dihapus.");
    } catch (deleteError) {
      console.error(
        "[ADMIN] Delete event failed:",
        deleteError
      );

      setError(
        deleteError?.message ||
          "Gagal menghapus event."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(event, nextStatus) {
    const eventId = getEventId(event);

    if (!eventId || !nextStatus) {
      return;
    }

    const previousStatus = getEventStatus(event);

    if (previousStatus === nextStatus) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        apiUrl(
          `/api/admin/events/${encodeURIComponent(
            eventId
          )}/status`
        ),
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Gagal mengubah status event."
        );
      }

      const updatedEvent = data?.event || data;

      setEvents((currentEvents) =>
        currentEvents.map((item) =>
          getEventId(item) === eventId
            ? {
                ...item,
                ...updatedEvent,
                status: nextStatus,
              }
            : item
        )
      );

      setSuccess(
        `Status "${getEventTitle(event)}" diubah menjadi ${getStatusLabel(
          nextStatus
        )}.`
      );
    } catch (statusError) {
      console.error(
        "[ADMIN] Status update failed:",
        statusError
      );

      setError(
        statusError?.message ||
          "Gagal mengubah status event."
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleEvent(eventId) {
    setExpandedEvents((current) => ({
      ...current,
      [eventId]: !current[eventId],
    }));
  }

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...events]
      .filter((event) => {
        if (statusFilter === "all") {
          return true;
        }

        return getEventStatus(event) === statusFilter;
      })
      .filter((event) => {
        if (!query) {
          return true;
        }

        const title = getEventTitle(event).toLowerCase();

        const description = String(
          event?.description || ""
        ).toLowerCase();

        return (
          title.includes(query) ||
          description.includes(query)
        );
      })
      .sort((a, b) => {
        const dateA =
          getEventDate(a)?.getTime() || 0;

        const dateB =
          getEventDate(b)?.getTime() || 0;

        return dateB - dateA;
      });
  }, [events, search, statusFilter]);

  const statistics = useMemo(() => {
    const total = events.length;

    const upcoming = events.filter(
      (event) =>
        getEventStatus(event) === "upcoming"
    ).length;

    const ongoing = events.filter(
      (event) =>
        getEventStatus(event) === "ongoing"
    ).length;

    const completed = events.filter(
      (event) =>
        getEventStatus(event) === "completed"
    ).length;

    const participants = events.reduce(
      (totalParticipants, event) =>
        totalParticipants +
        getParticipantCount(event),
      0
    );

    return {
      total,
      upcoming,
      ongoing,
      completed,
      participants,
    };
  }, [events]);

  return (
    <main className="ppk-admin-dashboard">
      {/* =====================================================
          TOP NAVBAR
      ===================================================== */}

      <header className="ppk-admin-topbar">
        <div className="ppk-admin-brand">
          <div className="ppk-admin-brand-logo">
            PPK
          </div>

          <div className="ppk-admin-brand-copy">
            <strong>PPK Admin</strong>
            <span>Para Pemancing Kocak</span>
          </div>
        </div>

        <div className="ppk-admin-user-area">
          <div className="ppk-admin-user-info">
            <span>ADMIN</span>

            <strong>
              {admin?.username || "Administrator"}
            </strong>
          </div>

          <button
            type="button"
            className="ppk-admin-logout-button"
            onClick={onLogout}
            title="Keluar"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="ppk-admin-container">
        <section className="ppk-admin-heading">
          <div>
            <div className="ppk-admin-eyebrow">
              ADMIN PANEL
            </div>

            <h1>Dashboard</h1>

            <p>
              Kelola event dan aktivitas PPK dari
              satu tempat.
            </p>
          </div>

          <div className="ppk-admin-heading-actions">
            <button
              type="button"
              className="ppk-admin-secondary-btn"
              onClick={() =>
                loadEvents({ refresh: true })
              }
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "ppk-admin-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              className="ppk-admin-primary-btn"
              onClick={openCreateEditor}
            >
              <Plus size={18} />
              Buat Event
            </button>
          </div>
        </section>

        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (
          <div className="ppk-admin-alert ppk-admin-alert-error">
            <XCircle size={19} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="ppk-admin-alert ppk-admin-alert-success">
            <CheckCircle2 size={19} />

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <section className="ppk-admin-stats">
          <StatCard
            icon={<CalendarDays size={21} />}
            label="Total Event"
            value={statistics.total}
          />

          <StatCard
            icon={<Clock3 size={21} />}
            label="Akan Datang"
            value={statistics.upcoming}
          />

          <StatCard
            icon={<Activity size={21} />}
            label="Berlangsung"
            value={statistics.ongoing}
          />

          <StatCard
            icon={<Trophy size={21} />}
            label="Selesai"
            value={statistics.completed}
          />

          <StatCard
            icon={<Users size={21} />}
            label="Peserta"
            value={statistics.participants}
          />
        </section>

        {/* ===================================================
            EVENT MANAGEMENT
        =================================================== */}

        <section className="ppk-admin-events-panel">
          <div className="ppk-admin-panel-header">
            <div>
              <div className="ppk-admin-panel-eyebrow">
                EVENT MANAGEMENT
              </div>

              <h2>Daftar Event</h2>
            </div>

            <div className="ppk-admin-event-filters">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari event..."
                className="ppk-admin-search"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="ppk-admin-filter"
              >
                <option value="all">
                  Semua Status
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="upcoming">
                  Akan Datang
                </option>

                <option value="ongoing">
                  Berlangsung
                </option>

                <option value="completed">
                  Selesai
                </option>

                <option value="cancelled">
                  Dibatalkan
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ppk-admin-empty">
              <div className="ppk-admin-spinner" />
              <span>Memuat event...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="ppk-admin-empty">
              <div className="ppk-admin-empty-icon">
                <CalendarDays size={25} />
              </div>

              <strong>
                {events.length === 0
                  ? "Belum ada event"
                  : "Event tidak ditemukan"}
              </strong>

              <span>
                {events.length === 0
                  ? "Buat event pertama untuk mulai mengelola kegiatan PPK."
                  : "Coba ubah pencarian atau filter status."}
              </span>

              {events.length === 0 && (
                <button
                  type="button"
                  className="ppk-admin-primary-btn"
                  onClick={openCreateEditor}
                >
                  <Plus size={18} />
                  Buat Event
                </button>
              )}
            </div>
          ) : (
            <div className="ppk-admin-event-list">
              {filteredEvents.map((event) => {
                const eventId = getEventId(event);

                const expanded =
                  Boolean(expandedEvents[eventId]);

                return (
                  <EventRow
                    key={eventId}
                    event={event}
                    expanded={expanded}
                    saving={saving}
                    onToggle={() =>
                      toggleEvent(eventId)
                    }
                    onEdit={() =>
                      openEditEditor(event)
                    }
                    onDelete={() =>
                      handleDelete(event)
                    }
                    onStatusChange={(status) =>
                      handleStatusChange(
                        event,
                        status
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          EVENT EDITOR
      ===================================================== */}

      {showEditor && (
        <EventEditor
          event={editingEvent}
          onClose={closeEditor}
          onSaved={handleEditorSaved}
        />
      )}
    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ icon, label, value }) {
  return (
    <div className="ppk-admin-stat-card">
      <div className="ppk-admin-stat-icon">
        {icon}
      </div>

      <div className="ppk-admin-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* ============================================================
   EVENT ROW
============================================================ */

function EventRow({
  event,
  expanded,
  saving,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const challenges = getEventChallenges(event);

  return (
    <article
      className={`ppk-admin-event-card ${
        expanded
          ? "ppk-admin-event-card-expanded"
          : ""
      }`}
    >
      <div className="ppk-admin-event-main">
        <button
          type="button"
          className="ppk-admin-event-expand"
          onClick={onToggle}
          aria-label={
            expanded
              ? "Tutup detail event"
              : "Lihat detail event"
          }
        >
          {expanded ? (
            <ChevronUp size={19} />
          ) : (
            <ChevronDown size={19} />
          )}
        </button>

        <div className="ppk-admin-event-info">
          <div className="ppk-admin-event-title-row">
            <h3>{getEventTitle(event)}</h3>

            <span
              className={`ppk-admin-status ppk-admin-status-${getStatusClass(
                getEventStatus(event)
              )}`}
            >
              {getStatusLabel(
                getEventStatus(event)
              )}
            </span>
          </div>

          {event?.description && (
            <p className="ppk-admin-event-description">
              {event.description}
            </p>
          )}

          <div className="ppk-admin-event-meta">
            <span>
              <CalendarDays size={15} />
              {formatEventDate(event)}
            </span>

            {formatEventTime(event) && (
              <span>
                <Clock3 size={15} />
                {formatEventTime(event)}
              </span>
            )}

            <span>
              <Trophy size={15} />
              {getChallengeCount(event)} challenge
            </span>

            <span>
              <Users size={15} />
              {getParticipantCount(event)} peserta
            </span>
          </div>
        </div>

        <div className="ppk-admin-event-actions">
          <select
            value={getEventStatus(event)}
            onChange={(changeEvent) =>
              onStatusChange(
                changeEvent.target.value
              )
            }
            disabled={saving}
            className={`ppk-admin-status-select ppk-admin-status-select-${getStatusClass(
              getEventStatus(event)
            )}`}
          >
            <option value="draft">
              Draft
            </option>

            <option value="upcoming">
              Akan Datang
            </option>

            <option value="ongoing">
              Berlangsung
            </option>

            <option value="completed">
              Selesai
            </option>

            <option value="cancelled">
              Dibatalkan
            </option>
          </select>

          <button
            type="button"
            className="ppk-admin-icon-btn"
            onClick={onEdit}
            title="Edit event"
          >
            <Edit3 size={17} />
          </button>

          <button
            type="button"
            className="ppk-admin-icon-btn ppk-admin-icon-danger"
            onClick={onDelete}
            disabled={saving}
            title="Hapus event"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ppk-admin-event-details">
          {challenges.length === 0 ? (
            <div className="ppk-admin-event-no-challenge">
              <span>
                Belum ada challenge pada event ini.
              </span>
            </div>
          ) : (
            <div className="ppk-admin-challenge-preview">
              {challenges.map(
                (challenge, index) => (
                  <ChallengePreview
                    key={
                      challenge?.id ||
                      challenge?.challengeId ||
                      index
                    }
                    challenge={challenge}
                    index={index}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ============================================================
   CHALLENGE PREVIEW
============================================================ */

function ChallengePreview({ challenge, index }) {
  const participants =
    getChallengeParticipants(challenge);

  const title =
    challenge?.title ||
    challenge?.name ||
    `Challenge ${index + 1}`;

  return (
    <div className="ppk-admin-challenge-preview">
      <div className="ppk-admin-challenge-preview-header">
        <div>
          <span>
            CHALLENGE {index + 1}
          </span>

          <strong>{title}</strong>
        </div>

        <div className="ppk-admin-challenge-count">
          <Users size={15} />
          {participants.length}
        </div>
      </div>

      {participants.length > 0 ? (
        <div className="ppk-admin-participant-preview">
          {participants
            .slice(0, 10)
            .map((participant, participantIndex) => {
              const username =
                typeof participant === "string"
                  ? participant
                  : participant?.username ||
                    participant?.name ||
                    participant?.displayName ||
                    `Peserta ${participantIndex + 1}`;

              const claimUsername =
                getClaimUsername(participant);

              const claimUrl =
                getClaimTelegramUrl(participant);

              return (
                <div
                  key={`${username}-${participantIndex}`}
                  className="ppk-admin-participant-preview-item"
                >
                  <span>
                    {username}
                  </span>

                  {claimUsername && claimUrl ? (
                    <a
                      href={claimUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ppk-admin-claim-link"
                      title={`Buka Telegram @${cleanUsername(
                        claimUsername
                      )}`}
                    >
                      Claim: @{cleanUsername(
                        claimUsername
                      )}
                    </a>
                  ) : (
                    <span className="ppk-admin-claim-empty">
                      Claim belum diisi
                    </span>
                  )}
                </div>
              );
            })}

          {participants.length > 10 && (
            <span className="ppk-admin-more-participants">
              +{participants.length - 10} lainnya
            </span>
          )}
        </div>
      ) : (
        <div className="ppk-admin-no-participants">
          Belum ada peserta.
        </div>
      )}
    </div>
  );
}