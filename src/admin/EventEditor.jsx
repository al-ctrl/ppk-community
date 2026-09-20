import React, { useEffect, useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_COMMUNITY_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

/* ============================================================
   HELPERS
============================================================ */

function createId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function toBoolean(value) {
  if (value === true || value === 1 || value === "1") {
    return true;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}

function normalizeCount(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor(parsed)));
}

/* ============================================================
   WINNER SLOT
============================================================ */

function createWinner(index = 0, participant = {}) {
  return {
    username:
      participant?.username ||
      participant?.name ||
      participant?.displayName ||
      "",

    userId:
      participant?.userId ||
      participant?.id ||
      participant?.telegramId ||
      "",

    position: index + 1,

    prize: participant?.prize || "",

    /* CLAIM USERNAME */
    claimUsername:
      participant?.claimUsername ||
      participant?.claim ||
      participant?.claimedBy ||
      "",

    prizeSent: toBoolean(participant?.prizeSent),
  };
}

function createWinnerSlots(count = 0, existing = []) {
  const safeCount = normalizeCount(count);

  return Array.from(
    { length: safeCount },
    (_, index) =>
      createWinner(
        index,
        existing[index] || {}
      )
  );
}

/* ============================================================
   EMPTY DATA
============================================================ */

function emptyChallenge(index = 0) {
  return {
    id: createId("challenge"),
    title: `Challenge ${index + 1}`,
    description: "",
    type: "numbered",
    image: "",
    winnerCount: 0,
    participants: [],
    items: [],
  };
}

function emptyEvent() {
  return {
    id: "",
    title: "",
    description: "",
    status: "draft",
    banner: "",
    rules: [],
    challenges: [emptyChallenge(0)],
  };
}

/* ============================================================
   PARTICIPANT NORMALIZER
============================================================ */

function normalizeParticipant(
  participant,
  index = 0
) {
  return createWinner(index, participant);
}

/* ============================================================
   CHALLENGE NORMALIZER
============================================================ */

function normalizeChallenge(
  challenge,
  index = 0
) {
  const rawParticipants = Array.isArray(
    challenge?.participants
  )
    ? challenge.participants
    : Array.isArray(challenge?.winners)
      ? challenge.winners
      : [];

  const normalizedParticipants =
    rawParticipants.map(
      normalizeParticipant
    );

  /*
   * PRIORITAS:
   *
   * 1. winnerCount
   * 2. winnerLimit hanya untuk membaca DATA LAMA
   * 3. jumlah participants
   */

  let winnerCount = 0;

  if (
    challenge?.winnerCount !== undefined &&
    challenge?.winnerCount !== null &&
    challenge?.winnerCount !== ""
  ) {
    winnerCount = normalizeCount(
      challenge.winnerCount
    );
  } else if (
    challenge?.winnerLimit !== undefined &&
    challenge?.winnerLimit !== null &&
    challenge?.winnerLimit !== ""
  ) {
    /*
     * Backward compatibility.
     *
     * Hanya dipakai ketika data lama memang
     * belum mempunyai winnerCount.
     */

    winnerCount = normalizeCount(
      challenge.winnerLimit
    );

    /*
     * Kalau winnerLimit lama bernilai 0 tetapi
     * ternyata participants memiliki slot,
     * gunakan jumlah participants.
     *
     * Ini mencegah data lama kehilangan slot.
     */

    if (
      winnerCount === 0 &&
      normalizedParticipants.length > 0
    ) {
      winnerCount =
        normalizedParticipants.length;
    }
  } else {
    winnerCount =
      normalizedParticipants.length;
  }

  const participants =
    createWinnerSlots(
      winnerCount,
      normalizedParticipants
    );

  const items = Array.isArray(
    challenge?.items
  )
    ? challenge.items.map((item) => ({
        id:
          item?.id ||
          item?._id ||
          createId("item"),

        title: item?.title || "",

        description:
          item?.description || "",

        image:
          item?.image ||
          item?.imageUrl ||
          "",
      }))
    : [];

  return {
    id:
      challenge?.id ||
      challenge?.challengeId ||
      challenge?._id ||
      createId("challenge"),

    title:
      challenge?.title ||
      challenge?.name ||
      `Challenge ${index + 1}`,

    description:
      challenge?.description || "",

    type:
      challenge?.type ||
      "numbered",

    image:
      challenge?.image ||
      challenge?.imageUrl ||
      "",

    winnerCount,

    participants,

    items,
  };
}

/* ============================================================
   EVENT NORMALIZER
============================================================ */

function normalizeEvent(event) {
  if (!event) {
    return emptyEvent();
  }

  const challenges =
    Array.isArray(event.challenges)
      ? event.challenges.map(
          (challenge, index) =>
            normalizeChallenge(
              challenge,
              index
            )
        )
      : [emptyChallenge(0)];

  return {
    id:
      event.id ||
      event._id ||
      "",

    title:
      event.title ||
      event.name ||
      "",

    description:
      event.description ||
      "",

    status:
      event.status ||
      "draft",

    banner:
      event.banner ||
      event.bannerUrl ||
      "",

    rules:
      Array.isArray(event.rules)
        ? event.rules
        : [],

    challenges,
  };
}

/* ============================================================
   EVENT EDITOR
============================================================ */

export default function EventEditor({
  event,
  onClose,
  onSaved,
  onDeleted,
}) {
  const eventId =
    event?.id ||
    event?._id ||
    "";

  const isEditing =
    Boolean(eventId);

  const [form, setForm] = useState(() =>
    normalizeEvent(event)
  );

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    expandedChallenges,
    setExpandedChallenges,
  ] = useState({});

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  /* ==========================================================
     LOAD EVENT
  ========================================================== */

  useEffect(() => {
    const normalized =
      normalizeEvent(event);

    setForm(normalized);

    setError("");

    setShowDeleteConfirm(false);

    const initialExpanded = {};

    normalized.challenges.forEach(
      (challenge, index) => {
        initialExpanded[
          challenge.id || index
        ] = true;
      }
    );

    setExpandedChallenges(
      initialExpanded
    );
  }, [event]);

  const editorTitle = useMemo(
    () =>
      isEditing
        ? "Edit Event"
        : "Buat Event",
    [isEditing]
  );

  /* ==========================================================
     BASIC FIELD
  ========================================================== */

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ==========================================================
     RULES
  ========================================================== */

  function addRule() {
    setForm((current) => ({
      ...current,

      rules: [
        ...(Array.isArray(
          current.rules
        )
          ? current.rules
          : []),
        "",
      ],
    }));
  }

  function updateRule(
    index,
    value
  ) {
    setForm((current) => ({
      ...current,

      rules: current.rules.map(
        (rule, ruleIndex) =>
          ruleIndex === index
            ? value
            : rule
      ),
    }));
  }

  function removeRule(index) {
    setForm((current) => ({
      ...current,

      rules: current.rules.filter(
        (_, ruleIndex) =>
          ruleIndex !== index
      ),
    }));
  }

  /* ==========================================================
     CHALLENGES
  ========================================================== */

  function addChallenge() {
    setForm((current) => {
      const challenges =
        Array.isArray(
          current.challenges
        )
          ? current.challenges
          : [];

      return {
        ...current,

        challenges: [
          ...challenges,
          emptyChallenge(
            challenges.length
          ),
        ],
      };
    });
  }

  function updateChallenge(
    challengeIndex,
    field,
    value
  ) {
    setForm((current) => ({
      ...current,

      challenges:
        current.challenges.map(
          (
            challenge,
            index
          ) =>
            index ===
            challengeIndex
              ? {
                  ...challenge,
                  [field]: value,
                }
              : challenge
        ),
    }));
  }

  function removeChallenge(index) {
    setForm((current) => {
      const challenges =
        current.challenges.filter(
          (_, challengeIndex) =>
            challengeIndex !== index
        );

      return {
        ...current,

        challenges:
          challenges.length > 0
            ? challenges
            : [emptyChallenge(0)],
      };
    });
  }

  function toggleChallenge(
    challengeId
  ) {
    setExpandedChallenges(
      (current) => ({
        ...current,

        [challengeId]:
          !current[challengeId],
      })
    );
  }

  /* ==========================================================
     WINNER SLOTS
  ========================================================== */

  function updateWinnerCount(
    challengeIndex,
    value
  ) {
    const count =
      normalizeCount(value);

    setForm((current) => ({
      ...current,

      challenges:
        current.challenges.map(
          (
            challenge,
            index
          ) => {
            if (
              index !==
              challengeIndex
            ) {
              return challenge;
            }

            const existing =
              Array.isArray(
                challenge.participants
              )
                ? challenge.participants
                : [];

            /*
             * RESIZE SLOT.
             *
             * 5 -> 7
             * slot 1-5 tetap
             * slot 6-7 dibuat kosong
             *
             * 7 -> 5
             * slot 6-7 dipotong
             */

            const participants =
              createWinnerSlots(
                count,
                existing
              );

            return {
              ...challenge,

              winnerCount:
                count,

              participants,
            };
          }
        ),
    }));
  }

  function updateParticipant(
    challengeIndex,
    participantIndex,
    field,
    value
  ) {
    setForm((current) => ({
      ...current,

      challenges:
        current.challenges.map(
          (
            challenge,
            challengeIdx
          ) => {
            if (
              challengeIdx !==
              challengeIndex
            ) {
              return challenge;
            }

            const participants =
              Array.isArray(
                challenge.participants
              )
                ? challenge.participants
                : [];

            return {
              ...challenge,

              participants:
                participants.map(
                  (
                    participant,
                    index
                  ) =>
                    index ===
                    participantIndex
                      ? {
                          ...participant,
                          [field]:
                            value,
                        }
                      : participant
                ),
            };
          }
        ),
    }));
  }

  /* ==========================================================
     CUSTOM ITEMS
  ========================================================== */

  function addCustomItem(
    challengeIndex
  ) {
    setForm((current) => ({
      ...current,

      challenges:
        current.challenges.map(
          (
            challenge,
            index
          ) => {
            if (
              index !==
              challengeIndex
            ) {
              return challenge;
            }

            return {
              ...challenge,

              items: [
                ...(Array.isArray(
                  challenge.items
                )
                  ? challenge.items
                  : []),

                {
                  id: createId("item"),
                  title: "",
                  description: "",
                  image: "",
                },
              ],
            };
          }
        ),
    }));
  }

  function updateCustomItem(
    challengeIndex,
    itemIndex,
    field,
    value
  ) {
    setForm((current) => ({
      ...current,

      challenges:
        current.challenges.map(
          (
            challenge,
            challengeIdx
          ) => {
            if (
              challengeIdx !==
              challengeIndex
            ) {
              return challenge;
            }

            return {
              ...challenge,

              items:
                challenge.items.map(
                  (
                    item,
                    index
                  ) =>
                    index ===
                    itemIndex
                      ? {
                          ...item,
                          [field]:
                            value,
                        }
                      : item
                ),
            };
          }
        ),
    }));
  }

  function removeCustomItem(
    challengeIndex,
    itemIndex
  ) {
    setForm((current) => ({
      ...current,

      challenges:
        current.challenges.map(
          (
            challenge,
            challengeIdx
          ) => {
            if (
              challengeIdx !==
              challengeIndex
            ) {
              return challenge;
            }

            return {
              ...challenge,

              items:
                challenge.items.filter(
                  (_, index) =>
                    index !==
                    itemIndex
                ),
            };
          }
        ),
    }));
  }

  /* ==========================================================
     VALIDATION
  ========================================================== */

  function validate() {
    if (!form.title.trim()) {
      return "Judul event wajib diisi.";
    }

    if (
      !Array.isArray(
        form.challenges
      )
    ) {
      return "Data challenge tidak valid.";
    }

    for (
      let index = 0;
      index <
      form.challenges.length;
      index += 1
    ) {
      const challenge =
        form.challenges[index];

      if (
        !challenge.title.trim()
      ) {
        return `Judul Challenge ${
          index + 1
        } wajib diisi.`;
      }

      const winnerCount =
        normalizeCount(
          challenge.winnerCount
        );

      if (
        !Number.isFinite(
          Number(
            challenge.winnerCount
          )
        )
      ) {
        return `Jumlah pemenang Challenge ${
          index + 1
        } tidak valid.`;
      }

      if (
        winnerCount > 100
      ) {
        return `Jumlah pemenang Challenge ${
          index + 1
        } maksimal 100.`;
      }

      if (
        !Array.isArray(
          challenge.participants
        )
      ) {
        return `Data slot pemenang Challenge ${
          index + 1
        } tidak valid.`;
      }

      if (
        challenge.participants
          .length !==
        winnerCount
      ) {
        return `Jumlah slot pemenang Challenge ${
          index + 1
        } tidak sesuai.`;
      }
    }

    return "";
  }

  /* ==========================================================
     CLEAN PAYLOAD
  ========================================================== */

  function cleanPayload() {
    const payload = {
      ...(form.id
        ? { id: form.id }
        : {}),

      title: String(
        form.title || ""
      ).trim(),

      description: String(
        form.description || ""
      ).trim(),

      status:
        form.status || "draft",

      banner: String(
        form.banner || ""
      ).trim(),

      rules:
        Array.isArray(form.rules)
          ? form.rules
              .map((rule) =>
                String(
                  rule || ""
                ).trim()
              )
              .filter(Boolean)
          : [],

      challenges:
        form.challenges.map(
          (challenge) => {
            const winnerCount =
              normalizeCount(
                challenge.winnerCount
              );

            /*
             * SELALU buat ulang array
             * sesuai winnerCount.
             */

            const participants =
              createWinnerSlots(
                winnerCount,
                Array.isArray(
                  challenge.participants
                )
                  ? challenge.participants
                  : []
              );

            return {
              id:
                challenge.id ||
                createId(
                  "challenge"
                ),

              title: String(
                challenge.title ||
                  ""
              ).trim(),

              description:
                String(
                  challenge.description ||
                    ""
                ).trim(),

              type:
                challenge.type ||
                "numbered",

              image: String(
                challenge.image ||
                  ""
              ).trim(),

              /*
               * CANONICAL FIELD
               */

              winnerCount,

              /*
               * CANONICAL SLOT ARRAY
               */

              participants:
                participants.map(
                  (
                    participant,
                    index
                  ) => ({
                    username:
                      String(
                        participant?.username ||
                          ""
                      ).trim(),

                    userId:
                      String(
                        participant?.userId ||
                          ""
                      ).trim(),

                    position:
                      index + 1,

                    prize:
                      String(
                        participant?.prize ||
                          ""
                      ).trim(),

                    /*
                     * CLAIM USERNAME
                     *
                     * Username Telegram tempat
                     * hadiah diklaim/diberikan.
                     */

                    claimUsername:
                      String(
                        participant?.claimUsername ||
                          ""
                      )
                        .trim()
                        .replace(
                          /^@+/,
                          ""
                        ),

                    prizeSent:
                      Boolean(
                        participant?.prizeSent
                      ),
                  })
                ),

              items:
                Array.isArray(
                  challenge.items
                )
                  ? challenge.items
                      .map(
                        (item) => ({
                          id:
                            item?.id ||
                            createId(
                              "item"
                            ),

                          title:
                            String(
                              item?.title ||
                                ""
                            ).trim(),

                          description:
                            String(
                              item?.description ||
                                ""
                            ).trim(),

                          image:
                            String(
                              item?.image ||
                                ""
                            ).trim(),
                        })
                      )
                      .filter(
                        (item) =>
                          item.title ||
                          item.description ||
                          item.image
                      )
                  : [],
            };
          }
        ),
    };

    /*
     * DEBUG:
     * Lihat persis apa yang dikirim
     * ke backend.
     */

    console.log(
      "[EVENT EDITOR] PAYLOAD:",
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    return payload;
  }

  /* ==========================================================
     SAVE EVENT
  ========================================================== */

  async function save() {
    if (
      saving ||
      deleting
    ) {
      return;
    }

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload =
        cleanPayload();

      const currentEventId =
        form.id ||
        form._id ||
        "";

      const url =
        currentEventId
          ? apiUrl(
              `/api/admin/events/${encodeURIComponent(
                currentEventId
              )}`
            )
          : apiUrl(
              "/api/admin/events"
            );

      const method =
        currentEventId
          ? "PUT"
          : "POST";

      console.log(
        "[EVENT EDITOR] SAVE:",
        method,
        url
      );

      console.log(
        "[EVENT EDITOR] WINNER COUNTS:",
        payload.challenges.map(
          (challenge) => ({
            title:
              challenge.title,

            winnerCount:
              challenge.winnerCount,

            participants:
              challenge
                .participants
                .length,
          })
        )
      );

      const response =
        await fetch(
          url,
          {
            method,

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Gagal menyimpan event (${response.status}).`
        );
      }

      const savedEvent =
        data?.event ||
        data?.data ||
        data;

      const normalizedSavedEvent =
        normalizeEvent(
          savedEvent
        );

      setForm(
        normalizedSavedEvent
      );

      if (
        typeof onSaved ===
        "function"
      ) {
        onSaved(
          normalizedSavedEvent
        );
      }
    } catch (saveError) {
      console.error(
        "[ADMIN] Save event failed:",
        saveError
      );

      setError(
        saveError?.message ||
          "Gagal menyimpan event."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     DELETE EVENT
  ========================================================== */

  async function deleteEvent() {
    if (
      !isEditing ||
      !eventId ||
      saving ||
      deleting
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const url =
        apiUrl(
          `/api/admin/events/${encodeURIComponent(
            eventId
          )}`
        );

      const response =
        await fetch(
          url,
          {
            method:
              "DELETE",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Gagal menghapus event (${response.status}).`
        );
      }

      if (
        typeof onDeleted ===
        "function"
      ) {
        onDeleted(eventId);
      } else if (
        typeof onSaved ===
        "function"
      ) {
        onSaved(null);
      }

      if (
        typeof onClose ===
        "function"
      ) {
        onClose();
      }
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
      setDeleting(false);

      setShowDeleteConfirm(
        false
      );
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="ppk-admin-modal-backdrop">
      <section className="ppk-admin-editor-modal">
        {/* HEADER */}

        <header className="ppk-admin-editor-header">
          <div>
            <div className="ppk-admin-eyebrow">
              EVENT MANAGEMENT
            </div>

            <h2>
              {editorTitle}
            </h2>

            <p>
              Atur event, challenge,
              jumlah slot pemenang,
              dan hadiah.
            </p>
          </div>

          <button
            type="button"
            className="ppk-admin-modal-close"
            onClick={onClose}
            disabled={
              saving ||
              deleting
            }
            aria-label="Tutup editor"
          >
            <X size={21} />
          </button>
        </header>

        {/* ERROR */}

        {error && (
          <div className="ppk-admin-editor-error">
            <X size={18} />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* BODY */}

        <div className="ppk-admin-editor-body">
          {/* BASIC INFORMATION */}

          <section className="ppk-admin-editor-section">
            <div className="ppk-admin-section-heading-row">
              <div>
                <span className="ppk-admin-section-kicker">
                  INFORMASI
                </span>

                <h3 className="ppk-admin-section-title">
                  Informasi Event
                </h3>
              </div>
            </div>

            <div className="ppk-admin-form-grid">
              <label className="ppk-admin-field span-2">
                <span>
                  Judul Event
                </span>

                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "title",
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: PPK Fishing Tournament"
                  disabled={
                    saving ||
                    deleting
                  }
                />
              </label>

              <label className="ppk-admin-field span-2">
                <span>
                  Deskripsi
                </span>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Deskripsi singkat event..."
                  rows={4}
                  disabled={
                    saving ||
                    deleting
                  }
                />
              </label>

              <label className="ppk-admin-field">
                <span>
                  Status
                </span>

                <select
                  value={
                    form.status
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "status",
                      event.target
                        .value
                    )
                  }
                  disabled={
                    saving ||
                    deleting
                  }
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
              </label>

              <label className="ppk-admin-field span-2">
                <span>
                  Banner URL
                </span>

                <div className="ppk-admin-input-with-icon">
                  <ImagePlus size={17} />

                  <input
                    type="url"
                    value={
                      form.banner
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "banner",
                        event.target
                          .value
                      )
                    }
                    placeholder="https://..."
                    disabled={
                      saving ||
                      deleting
                    }
                  />
                </div>
              </label>
            </div>
          </section>

          {/* RULES */}

          <section className="ppk-admin-editor-section">
            <div className="ppk-admin-section-heading-row">
              <div>
                <span className="ppk-admin-section-kicker">
                  RULES
                </span>

                <h3 className="ppk-admin-section-title">
                  Peraturan Event
                </h3>
              </div>

              <button
                type="button"
                className="ppk-admin-secondary-btn"
                onClick={
                  addRule
                }
                disabled={
                  saving ||
                  deleting
                }
              >
                <Plus size={17} />
                Tambah Rule
              </button>
            </div>

            <div className="ppk-admin-rules-editor">
              {form.rules.length ===
              0 ? (
                <div className="ppk-admin-empty-inline">
                  Belum ada peraturan.
                </div>
              ) : (
                form.rules.map(
                  (
                    rule,
                    index
                  ) => (
                    <div
                      className="ppk-admin-rule-row"
                      key={
                        index
                      }
                    >
                      <span>
                        {index + 1}.
                      </span>

                      <input
                        type="text"
                        value={
                          rule
                        }
                        onChange={(
                          event
                        ) =>
                          updateRule(
                            index,
                            event.target
                              .value
                          )
                        }
                        placeholder={`Peraturan ${
                          index + 1
                        }`}
                        disabled={
                          saving ||
                          deleting
                        }
                      />

                      <button
                        type="button"
                        className="ppk-admin-delete-small"
                        onClick={() =>
                          removeRule(
                            index
                          )
                        }
                        disabled={
                          saving ||
                          deleting
                        }
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </div>
                  )
                )
              )}
            </div>
          </section>

          {/* CHALLENGES */}

          <section className="ppk-admin-editor-section">
            <div className="ppk-admin-section-heading-row">
              <div>
                <span className="ppk-admin-section-kicker">
                  COMPETITION
                </span>

                <h3 className="ppk-admin-section-title">
                  Challenge
                </h3>
              </div>

              <button
                type="button"
                className="ppk-admin-primary-btn"
                onClick={
                  addChallenge
                }
                disabled={
                  saving ||
                  deleting
                }
              >
                <Plus size={17} />
                Tambah Challenge
              </button>
            </div>

            <div className="ppk-admin-challenges">
              {form.challenges.map(
                (
                  challenge,
                  challengeIndex
                ) => {
                  const challengeKey =
                    challenge.id ||
                    challengeIndex;

                  const expanded =
                    expandedChallenges[
                      challengeKey
                    ] !== false;

                  const filledSlots =
                    Array.isArray(
                      challenge.participants
                    )
                      ? challenge.participants.filter(
                          (
                            participant
                          ) =>
                            Boolean(
                              participant?.username ||
                                participant?.userId
                            )
                        ).length
                      : 0;

                  const totalSlots =
                    normalizeCount(
                      challenge.winnerCount
                    );

                  return (
                    <article
                      className="ppk-admin-challenge-card"
                      key={
                        challengeKey
                      }
                    >
                      {/* HEADER */}

                      <div className="ppk-admin-challenge-header">
                        <button
                          type="button"
                          className="ppk-admin-challenge-toggle"
                          onClick={() =>
                            toggleChallenge(
                              challengeKey
                            )
                          }
                        >
                          {expanded ? (
                            <ChevronUp
                              size={18}
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                            />
                          )}
                        </button>

                        <div className="ppk-admin-drag">
                          <GripVertical
                            size={18}
                          />
                        </div>

                        <span className="ppk-admin-challenge-number">
                          {challengeIndex +
                            1}
                        </span>

                        <div className="ppk-admin-challenge-title">
                          <strong>
                            {challenge.title ||
                              `Challenge ${
                                challengeIndex +
                                1
                              }`}
                          </strong>

                          <span>
                            {filledSlots} /{" "}
                            {totalSlots}{" "}
                            slot terisi
                          </span>
                        </div>

                        <div className="ppk-admin-challenge-actions">
                          <button
                            type="button"
                            className="ppk-admin-icon-btn ppk-admin-icon-danger"
                            onClick={() =>
                              removeChallenge(
                                challengeIndex
                              )
                            }
                            disabled={
                              saving ||
                              deleting
                            }
                            title="Hapus challenge"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>
                      </div>

                      {/* BODY */}

                      {expanded && (
                        <div className="ppk-admin-challenge-body">
                          <div className="ppk-admin-form-grid">
                            <label className="ppk-admin-field span-2">
                              <span>
                                Judul Challenge
                              </span>

                              <input
                                type="text"
                                value={
                                  challenge.title
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateChallenge(
                                    challengeIndex,
                                    "title",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Nama challenge"
                                disabled={
                                  saving ||
                                  deleting
                                }
                              />
                            </label>

                            <label className="ppk-admin-field span-2">
                              <span>
                                Deskripsi
                              </span>

                              <textarea
                                value={
                                  challenge.description
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateChallenge(
                                    challengeIndex,
                                    "description",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Deskripsi challenge..."
                                rows={3}
                                disabled={
                                  saving ||
                                  deleting
                                }
                              />
                            </label>

                            <label className="ppk-admin-field">
                              <span>
                                Tipe Challenge
                              </span>

                              <select
                                value={
                                  challenge.type
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateChallenge(
                                    challengeIndex,
                                    "type",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving ||
                                  deleting
                                }
                              >
                                <option value="numbered">
                                  Numbered
                                </option>

                                <option value="custom">
                                  Custom
                                </option>
                              </select>
                            </label>

                            {/* JUMLAH SLOT */}

                            <label className="ppk-admin-field">
                              <span>
                                Jumlah Slot Pemenang
                              </span>

                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  challenge.winnerCount
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateWinnerCount(
                                    challengeIndex,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving ||
                                  deleting
                                }
                              />

                              <small>
                                Contoh 5 = 5
                                slot
                                pemenang.
                              </small>
                            </label>

                            <label className="ppk-admin-field span-2">
                              <span>
                                Image URL
                              </span>

                              <div className="ppk-admin-input-with-icon">
                                <ImagePlus
                                  size={17}
                                />

                                <input
                                  type="url"
                                  value={
                                    challenge.image
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateChallenge(
                                      challengeIndex,
                                      "image",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="https://..."
                                  disabled={
                                    saving ||
                                    deleting
                                  }
                                />
                              </div>
                            </label>
                          </div>

                          {/* WINNER SLOTS */}

                          <div className="ppk-admin-participants">
                            <div className="ppk-admin-subheading">
                              <div>
                                <strong>
                                  <Trophy
                                    size={
                                      16
                                    }
                                  />
                                  Slot Pemenang
                                </strong>

                                <span>
                                  Slot dibuat
                                  berdasarkan
                                  jumlah
                                  pemenang.
                                  Isi
                                  pemenang
                                  setelah
                                  event
                                  berlangsung.
                                </span>
                              </div>
                            </div>

                            {challenge.participants.length ===
                            0 ? (
                              <div className="ppk-admin-empty-inline">
                                Belum ada slot.
                                Tentukan
                                jumlah
                                slot
                                pemenang
                                terlebih
                                dahulu.
                              </div>
                            ) : (
                              <div className="ppk-admin-participant-list">
                                {challenge.participants.map(
                                  (
                                    participant,
                                    participantIndex
                                  ) => {
                                    const isClaimed =
                                      Boolean(
                                        participant?.username ||
                                          participant?.userId
                                      );

                                    return (
                                      <div
                                        className="ppk-admin-participant-row"
                                        key={
                                          participantIndex
                                        }
                                      >
                                        <div className="ppk-admin-position">
                                          #
                                          {participantIndex +
                                            1}
                                        </div>

                                        <input
                                          type="text"
                                          value={
                                            participant.username
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateParticipant(
                                              challengeIndex,
                                              participantIndex,
                                              "username",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          placeholder={
                                            isClaimed
                                              ? "Username pemenang"
                                              : "Kosong — belum ada pemenang"
                                          }
                                          disabled={
                                            saving ||
                                            deleting
                                          }
                                        />

                                        <input
                                          type="text"
                                          value={
                                            participant.userId
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateParticipant(
                                              challengeIndex,
                                              participantIndex,
                                              "userId",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          placeholder="User ID"
                                          disabled={
                                            saving ||
                                            deleting
                                          }
                                        />

                                        <input
                                          type="text"
                                          value={
                                            participant.prize
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateParticipant(
                                              challengeIndex,
                                              participantIndex,
                                              "prize",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          placeholder="Hadiah slot"
                                          disabled={
                                            saving ||
                                            deleting
                                          }
                                        />

                                        {/* CLAIM USERNAME */}

                                        <input
                                          type="text"
                                          value={
                                            participant.claimUsername
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateParticipant(
                                              challengeIndex,
                                              participantIndex,
                                              "claimUsername",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          placeholder="Claim / diberikan ke @username"
                                          disabled={
                                            saving ||
                                            deleting
                                          }
                                        />

                                        <label className="ppk-admin-prize-sent">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              participant.prizeSent
                                            )}
                                            onChange={(
                                              event
                                            ) =>
                                              updateParticipant(
                                                challengeIndex,
                                                participantIndex,
                                                "prizeSent",
                                                event
                                                  .target
                                                  .checked
                                              )
                                            }
                                            disabled={
                                              saving ||
                                              deleting
                                            }
                                          />

                                          <span>
                                            Terkirim
                                          </span>
                                        </label>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>

                          {/* CUSTOM ITEMS */}

                          {challenge.type ===
                            "custom" && (
                            <div className="ppk-admin-custom-items">
                              <div className="ppk-admin-subheading">
                                <div>
                                  <strong>
                                    Custom Items
                                  </strong>

                                  <span>
                                    Data tambahan
                                    untuk
                                    challenge
                                    custom.
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className="ppk-admin-secondary-btn"
                                  onClick={() =>
                                    addCustomItem(
                                      challengeIndex
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    deleting
                                  }
                                >
                                  <Plus
                                    size={
                                      16
                                    }
                                  />

                                  Tambah Item
                                </button>
                              </div>

                              {challenge.items?.length >
                              0 ? (
                                challenge.items.map(
                                  (
                                    item,
                                    itemIndex
                                  ) => (
                                    <div
                                      className="ppk-admin-custom-item"
                                      key={
                                        item.id ||
                                        itemIndex
                                      }
                                    >
                                      <input
                                        type="text"
                                        value={
                                          item.title
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateCustomItem(
                                            challengeIndex,
                                            itemIndex,
                                            "title",
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        placeholder="Judul item"
                                        disabled={
                                          saving ||
                                          deleting
                                        }
                                      />

                                      <input
                                        type="text"
                                        value={
                                          item.description
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateCustomItem(
                                            challengeIndex,
                                            itemIndex,
                                            "description",
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        placeholder="Deskripsi"
                                        disabled={
                                          saving ||
                                          deleting
                                        }
                                      />

                                      <input
                                        type="url"
                                        value={
                                          item.image
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateCustomItem(
                                            challengeIndex,
                                            itemIndex,
                                            "image",
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        placeholder="Image URL"
                                        disabled={
                                          saving ||
                                          deleting
                                        }
                                      />

                                      <button
                                        type="button"
                                        className="ppk-admin-delete-small"
                                        onClick={() =>
                                          removeCustomItem(
                                            challengeIndex,
                                            itemIndex
                                          )
                                        }
                                        disabled={
                                          saving ||
                                          deleting
                                        }
                                      >
                                        <Trash2
                                          size={
                                            16
                                          }
                                        />
                                      </button>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="ppk-admin-empty-inline">
                                  Belum ada
                                  custom
                                  item.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>

            <button
              type="button"
              className="ppk-admin-add-challenge-large"
              onClick={
                addChallenge
              }
              disabled={
                saving ||
                deleting
              }
            >
              <Plus size={20} />
              Tambah Challenge
            </button>
          </section>
        </div>

        {/* FOOTER */}

        <footer className="ppk-admin-editor-footer">
          <div>
            {isEditing && (
              <button
                type="button"
                className="ppk-admin-secondary-btn ppk-admin-delete-event-btn"
                onClick={() =>
                  setShowDeleteConfirm(
                    true
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
              >
                <Trash2
                  size={17}
                />
                Hapus Event
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              className="ppk-admin-secondary-btn"
              onClick={
                onClose
              }
              disabled={
                saving ||
                deleting
              }
            >
              Batal
            </button>

            <button
              type="button"
              className="ppk-admin-primary-btn"
              onClick={save}
              disabled={
                saving ||
                deleting
              }
            >
              {saving ? (
                <>
                  <span className="ppk-admin-button-spinner" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save
                    size={17}
                  />

                  {isEditing
                    ? "Simpan Perubahan"
                    : "Buat Event"}
                </>
              )}
            </button>
          </div>
        </footer>
      </section>

      {/* DELETE CONFIRMATION */}

      {showDeleteConfirm && (
        <div className="ppk-admin-delete-confirm-backdrop">
          <div className="ppk-admin-delete-confirm">
            <div className="ppk-admin-delete-confirm-icon">
              <Trash2 size={24} />
            </div>

            <h3>
              Hapus Event?
            </h3>

            <p>
              Event{" "}
              <strong>
                {form.title ||
                  "ini"}
              </strong>{" "}
              akan dihapus secara
              permanen.
            </p>

            <div className="ppk-admin-delete-confirm-actions">
              <button
                type="button"
                className="ppk-admin-secondary-btn"
                onClick={() =>
                  setShowDeleteConfirm(
                    false
                  )
                }
                disabled={
                  deleting
                }
              >
                Batal
              </button>

              <button
                type="button"
                className="ppk-admin-primary-btn ppk-admin-danger-btn"
                onClick={
                  deleteEvent
                }
                disabled={
                  deleting
                }
              >
                {deleting ? (
                  <>
                    <span className="ppk-admin-button-spinner" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={17}
                    />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}