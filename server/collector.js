import "dotenv/config";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";

import * as adminAuth from "./adminAuth.js";

import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventStatus,
  updateWinner,
  setPrizeStatus,
} from "./events.js";

// ============================================================
// PATH
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname, "..");
const SERVER_DIR = __dirname;

// ============================================================
// CONFIG
// ============================================================

const PORT = Number(
  process.env.PORT || 3001
);

const API_ID = Number(
  process.env.TELEGRAM_API_ID || 0
);

const API_HASH =
  process.env.TELEGRAM_API_HASH || "";

const PHONE =
  process.env.TELEGRAM_PHONE || "";

const GROUP =
  process.env.TELEGRAM_GROUP || "";

const SESSION_FILE = path.resolve(
  PROJECT_DIR,
  process.env.SESSION_FILE ||
    "./server/session.txt"
);

const DATA_FILE = path.resolve(
  PROJECT_DIR,
  process.env.DATA_FILE ||
    "./server/community.json"
);

const POLL_INTERVAL_MS = Number(
  process.env.POLL_INTERVAL_MS || 60000
);

const TEAM_REFRESH_INTERVAL_MS = Number(
  process.env.TEAM_REFRESH_INTERVAL_MS ||
    5 * 60 * 1000
);

// ============================================================
// TEAM USERNAMES
// ============================================================

function getTeamUsernames() {
  return String(
    process.env.TELEGRAM_TEAM_USERNAMES || ""
  )
    .split(",")
    .map((username) =>
      normalizeUsername(username)
    )
    .filter(Boolean);
}

// ============================================================
// CORS
// ============================================================

const CORS_ORIGIN =
  process.env.CORS_ORIGIN ||
  "http://localhost:5173";

// ============================================================
// VALIDATION
// ============================================================

if (!API_ID) {
  console.error(
    "[CONFIG] TELEGRAM_API_ID belum diisi."
  );
}

if (!API_HASH) {
  console.error(
    "[CONFIG] TELEGRAM_API_HASH belum diisi."
  );
}

if (!PHONE) {
  console.warn(
    "[CONFIG] TELEGRAM_PHONE kosong. Session lama akan tetap digunakan jika valid."
  );
}

if (!GROUP) {
  console.error(
    "[CONFIG] TELEGRAM_GROUP belum diisi."
  );
}

console.log(
  `[TEAM] ${getTeamUsernames().length} akun Founder/Developer/Admin dikonfigurasi.`
);

// ============================================================
// EXPRESS
// ============================================================

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// ============================================================
// DIRECTORIES
// ============================================================

/*
 * PENTING:
 *
 * Tidak ada lagi:
 *
 * server/avatars/
 * server/avatars/team/
 *
 * Foto Telegram TIDAK disimpan ke filesystem.
 *
 * Foto hanya:
 * 1. diambil dari Telegram
 * 2. dikirim langsung ke browser
 * 3. dibuang dari memory setelah response selesai
 */

fs.mkdirSync(
  path.dirname(DATA_FILE),
  {
    recursive: true,
  }
);

fs.mkdirSync(
  path.dirname(SESSION_FILE),
  {
    recursive: true,
  }
);

// ============================================================
// ADMIN AUTH
// ============================================================

// ============================================================
// LOGIN
// ============================================================

app.post(
  "/api/admin/login",
  async (req, res) => {
    try {
      const username =
        String(
          req.body?.username || ""
        ).trim();

      const password =
        String(
          req.body?.password || ""
        );

      if (!username || !password) {
        return res.status(400).json({
          ok: false,
          error:
            "Username dan password wajib diisi.",
        });
      }

      const admin =
        await adminAuth.authenticateAdmin(
          username,
          password
        );

      if (!admin) {
        return res.status(401).json({
          ok: false,
          authenticated: false,
          error:
            "Username atau password salah.",
        });
      }

      const sessionId =
        adminAuth.createAdminSession(
          admin
        );

      adminAuth.setAdminCookie(
        res,
        sessionId
      );

      return res.json({
        ok: true,
        authenticated: true,
        admin,
      });
    } catch (error) {
      console.error(
        "[ADMIN LOGIN]",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Gagal melakukan login.",
      });
    }
  }
);

// ============================================================
// CURRENT ADMIN
// ============================================================

app.get(
  "/api/admin/me",
  (req, res) => {
    try {
      const admin =
        adminAuth.getAdminFromRequest(
          req
        );

      if (!admin) {
        return res.status(401).json({
          ok: false,
          authenticated: false,
        });
      }

      return res.json({
        ok: true,
        authenticated: true,
        admin,
      });
    } catch (error) {
      console.error(
        "[ADMIN ME]",
        error
      );

      return res.status(500).json({
        ok: false,
        authenticated: false,
        error:
          "Gagal membaca session admin.",
      });
    }
  }
);

// ============================================================
// LOGOUT
// ============================================================

app.post(
  "/api/admin/logout",
  (req, res) => {
    try {
      const cookieHeader =
        String(
          req.headers.cookie || ""
        );

      const match =
        cookieHeader.match(
          /(?:^|;\s*)ppk_admin_session=([^;]+)/
        );

      const sessionId =
        match?.[1]
          ? decodeURIComponent(
              match[1]
            )
          : null;

      if (sessionId) {
        adminAuth.deleteAdminSession(
          sessionId
        );
      }

      adminAuth.clearAdminCookie(
        res
      );

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error(
        "[ADMIN LOGOUT]",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Gagal logout.",
      });
    }
  }
);

// ============================================================
// ADMIN TEST
// ============================================================

app.get(
  "/api/admin/test",
  adminAuth.requireAdmin,
  (req, res) => {
    return res.json({
      ok: true,
      message:
        "Admin authentication berhasil.",
      admin: req.admin,
    });
  }
);

// ============================================================
// EVENTS PUBLIC API
// ============================================================

app.get(
  "/api/events",
  (req, res) => {
    try {
      return res.json({
        ok: true,
        events: getEvents(),
      });
    } catch (error) {
      console.error(
        "[EVENTS GET]",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Gagal membaca events.",
      });
    }
  }
);

app.get(
  "/api/events/:eventId",
  (req, res) => {
    try {
      const event =
        getEvent(
          req.params.eventId
        );

      if (!event) {
        return res.status(404).json({
          ok: false,
          error:
            "Event tidak ditemukan.",
        });
      }

      return res.json({
        ok: true,
        event,
      });
    } catch (error) {
      console.error(
        "[EVENT GET]",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Gagal membaca event.",
      });
    }
  }
);

// ============================================================
// EVENTS ADMIN API
// ============================================================

app.post(
  "/api/admin/events",
  adminAuth.requireAdmin,
  (req, res) => {
    try {
      const event =
        createEvent(
          req.body || {}
        );

      return res.status(201).json({
        ok: true,
        event,
      });
    } catch (error) {
      console.error(
        "[EVENT CREATE]",
        error
      );

      return res.status(400).json({
        ok: false,
        error:
          error.message ||
          "Gagal membuat event.",
      });
    }
  }
);

app.put(
  "/api/admin/events/:eventId",
  adminAuth.requireAdmin,
  (req, res) => {
    try {
      const event =
        updateEvent(
          req.params.eventId,
          req.body || {}
        );

      if (!event) {
        return res.status(404).json({
          ok: false,
          error:
            "Event tidak ditemukan.",
        });
      }

      return res.json({
        ok: true,
        event,
      });
    } catch (error) {
      console.error(
        "[EVENT UPDATE]",
        error
      );

      return res.status(400).json({
        ok: false,
        error:
          error.message ||
          "Gagal memperbarui event.",
      });
    }
  }
);

app.delete(
  "/api/admin/events/:eventId",
  adminAuth.requireAdmin,
  (req, res) => {
    try {
      const deleted =
        deleteEvent(
          req.params.eventId
        );

      if (!deleted) {
        return res.status(404).json({
          ok: false,
          error:
            "Event tidak ditemukan.",
        });
      }

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error(
        "[EVENT DELETE]",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Gagal menghapus event.",
      });
    }
  }
);

app.patch(
  "/api/admin/events/:eventId/status",
  adminAuth.requireAdmin,
  (req, res) => {
    try {
      const status =
        String(
          req.body?.status || ""
        ).trim();

      if (
        ![
          "active",
          "completed",
          "archived",
        ].includes(status)
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Status harus active, completed, atau archived.",
        });
      }

      const event =
        setEventStatus(
          req.params.eventId,
          status
        );

      if (!event) {
        return res.status(404).json({
          ok: false,
          error:
            "Event tidak ditemukan.",
        });
      }

      return res.json({
        ok: true,
        event,
      });
    } catch (error) {
      console.error(
        "[EVENT STATUS]",
        error
      );

      return res.status(400).json({
        ok: false,
        error:
          error.message ||
          "Gagal mengubah status event.",
      });
    }
  }
);

// ============================================================
// WINNER MANAGEMENT
// ============================================================

app.patch(
  "/api/admin/events/:eventId/challenges/:challengeId/winners/:position",
  adminAuth.requireAdmin,
  (req, res) => {
    try {
      const position =
        Number(
          req.params.position
        );

      if (
        !Number.isInteger(position) ||
        position < 1
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Posisi winner tidak valid.",
        });
      }

      const winner =
        updateWinner(
          req.params.eventId,
          req.params.challengeId,
          position,
          req.body || {}
        );

      if (!winner) {
        return res.status(404).json({
          ok: false,
          error:
            "Event, challenge, atau posisi winner tidak ditemukan.",
        });
      }

      return res.json({
        ok: true,
        winner,
      });
    } catch (error) {
      console.error(
        "[WINNER UPDATE]",
        error
      );

      return res.status(400).json({
        ok: false,
        error:
          error.message ||
          "Gagal memperbarui winner.",
      });
    }
  }
);

app.patch(
  "/api/admin/events/:eventId/challenges/:challengeId/winners/:position/prize",
  adminAuth.requireAdmin,
  (req, res) => {
    try {
      const position =
        Number(
          req.params.position
        );

      if (
        !Number.isInteger(position) ||
        position < 1
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Posisi winner tidak valid.",
        });
      }

      const sent =
        Boolean(
          req.body?.sent
        );

      const winner =
        setPrizeStatus(
          req.params.eventId,
          req.params.challengeId,
          position,
          sent
        );

      if (!winner) {
        return res.status(404).json({
          ok: false,
          error:
            "Winner tidak ditemukan.",
        });
      }

      return res.json({
        ok: true,
        winner,
      });
    } catch (error) {
      console.error(
        "[PRIZE STATUS]",
        error
      );

      return res.status(400).json({
        ok: false,
        error:
          error.message ||
          "Gagal mengubah status hadiah.",
      });
    }
  }
);

// ============================================================
// TELEGRAM SESSION
// ============================================================

let savedSession = "";

if (
  fs.existsSync(SESSION_FILE)
) {
  try {
    savedSession =
      fs
        .readFileSync(
          SESSION_FILE,
          "utf8"
        )
        .trim();

    if (savedSession) {
      console.log(
        `[SESSION] Session ditemukan: ${SESSION_FILE}`
      );
    } else {
      console.log(
        "[SESSION] File session kosong."
      );
    }
  } catch (error) {
    console.error(
      "[SESSION] Gagal membaca session:",
      error.message
    );
  }
} else {
  console.log(
    `[SESSION] Session belum ada: ${SESSION_FILE}`
  );
}

// ============================================================
// STRING SESSION
// ============================================================

const stringSession =
  new StringSession(
    savedSession
  );

const client =
  new TelegramClient(
    stringSession,
    API_ID,
    API_HASH,
    {
      connectionRetries: 5,
      autoReconnect: true,
    }
  );

// ============================================================
// RUNTIME STATE
// ============================================================

let telegramReady = false;
let lastUpdate = null;
let lastError = null;
let updateRunning = false;
let teamRefreshRunning = false;
let telegramLoginRunning = false;
let lastTeamRefresh = null;

/*
 * Cache ini hanya menyimpan DATA PROFILE ringan
 * selama proses Node.js berjalan.
 *
 * TIDAK ADA FOTO yang disimpan di sini.
 */
const teamProfileCache =
  new Map();

/*
 * Entity member hanya disimpan di memory.
 *
 * Ini bukan file.
 * Akan hilang ketika process restart.
 *
 * Digunakan supaya endpoint avatar member
 * bisa mengambil foto terbaru langsung dari Telegram.
 */
const memberEntityCache =
  new Map();

// ============================================================
// HELPER
// ============================================================

function normalizeUsername(
  username
) {
  return String(
    username || ""
  )
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

function fileExists(
  file
) {
  try {
    return (
      fs.existsSync(file) &&
      fs.statSync(file).size > 0
    );
  } catch {
    return false;
  }
}

// ============================================================
// PHOTO VERSION
// ============================================================

function getTelegramPhotoVersion(
  user
) {
  try {
    const photo =
      user?.photo;

    if (!photo) {
      return "none";
    }

    if (
      photo.photoId !== undefined &&
      photo.photoId !== null
    ) {
      return String(
        photo.photoId
      );
    }

    if (
      photo.id !== undefined &&
      photo.id !== null
    ) {
      return String(
        photo.id
      );
    }

    if (
      photo.dcId !== undefined &&
      photo.dcId !== null
    ) {
      return String(
        photo.dcId
      );
    }

    return "photo";
  } catch {
    return "photo";
  }
}

// ============================================================
// DYNAMIC AVATAR URL
// ============================================================

function getAvatarUrl(
  userId,
  username = "",
  photoVersion = ""
) {
  const id =
    encodeURIComponent(
      String(userId || "")
    );

  const params =
    new URLSearchParams();

  if (username) {
    params.set(
      "username",
      normalizeUsername(username)
    );
  }

  if (photoVersion) {
    params.set(
      "v",
      String(photoVersion)
    );
  }

  const query =
    params.toString();

  return `/api/avatar/${id}${
    query
      ? `?${query}`
      : ""
  }`;
}

// ============================================================
// TEAM AVATAR URL
// ============================================================

function getTeamAvatarUrl(
  username,
  photoVersion = ""
) {
  const cleanUsername =
    normalizeUsername(username);

  if (!cleanUsername) {
    return null;
  }

  const params =
    new URLSearchParams();

  if (photoVersion) {
    params.set(
      "v",
      String(photoVersion)
    );
  }

  const query =
    params.toString();

  return `/api/telegram/avatar/${encodeURIComponent(
    cleanUsername
  )}${
    query
      ? `?${query}`
      : ""
  }`;
}

// ============================================================
// SAVE SESSION
// ============================================================

function saveSession() {
  try {
    const session =
      client.session.save();

    if (
      !session ||
      typeof session !== "string"
    ) {
      throw new Error(
        "Session kosong."
      );
    }

    const tempFile =
      `${SESSION_FILE}.tmp`;

    fs.writeFileSync(
      tempFile,
      session,
      "utf8"
    );

    fs.renameSync(
      tempFile,
      SESSION_FILE
    );

    console.log(
      `[SESSION] Session tersimpan: ${SESSION_FILE}`
    );

    return true;
  } catch (error) {
    console.error(
      "[SESSION] Gagal menyimpan session:",
      error.message
    );

    return false;
  }
}

// ============================================================
// GROUP INFO
// ============================================================

function getGroupUsername() {
  const value =
    String(
      GROUP || ""
    ).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("@")
  ) {
    return value;
  }

  if (
    value.startsWith(
      "https://t.me/"
    )
  ) {
    const username =
      value
        .replace(
          "https://t.me/",
          ""
        )
        .split("/")
        .filter(Boolean)[0];

    if (username) {
      return `@${username}`;
    }
  }

  return `@${value}`;
}

function getGroupInviteLink() {
  const value =
    String(
      GROUP || ""
    ).trim();

  if (
    value.startsWith(
      "https://t.me/"
    )
  ) {
    return value;
  }

  const username =
    normalizeUsername(value);

  if (!username) {
    return null;
  }

  return `https://t.me/${username}`;
}

function getGroupInfo() {
  return {
    username:
      getGroupUsername(),

    inviteLink:
      getGroupInviteLink(),
  };
}

// ============================================================
// TELEGRAM NAME
// ============================================================

function getTelegramDisplayName(
  user,
  fallback
) {
  const firstName =
    String(
      user?.firstName || ""
    ).trim();

  const lastName =
    String(
      user?.lastName || ""
    ).trim();

  const fullName = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  const username =
    String(
      user?.username || ""
    ).trim();

  if (username) {
    return `@${username}`;
  }

  return (
    fallback ||
    "Telegram User"
  );
}

function getTelegramUsername(
  user,
  fallback
) {
  const username =
    String(
      user?.username || ""
    ).trim();

  if (username) {
    return `@${username}`;
  }

  const cleanFallback =
    normalizeUsername(
      fallback
    );

  if (cleanFallback) {
    return `@${cleanFallback}`;
  }

  return "@unknown";
}

// ============================================================
// TELEGRAM STATUS
// ============================================================

function getTelegramStatusClass(
  status
) {
  if (!status) {
    return "";
  }

  return String(
    status.className ||
      status.constructor?.className ||
      status.constructor?.name ||
      ""
  );
}

function getTelegramPresence(
  user
) {
  if (!user) {
    return {
      online: false,
      recently: false,
      status: "unknown",
    };
  }

  const status =
    user.status;

  const className =
    getTelegramStatusClass(
      status
    );

  switch (className) {
    case "UserStatusOnline":
      return {
        online: true,
        recently: false,
        status: "online",
      };

    case "UserStatusRecently":
      return {
        online: false,
        recently: true,
        status: "recently",
      };

    case "UserStatusOffline":
      return {
        online: false,
        recently: false,
        status: "offline",
      };

    case "UserStatusLastWeek":
      return {
        online: false,
        recently: false,
        status: "last_week",
      };

    case "UserStatusLastMonth":
      return {
        online: false,
        recently: false,
        status: "last_month",
      };

    default:
      return {
        online: false,
        recently: false,
        status:
          className ||
          "unknown",
      };
  }
}

// ============================================================
// RESOLVE TELEGRAM USER
// ============================================================

async function resolveTelegramUser(
  username
) {
  const cleanUsername =
    normalizeUsername(username);

  if (!cleanUsername) {
    throw new Error(
      "Username Telegram kosong."
    );
  }

  try {
    const user =
      await client.getEntity(
        cleanUsername
      );

    if (
      !user ||
      !user.id
    ) {
      throw new Error(
        "User tidak ditemukan."
      );
    }

    return user;
  } catch (error) {
    console.error(
      `[TEAM] @${cleanUsername} gagal di-resolve:`,
      error.message
    );

    throw new Error(
      `Telegram tidak menemukan @${cleanUsername}. Pastikan username Telegram benar.`
    );
  }
}

// ============================================================
// RESOLVE MEMBER BY ID
// ============================================================

async function resolveMemberUser(
  userId,
  username = ""
) {
  const cleanUsername =
    normalizeUsername(
      username
    );

  /*
   * Prioritas 1:
   * Username karena lebih reliable untuk
   * mengambil user Telegram secara langsung.
   */
  if (cleanUsername) {
    try {
      const user =
        await client.getEntity(
          cleanUsername
        );

      if (
        user &&
        user.id
      ) {
        memberEntityCache.set(
          String(user.id),
          user
        );

        return user;
      }
    } catch (error) {
      console.warn(
        `[MEMBER AVATAR] Gagal resolve @${cleanUsername}:`,
        error.message
      );
    }
  }

  /*
   * Prioritas 2:
   * Entity yang masih tersedia di memory.
   */
  const cached =
    memberEntityCache.get(
      String(userId)
    );

  if (
    cached &&
    cached.id
  ) {
    return cached;
  }

  /*
   * Prioritas 3:
   * Resolve menggunakan Telegram ID.
   */
  try {
    const numericId =
      BigInt(
        String(userId)
      );

    const user =
      await client.getEntity(
        numericId
      );

    if (
      user &&
      user.id
    ) {
      memberEntityCache.set(
        String(user.id),
        user
      );

      return user;
    }
  } catch (error) {
    console.warn(
      `[MEMBER AVATAR] Gagal resolve ID ${userId}:`,
      error.message
    );
  }

  return null;
}

// ============================================================
// DOWNLOAD TELEGRAM PHOTO
// ============================================================

async function downloadTelegramPhoto(
  user
) {
  if (
    !user ||
    !user.id
  ) {
    return null;
  }

  try {
    const buffer =
      await client.downloadProfilePhoto(
        user,
        {
          isBig: false,
        }
      );

    if (
      Buffer.isBuffer(buffer) &&
      buffer.length > 0
    ) {
      return buffer;
    }

    if (
      buffer instanceof Uint8Array &&
      buffer.length > 0
    ) {
      return Buffer.from(
        buffer
      );
    }

    return null;
  } catch (error) {
    console.error(
      `[AVATAR] Gagal mengambil foto Telegram ${user.id}:`,
      error.message
    );

    return null;
  }
}

// ============================================================
// TEAM TELEGRAM PROFILE
// ============================================================

async function getTelegramTeamProfile(
  username,
  options = {}
) {
  const cleanUsername =
    normalizeUsername(username);

  if (!cleanUsername) {
    throw new Error(
      "Username Telegram kosong."
    );
  }

  const forceRefresh =
    options.forceRefresh === true;

  const cached =
    teamProfileCache.get(
      cleanUsername
    );

  if (
    !forceRefresh &&
    cached &&
    Date.now() -
      cached.updatedAt <
      60 * 1000
  ) {
    return cached.profile;
  }

  /*
   * Selalu resolve ulang Telegram
   * ketika forceRefresh aktif.
   */
  const user =
    await resolveTelegramUser(
      cleanUsername
    );

  const telegramId =
    String(user.id);

  const firstName =
    String(
      user?.firstName || ""
    ).trim();

  const lastName =
    String(
      user?.lastName || ""
    ).trim();

  const name =
    getTelegramDisplayName(
      user,
      `@${cleanUsername}`
    );

  const telegramUsername =
    getTelegramUsername(
      user,
      cleanUsername
    );

  const photoVersion =
    getTelegramPhotoVersion(
      user
    );

  /*
   * Foto TIDAK didownload di sini.
   *
   * Website akan meminta:
   *
   * /api/telegram/avatar/:username?v=PHOTO_ID
   *
   * Endpoint tersebut yang mengambil foto
   * langsung dari Telegram.
   */
  const photo =
    getTeamAvatarUrl(
      cleanUsername,
      photoVersion
    );

  const profile = {
    id: telegramId,
    username: telegramUsername,
    firstName,
    lastName,
    name,
    photo,
    hasPhoto:
      Boolean(user?.photo),
    photoVersion,
    source: "telegram",
    updatedAt:
      new Date().toISOString(),
  };

  teamProfileCache.set(
    cleanUsername,
    {
      profile,
      updatedAt: Date.now(),
    }
  );

  return profile;
}

// ============================================================
// REFRESH TEAM PROFILES
// ============================================================

async function refreshAllTeamProfiles() {
  if (!telegramReady) {
    return;
  }

  if (teamRefreshRunning) {
    console.log(
      "[TEAM REFRESH] Refresh sebelumnya masih berjalan."
    );

    return;
  }

  const usernames =
    getTeamUsernames();

  if (
    usernames.length === 0
  ) {
    return;
  }

  teamRefreshRunning = true;

  console.log(
    `[TEAM REFRESH] Memperbarui ${usernames.length} Founder/Developer/Admin...`
  );

  let success = 0;
  let failed = 0;

  try {
    for (
      const username of usernames
    ) {
      try {
        const previous =
          teamProfileCache.get(
            username
          )?.profile || null;

        const profile =
          await getTelegramTeamProfile(
            username,
            {
              forceRefresh: true,
            }
          );

        success++;

        if (previous) {
          const nameChanged =
            previous.name !==
            profile.name;

          const usernameChanged =
            previous.username !==
            profile.username;

          const photoChanged =
            previous.photoVersion !==
            profile.photoVersion;

          if (
            nameChanged ||
            usernameChanged ||
            photoChanged
          ) {
            console.log(
              `[TEAM UPDATE] ${username} | ${
                nameChanged
                  ? "NAMA "
                  : ""
              }${
                usernameChanged
                  ? "USERNAME "
                  : ""
              }${
                photoChanged
                  ? "FOTO"
                  : ""
              }`
            );
          }
        }

        console.log(
          `[TEAM REFRESH] ${username} -> ${profile.name}`
        );
      } catch (error) {
        failed++;

        console.error(
          `[TEAM REFRESH] ${username} gagal:`,
          error.message
        );
      }
    }

    lastTeamRefresh =
      new Date().toISOString();

    console.log(
      `[TEAM REFRESH] Selesai | berhasil: ${success} | gagal: ${failed}`
    );
  } finally {
    teamRefreshRunning = false;
  }
}

// ============================================================
// COMMUNITY RESPONSE
// ============================================================

function buildCommunityResponse(
  rawData
) {
  const data =
    rawData &&
    typeof rawData === "object"
      ? rawData
      : {};

  const memberList =
    Array.isArray(
      data.members
    )
      ? data.members
      : [];

  const totalMembers =
    Number(
      data.totalMembers ??
        memberList.length ??
        0
    );

  const onlineMembers =
    Number(
      data.onlineMembers ??
        memberList.filter(
          (member) =>
            member?.online === true
        ).length ??
        0
    );

  const recentlyMembers =
    Number(
      data.recentlyMembers ??
        memberList.filter(
          (member) =>
            member?.recently === true
        ).length ??
        0
    );

  const activeCrew =
    memberList.filter(
      (member) =>
        member?.online === true
    );

  const onlinePercent =
    totalMembers > 0
      ? Number(
          (
            (onlineMembers /
              totalMembers) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    ok: true,

    group:
      getGroupInfo(),

    members:
      totalMembers,

    online:
      onlineMembers,

    recently:
      recentlyMembers,

    onlinePercent,

    activeCrew,

    totalMembers,

    onlineMembers,

    recentlyMembers,

    memberList,

    updatedAt:
      data.updatedAt ||
      null,
  };
}

// ============================================================
// LOAD COMMUNITY
// ============================================================

function loadCommunityData() {
  try {
    if (
      !fs.existsSync(
        DATA_FILE
      )
    ) {
      return buildCommunityResponse({
        members: [],
        updatedAt: null,
      });
    }

    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    const data =
      JSON.parse(raw);

    return buildCommunityResponse(
      data
    );
  } catch (error) {
    console.error(
      "[DATA] Gagal membaca community.json:",
      error.message
    );

    return buildCommunityResponse({
      members: [],
      updatedAt: null,
    });
  }
}

// ============================================================
// COLLECT MEMBERS
// ============================================================

async function collectMembers() {
  if (!telegramReady) {
    return null;
  }

  try {
    console.log(
      "[COLLECTOR] Mengambil semua member Telegram..."
    );

    const entity =
      await client.getEntity(
        GROUP
      );

    const members = [];

    let onlineCount = 0;
    let recentlyCount = 0;

    for await (
      const participant of
        client.iterParticipants(
          entity
        )
    ) {
      if (!participant) {
        continue;
      }

      const userId =
        String(
          participant.id
        );

      /*
       * Simpan entity Telegram di MEMORY saja.
       *
       * Tidak menyimpan foto.
       * Tidak menyimpan ke JSON.
       */
      memberEntityCache.set(
        userId,
        participant
      );

      const firstName =
        String(
          participant.firstName || ""
        ).trim();

      const lastName =
        String(
          participant.lastName || ""
        ).trim();

      const username =
        participant.username
          ? `@${participant.username}`
          : null;

      const name =
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        username ||
        "Telegram User";

      const presence =
        getTelegramPresence(
          participant
        );

      if (
        presence.online
      ) {
        onlineCount++;
      }

      if (
        presence.recently
      ) {
        recentlyCount++;
      }

      /*
       * TIDAK ADA downloadProfilePhoto()
       * di collector.
       *
       * Foto hanya diambil ketika website
       * meminta /api/avatar/:id
       */
      const photoVersion =
        getTelegramPhotoVersion(
          participant
        );

      const photo =
        getAvatarUrl(
          userId,
          participant.username || "",
          photoVersion
        );

      members.push({
        id: userId,
        name,
        username,
        firstName,
        lastName,
        online:
          presence.online,
        recently:
          presence.recently,
        status:
          presence.status,
        photo,
        photoVersion,
        hasPhoto:
          Boolean(
            participant.photo
          ),

        telegram: {
          id: userId,
          username,
          firstName,
          lastName,
          name,
        },
      });
    }

    const result = {
      group:
        getGroupInfo(),

      totalMembers:
        members.length,

      onlineMembers:
        onlineCount,

      recentlyMembers:
        recentlyCount,

      members,

      updatedAt:
        new Date().toISOString(),
    };

    console.log(
      `[COLLECTOR] Selesai: ${result.totalMembers} members | ${result.onlineMembers} online | ${result.recentlyMembers} recently`
    );

    return result;
  } catch (error) {
    console.error(
      "[COLLECTOR] Gagal mengambil members:",
      error
    );

    lastError =
      error.message;

    return null;
  }
}

// ============================================================
// SAVE COMMUNITY
// ============================================================

function saveCommunity(
  data
) {
  if (!data) {
    return;
  }

  try {
    const tempFile =
      `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    fs.renameSync(
      tempFile,
      DATA_FILE
    );

    console.log(
      "[DATA] community.json diperbarui."
    );
  } catch (error) {
    console.error(
      "[DATA] Gagal menyimpan community.json:",
      error.message
    );
  }
}

// ============================================================
// COMMUNITY UPDATE
// ============================================================

async function updateCommunity() {
  if (!telegramReady) {
    return;
  }

  if (updateRunning) {
    console.log(
      "[COMMUNITY] Update sebelumnya masih berjalan, dilewati."
    );

    return;
  }

  updateRunning = true;

  try {
    const data =
      await collectMembers();

    if (!data) {
      return;
    }

    saveCommunity(data);

    lastUpdate =
      data.updatedAt ||
      new Date().toISOString();

    lastError = null;

    console.log(
      `[COMMUNITY] ${data.totalMembers} members | ${data.onlineMembers} online | ${data.recentlyMembers} recently`
    );
  } catch (error) {
    lastError =
      error.message;

    console.error(
      "[COMMUNITY] Update gagal:",
      error
    );
  } finally {
    updateRunning = false;
  }
}

// ============================================================
// ROOT
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      ok: true,

      name:
        "PPK Telegram Collector",

      status:
        telegramReady
          ? "online"
          : "starting",

      endpoints: {
        community:
          "/api/community",

        health:
          "/api/health",

        team:
          "/api/team/:username",

        teamAvatar:
          "/api/telegram/avatar/:username",

        memberAvatar:
          "/api/avatar/:id",

        teamRefresh:
          "/api/team/refresh",

        adminLogin:
          "/api/admin/login",

        adminMe:
          "/api/admin/me",

        adminLogout:
          "/api/admin/logout",

        events:
          "/api/events",
      },

      updatedAt:
        lastUpdate,

      teamUpdatedAt:
        lastTeamRefresh,
    });
  }
);

// ============================================================
// HEALTH
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,

      telegram:
        telegramReady,

      updateRunning,

      teamRefreshRunning,

      lastUpdate,

      lastTeamRefresh,

      lastError,

      sessionFile:
        SESSION_FILE,

      sessionExists:
        fileExists(
          SESSION_FILE
        ),

      teamCount:
        getTeamUsernames()
          .length,

      cachedMemberEntities:
        memberEntityCache.size,

      cachedTeamProfiles:
        teamProfileCache.size,

      time:
        new Date().toISOString(),
    });
  }
);

// ============================================================
// COMMUNITY API
// ============================================================

app.get(
  "/api/community",
  (req, res) => {
    try {
      return res.json(
        loadCommunityData()
      );
    } catch (error) {
      console.error(
        "[API COMMUNITY]",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Gagal membaca community.json",
      });
    }
  }
);

// ============================================================
// MEMBER AVATAR API
// ============================================================

app.get(
  "/api/avatar/:id",
  async (req, res) => {
    const userId =
      String(
        req.params.id || ""
      ).trim();

    const username =
      normalizeUsername(
        req.query?.username || ""
      );

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error:
          "ID Telegram tidak valid.",
      });
    }

    if (!telegramReady) {
      return res.status(503).json({
        ok: false,
        error:
          "Telegram collector belum siap.",
      });
    }

    try {
      const user =
        await resolveMemberUser(
          userId,
          username
        );

      if (
        !user
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "User Telegram tidak ditemukan.",
        });
      }

      /*
       * Ambil foto langsung dari Telegram.
       *
       * TIDAK ADA:
       *
       * fs.writeFileSync()
       *
       * Foto hanya berada di RAM
       * selama request berlangsung.
       */
      const buffer =
        await downloadTelegramPhoto(
          user
        );

      if (
        !buffer
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "User tidak memiliki foto profil Telegram.",
        });
      }

      res.setHeader(
        "Content-Type",
        "image/jpeg"
      );

      /*
       * Sangat penting:
       *
       * Jangan cache foto Telegram.
       *
       * Kalau user mengganti PP,
       * browser tidak akan menggunakan
       * file/foto lama dari cache.
       */
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );

      res.setHeader(
        "Pragma",
        "no-cache"
      );

      res.setHeader(
        "Expires",
        "0"
      );

      res.setHeader(
        "Content-Length",
        String(
          buffer.length
        )
      );

      return res.send(
        buffer
      );
    } catch (error) {
      console.error(
        `[MEMBER AVATAR] ${userId} ERROR:`,
        error.message
      );

      return res.status(404).json({
        ok: false,
        error:
          error.message ||
          "Foto Telegram tidak dapat diambil.",
      });
    }
  }
);

// ============================================================
// TEAM PROFILE API
// ============================================================

app.get(
  "/api/team/:username",
  async (req, res) => {
    const username =
      normalizeUsername(
        req.params.username
      );

    if (!username) {
      return res.status(400).json({
        ok: false,
        error:
          "Username Telegram tidak valid.",
      });
    }

    if (!telegramReady) {
      return res.status(503).json({
        ok: false,
        error:
          "Telegram collector belum siap.",
      });
    }

    try {
      const profile =
        await getTelegramTeamProfile(
          username,
          {
            /*
             * Profile Team selalu diambil
             * terbaru ketika API dipanggil.
             *
             * Cache hanya profile TEXT ringan.
             * Foto tidak pernah disimpan.
             */
            forceRefresh: true,
          }
        );

      return res.json({
        ok: true,
        ...profile,
      });
    } catch (error) {
      console.error(
        `[TEAM API] @${username} ERROR:`,
        error.message
      );

      return res.status(404).json({
        ok: false,
        username:
          `@${username}`,
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// TEAM AVATAR API
// ============================================================

app.get(
  "/api/telegram/avatar/:username",
  async (req, res) => {
    const username =
      normalizeUsername(
        req.params.username
      );

    if (!username) {
      return res.status(400).json({
        ok: false,
        error:
          "Username Telegram tidak valid.",
      });
    }

    if (!telegramReady) {
      return res.status(503).json({
        ok: false,
        error:
          "Telegram collector belum siap.",
      });
    }

    try {
      /*
       * Selalu resolve ulang user Telegram.
       *
       * Tidak ada file cache.
       */
      const user =
        await resolveTelegramUser(
          username
        );

      /*
       * Ambil foto langsung dari Telegram.
       */
      const buffer =
        await downloadTelegramPhoto(
          user
        );

      if (
        !buffer
      ) {
        return res.status(404).json({
          ok: false,
          error:
            `@${username} tidak memiliki foto profil Telegram.`,
        });
      }

      res.setHeader(
        "Content-Type",
        "image/jpeg"
      );

      /*
       * Jangan cache.
       *
       * Jadi saat PP Telegram berubah,
       * request berikutnya mengambil foto baru.
       */
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );

      res.setHeader(
        "Pragma",
        "no-cache"
      );

      res.setHeader(
        "Expires",
        "0"
      );

      res.setHeader(
        "Content-Length",
        String(
          buffer.length
        )
      );

      /*
       * Langsung kirim buffer.
       *
       * Tidak pernah:
       *
       * fs.writeFileSync()
       * fs.sendFile()
       */
      return res.send(
        buffer
      );
    } catch (error) {
      console.error(
        `[TEAM AVATAR] @${username} ERROR:`,
        error.message
      );

      return res.status(404).json({
        ok: false,
        error:
          error.message ||
          `Foto Telegram @${username} tidak dapat diambil.`,
      });
    }
  }
);

// ============================================================
// MANUAL TEAM REFRESH
// ============================================================

app.post(
  "/api/team/refresh",
  async (req, res) => {
    if (!telegramReady) {
      return res.status(503).json({
        ok: false,
        error:
          "Telegram collector belum siap.",
      });
    }

    try {
      await refreshAllTeamProfiles();

      const profiles = {};

      for (
        const username of
          getTeamUsernames()
      ) {
        const profile =
          teamProfileCache.get(
            username
          )?.profile;

        if (profile) {
          profiles[
            username
          ] = profile;
        }
      }

      return res.json({
        ok: true,
        updatedAt:
          lastTeamRefresh,
        profiles,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// CLEAR TEAM CACHE
// ============================================================

app.delete(
  "/api/team/:username/cache",
  (req, res) => {
    const username =
      normalizeUsername(
        req.params.username
      );

    if (!username) {
      return res.status(400).json({
        ok: false,
        error:
          "Username tidak valid.",
      });
    }

    /*
     * Tidak ada file yang dihapus
     * karena memang tidak ada foto
     * yang disimpan ke disk.
     */
    const existed =
      teamProfileCache.has(
        username
      );

    teamProfileCache.delete(
      username
    );

    return res.json({
      ok: true,
      username:
        `@${username}`,
      cacheDeleted:
        existed,
      photoStorage:
        "none",
    });
  }
);

// ============================================================
// START TELEGRAM
// ============================================================

async function startTelegram() {
  if (telegramLoginRunning) {
    console.log(
      "[TELEGRAM] Proses login sudah berjalan."
    );

    return;
  }

  telegramLoginRunning = true;

  try {
    console.log(
      "[TELEGRAM] Connecting..."
    );

    if (savedSession) {
      console.log(
        "[SESSION] Session lama ditemukan."
      );

      try {
        await client.connect();

        const authorized =
          await client.checkAuthorization();

        if (authorized) {
          telegramReady = true;

          saveSession();

          console.log(
            "[SESSION] Session lama VALID."
          );

          console.log(
            "[TELEGRAM] Login ulang TIDAK diperlukan."
          );

          return;
        }

        console.warn(
          "[SESSION] Session lama tidak authorized."
        );
      } catch (error) {
        console.error(
          "[SESSION] Session lama gagal digunakan:",
          error.message
        );
      }

      try {
        await client.disconnect();
      } catch {}
    }

    console.log(
      "[SESSION] Login Telegram diperlukan."
    );

    if (!PHONE) {
      throw new Error(
        "Session Telegram tidak valid dan TELEGRAM_PHONE belum diisi."
      );
    }

    await client.start({
      phoneNumber:
        async () => PHONE,

      password:
        async () =>
          await input.text(
            "Telegram 2FA password: "
          ),

      phoneCode:
        async () =>
          await input.text(
            "Kode Telegram: "
          ),

      onError:
        (error) => {
          console.error(
            "[TELEGRAM LOGIN]",
            error
          );
        },
    });

    telegramReady = true;

    console.log(
      "[TELEGRAM] Login berhasil."
    );

    saveSession();

    console.log(
      "[TELEGRAM] Session permanen tersimpan."
    );
  } finally {
    telegramLoginRunning = false;
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    app.listen(
      PORT,
      () => {
        console.log("");

        console.log(
          "=========================================="
        );

        console.log(
          `PPK Telegram Collector : http://localhost:${PORT}`
        );

        console.log(
          `Community API          : http://localhost:${PORT}/api/community`
        );

        console.log(
          `Health API             : http://localhost:${PORT}/api/health`
        );

        console.log(
          `Team API               : http://localhost:${PORT}/api/team/:username`
        );

        console.log(
          `Team Avatar API        : http://localhost:${PORT}/api/telegram/avatar/:username`
        );

        console.log(
          `Member Avatar API      : http://localhost:${PORT}/api/avatar/:id`
        );

        console.log(
          `Team Refresh API       : http://localhost:${PORT}/api/team/refresh`
        );

        console.log(
          `Admin Login API        : http://localhost:${PORT}/api/admin/login`
        );

        console.log(
          `Admin Me API           : http://localhost:${PORT}/api/admin/me`
        );

        console.log(
          `Admin Logout API       : http://localhost:${PORT}/api/admin/logout`
        );

        console.log(
          `Events API             : http://localhost:${PORT}/api/events`
        );

        console.log(
          `Session File           : ${SESSION_FILE}`
        );

        console.log(
          "=========================================="
        );

        console.log("");
      }
    );

    await startTelegram();

    console.log(
      "[TELEGRAM] Telegram siap digunakan."
    );

    await updateCommunity();

    await refreshAllTeamProfiles();

    setInterval(
      () => {
        updateCommunity();
      },
      POLL_INTERVAL_MS
    );

    setInterval(
      () => {
        refreshAllTeamProfiles();
      },
      TEAM_REFRESH_INTERVAL_MS
    );

    console.log(
      `[TEAM] Auto refresh setiap ${
        TEAM_REFRESH_INTERVAL_MS /
        60000
      } menit.`
    );
  } catch (error) {
    console.error(
      "[MAIN] Collector gagal dijalankan:",
      error
    );

    process.exit(1);
  }
}

// ============================================================
// SHUTDOWN
// ============================================================

async function shutdown(
  signal
) {
  console.log(
    `\n[SHUTDOWN] ${signal} diterima.`
  );

  telegramReady = false;

  /*
   * Bersihkan cache entity dari memory.
   */
  memberEntityCache.clear();
  teamProfileCache.clear();

  try {
    if (
      client.connected
    ) {
      saveSession();
    }
  } catch {}

  try {
    await client.disconnect();
  } catch {}

  process.exit(0);
}

process.on(
  "SIGINT",
  () =>
    shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () =>
    shutdown("SIGTERM")
);

// ============================================================
// RUN
// ============================================================

main();