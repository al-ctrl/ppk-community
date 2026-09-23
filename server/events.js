
import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// PATH
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname, "..");

const EVENTS_FILE = path.resolve(
  PROJECT_DIR,
  process.env.EVENTS_FILE || "./server/events.json"
);

// ============================================================
// HELPERS
// ============================================================

function ensureEventsFile() {
  const dir = path.dirname(EVENTS_FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }

  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(
      EVENTS_FILE,
      JSON.stringify(
        {
          events: [],
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

function readStore() {
  ensureEventsFile();

  try {
    const raw = fs.readFileSync(
      EVENTS_FILE,
      "utf8"
    );

    if (!raw.trim()) {
      return {
        events: [],
      };
    }

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return {
        events: parsed,
      };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.events)
    ) {
      return parsed;
    }

    return {
      events: [],
    };
  } catch (error) {
    console.error(
      "[EVENTS] Gagal membaca events.json:",
      error.message
    );

    return {
      events: [],
    };
  }
}

function writeStore(store) {
  ensureEventsFile();

  const tempFile = `${EVENTS_FILE}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(store, null, 2),
    "utf8"
  );

  fs.renameSync(
    tempFile,
    EVENTS_FILE
  );
}

function generateId(prefix = "event") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

// ============================================================
// NORMALIZE WINNER
// ============================================================

function normalizeWinner(
  participant = {},
  position = 1
) {
  if (typeof participant === "string") {
    return {
      username: participant.trim(),
      userId: "",
      position,
      prize: "",
      prizeSent: false,
    };
  }

  if (
    !participant ||
    typeof participant !== "object"
  ) {
    return {
      username: "",
      userId: "",
      position,
      prize: "",
      prizeSent: false,
    };
  }

  return {
    ...participant,

    username: String(
      participant.username ||
        participant.name ||
        participant.displayName ||
        ""
    ).trim(),

    userId: String(
      participant.userId ||
        participant.id ||
        participant.telegramId ||
        ""
    ).trim(),

    position,

    prize: String(
      participant.prize || ""
    ).trim(),

    prizeSent:
      participant.prizeSent === true ||
      participant.prizeSent === 1 ||
      participant.prizeSent === "1" ||
      participant.prizeSent === "true",
  };
}

// ============================================================
// NORMALIZE WINNER COUNT
// ============================================================

function normalizeWinnerCount(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.floor(parsed)
    )
  );
}

// ============================================================
// CREATE WINNER SLOTS
// ============================================================

function createWinnerSlots(
  count,
  participants = []
) {
  const safeCount =
    normalizeWinnerCount(count);

  const source =
    Array.isArray(participants)
      ? participants
      : [];

  return Array.from(
    {
      length: safeCount,
    },
    (_, index) =>
      normalizeWinner(
        source[index],
        index + 1
      )
  );
}

// ============================================================
// NORMALIZE CHALLENGE
// ============================================================

function normalizeChallenge(
  challenge = {}
) {
  const item =
    challenge &&
    typeof challenge === "object"
      ? {
          ...challenge,
        }
      : {};

  let winnerCount;

  if (
    item.winnerCount !== undefined &&
    item.winnerCount !== null &&
    item.winnerCount !== ""
  ) {
    winnerCount =
      item.winnerCount;
  } else if (
    item.winnerSlots !== undefined &&
    item.winnerSlots !== null &&
    item.winnerSlots !== ""
  ) {
    winnerCount =
      item.winnerSlots;
  } else if (
    item.winnerLimit !== undefined &&
    item.winnerLimit !== null &&
    item.winnerLimit !== ""
  ) {
    winnerCount =
      item.winnerLimit;
  } else {
    const participants =
      Array.isArray(item.participants)
        ? item.participants
        : Array.isArray(item.winners)
          ? item.winners
          : [];

    winnerCount =
      participants.length;
  }

  const normalizedCount =
    normalizeWinnerCount(
      winnerCount
    );

  let participants;

  if (
    Array.isArray(item.participants)
  ) {
    participants =
      item.participants;
  } else if (
    Array.isArray(item.winners)
  ) {
    participants =
      item.winners;
  } else {
    participants = [];
  }

  const normalizedParticipants =
    createWinnerSlots(
      normalizedCount,
      participants
    );

  const result = {
    ...item,

    winnerCount:
      normalizedCount,

    participants:
      normalizedParticipants,
  };

  delete result.winnerSlots;
  delete result.winnerLimit;
  delete result.winners;

  return result;
}

// ============================================================
// NORMALIZE EVENT BANNER
// ============================================================

function normalizeBanner(value) {
  if (!value) return "";

  if (typeof value === "object") {
    value =
      value.url ||
      value.src ||
      value.path ||
      value.location ||
      value.file ||
      value.href ||
      "";
  }

  return String(value).trim();
}

function getEventBanner(event = {}) {
  if (!event || typeof event !== "object") {
    return "";
  }

  const candidates = [
    event.banner,
    event.bannerUrl,
    event.bannerURL,
    event.bannerImage,
    event.banner_image,

    event.image,
    event.imageUrl,
    event.imageURL,

    event.cover,
    event.coverImage,
    event.coverUrl,

    event.thumbnail,
    event.thumbnailUrl,

    event.poster,
    event.posterUrl,
  ];

  for (const candidate of candidates) {
    const banner =
      normalizeBanner(candidate);

    if (banner) {
      return banner;
    }
  }

  return "";
}

// ============================================================
// NORMALIZE EVENT
// ============================================================

function normalizeEvent(
  event = {},
  existing = null
) {
  const source =
    event &&
    typeof event === "object"
      ? {
          ...event,
        }
      : {};

  const result = {
    ...(existing || {}),
    ...source,
  };

  // ==========================================================
  // BANNER
  // ==========================================================
  //
  // Semua kemungkinan field banner akan disatukan
  // menjadi field utama:
  //
  // result.banner
  //
  // Contoh yang didukung:
  // banner
  // bannerUrl
  // bannerURL
  // bannerImage
  // banner_image
  // image
  // imageUrl
  // cover
  // coverImage
  // thumbnail
  // poster
  //
  // ==========================================================

  result.banner = getEventBanner({
    ...(existing || {}),
    ...source,
  });

  // ==========================================================
  // CHALLENGES
  // ==========================================================

  if (
    Array.isArray(
      source.challenges
    )
  ) {
    result.challenges =
      source.challenges.map(
        normalizeChallenge
      );
  } else if (
    Array.isArray(
      existing?.challenges
    )
  ) {
    result.challenges =
      existing.challenges.map(
        normalizeChallenge
      );
  } else {
    result.challenges = [];
  }

  // ==========================================================
  // ID
  // ==========================================================

  if (!result.id) {
    result.id =
      generateId("event");
  }

  // ==========================================================
  // CREATED AT
  // ==========================================================

  if (!result.createdAt) {
    result.createdAt = now();
  }

  // ==========================================================
  // UPDATED AT
  // ==========================================================

  result.updatedAt = now();

  // ==========================================================
  // STATUS
  // ==========================================================

  if (!result.status) {
    result.status = "active";
  }

  if (
    ![
      "active",
      "completed",
      "archived",
    ].includes(result.status)
  ) {
    result.status = "active";
  }

  return result;
}

// ============================================================
// PUBLIC API
// ============================================================

function getEvents() {
  const store = readStore();

  return clone(
    store.events
  );
}

function getEvent(eventId) {
  if (!eventId) {
    return null;
  }

  const store = readStore();

  const event =
    store.events.find(
      (item) =>
        String(item.id) ===
        String(eventId)
    );

  return event
    ? clone(event)
    : null;
}

// ============================================================
// CREATE EVENT
// ============================================================

function createEvent(payload = {}) {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new Error(
      "Data event tidak valid."
    );
  }

  const store = readStore();

  const event =
    normalizeEvent(payload);

  store.events.push(event);

  writeStore(store);

  return clone(event);
}

// ============================================================
// UPDATE EVENT
// ============================================================

function updateEvent(
  eventId,
  payload = {}
) {
  if (!eventId) {
    return null;
  }

  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new Error(
      "Data event tidak valid."
    );
  }

  const store = readStore();

  const index =
    store.events.findIndex(
      (item) =>
        String(item.id) ===
        String(eventId)
    );

  if (index === -1) {
    return null;
  }

  const existing =
    store.events[index];

  const updated =
    normalizeEvent(
      payload,
      existing
    );

  // ID dan createdAt event lama
  // tidak boleh berubah.

  updated.id =
    existing.id;

  updated.createdAt =
    existing.createdAt ||
    updated.createdAt;

  store.events[index] =
    updated;

  writeStore(store);

  return clone(updated);
}

// ============================================================
// DELETE EVENT
// ============================================================

function deleteEvent(eventId) {
  if (!eventId) {
    return false;
  }

  const store = readStore();

  const index =
    store.events.findIndex(
      (item) =>
        String(item.id) ===
        String(eventId)
    );

  if (index === -1) {
    return false;
  }

  store.events.splice(
    index,
    1
  );

  writeStore(store);

  return true;
}

// ============================================================
// SET EVENT STATUS
// ============================================================

function setEventStatus(
  eventId,
  status
) {
  const allowed = [
    "active",
    "completed",
    "archived",
  ];

  if (
    !allowed.includes(status)
  ) {
    throw new Error(
      "Status harus active, completed, atau archived."
    );
  }

  const store = readStore();

  const event =
    store.events.find(
      (item) =>
        String(item.id) ===
        String(eventId)
    );

  if (!event) {
    return null;
  }

  event.status = status;
  event.updatedAt = now();

  writeStore(store);

  return clone(event);
}

// ============================================================
// UPDATE WINNER
// ============================================================

function updateWinner(
  eventId,
  challengeId,
  position,
  payload = {}
) {
  const numericPosition =
    Number(position);

  if (
    !Number.isInteger(
      numericPosition
    ) ||
    numericPosition < 1
  ) {
    return null;
  }

  const store = readStore();

  const event =
    store.events.find(
      (item) =>
        String(item.id) ===
        String(eventId)
    );

  if (!event) {
    return null;
  }

  if (
    !Array.isArray(
      event.challenges
    )
  ) {
    return null;
  }

  const challenge =
    event.challenges.find(
      (item) =>
        String(
          item.id ??
            item.challengeId ??
            item.slug ??
            item.name
        ) ===
        String(challengeId)
    );

  if (!challenge) {
    return null;
  }

  if (
    !Array.isArray(
      challenge.participants
    )
  ) {
    challenge.participants =
      createWinnerSlots(
        challenge.winnerCount || 0,
        []
      );
  }

  let winner =
    challenge.participants.find(
      (item) =>
        Number(
          item?.position
        ) === numericPosition
    );

  if (!winner) {
    if (
      numericPosition >
      normalizeWinnerCount(
        challenge.winnerCount
      )
    ) {
      return null;
    }

    winner =
      normalizeWinner(
        {},
        numericPosition
      );

    challenge.participants.push(
      winner
    );
  }

  if (
    payload &&
    typeof payload === "object"
  ) {
    const normalized =
      normalizeWinner(
        {
          ...winner,
          ...payload,
        },
        numericPosition
      );

    const winnerIndex =
      challenge.participants.findIndex(
        (item) =>
          Number(
            item?.position
          ) === numericPosition
      );

    if (winnerIndex !== -1) {
      challenge.participants[
        winnerIndex
      ] = normalized;

      winner =
        challenge.participants[
          winnerIndex
        ];
    }
  }

  challenge.participants.sort(
    (a, b) =>
      Number(a?.position || 0) -
      Number(b?.position || 0)
  );

  event.updatedAt = now();

  writeStore(store);

  return clone(winner);
}

// ============================================================
// SET PRIZE STATUS
// ============================================================

function setPrizeStatus(
  eventId,
  challengeId,
  position,
  sent
) {
  const numericPosition =
    Number(position);

  if (
    !Number.isInteger(
      numericPosition
    ) ||
    numericPosition < 1
  ) {
    return null;
  }

  const store = readStore();

  const event =
    store.events.find(
      (item) =>
        String(item.id) ===
        String(eventId)
    );

  if (!event) {
    return null;
  }

  if (
    !Array.isArray(
      event.challenges
    )
  ) {
    return null;
  }

  const challenge =
    event.challenges.find(
      (item) =>
        String(
          item.id ??
            item.challengeId ??
            item.slug ??
            item.name
        ) ===
        String(challengeId)
    );

  if (!challenge) {
    return null;
  }

  if (
    !Array.isArray(
      challenge.participants
    )
  ) {
    return null;
  }

  const winner =
    challenge.participants.find(
      (item) =>
        Number(
          item?.position
        ) === numericPosition
    );

  if (!winner) {
    return null;
  }

  winner.prizeSent =
    Boolean(sent);

  event.updatedAt = now();

  writeStore(store);

  return clone(winner);
}

// ============================================================
// EXPORT
// ============================================================

export {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventStatus,
  updateWinner,
  setPrizeStatus,
};