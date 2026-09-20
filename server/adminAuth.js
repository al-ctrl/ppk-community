import "dotenv/config";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// ============================================================
// PATH
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMINS_FILE = path.resolve(
  __dirname,
  process.env.ADMINS_FILE || "./admins.json"
);

const SESSIONS_FILE = path.resolve(
  __dirname,
  process.env.ADMIN_SESSIONS_FILE ||
    "./admin-sessions.json"
);

// ============================================================
// CONFIG
// ============================================================

const SESSION_TTL =
  7 * 24 * 60 * 60 * 1000;

const COOKIE_NAME =
  "ppk_admin_session";

// ============================================================
// FILE HELPERS
// ============================================================

function ensureFile(file, defaultValue) {
  const dir = path.dirname(file);

  fs.mkdirSync(dir, {
    recursive: true,
  });

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(
        defaultValue,
        null,
        2
      ),
      "utf8"
    );
  }
}

// ============================================================
// JSON
// ============================================================

function loadJson(file, fallback) {
  try {
    ensureFile(
      file,
      fallback
    );

    const content =
      fs.readFileSync(
        file,
        "utf8"
      );

    if (!content.trim()) {
      return fallback;
    }

    return JSON.parse(
      content
    );
  } catch (error) {
    console.error(
      `[ADMIN AUTH] Gagal membaca ${file}:`,
      error.message
    );

    return fallback;
  }
}

function saveJson(
  file,
  data
) {
  const tempFile =
    `${file}.tmp`;

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
    file
  );
}

// ============================================================
// PASSWORD HASH
// ============================================================

export function hashPassword(
  password
) {
  const salt =
    crypto
      .randomBytes(16)
      .toString("hex");

  const hash =
    crypto.scryptSync(
      String(password),
      salt,
      64
    ).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

// ============================================================
// PASSWORD VERIFY
// ============================================================

export function verifyPassword(
  password,
  storedHash
) {
  try {
    const parts =
      String(
        storedHash || ""
      ).split(":");

    if (
      parts.length !== 3
    ) {
      return false;
    }

    const [
      algorithm,
      salt,
      hash,
    ] = parts;

    if (
      algorithm !== "scrypt"
    ) {
      return false;
    }

    const derived =
      crypto.scryptSync(
        String(password),
        salt,
        64
      );

    const stored =
      Buffer.from(
        hash,
        "hex"
      );

    if (
      derived.length !==
      stored.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      derived,
      stored
    );
  } catch {
    return false;
  }
}

// ============================================================
// ADMINS
// ============================================================

export function loadAdmins() {
  const data =
    loadJson(
      ADMINS_FILE,
      {
        admins: [],
      }
    );

  if (
    data &&
    Array.isArray(
      data.admins
    )
  ) {
    return data.admins;
  }

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  return [];
}

// ============================================================
// SANITIZE ADMIN
// ============================================================

export function sanitizeAdmin(
  admin
) {
  if (!admin) {
    return null;
  }

  return {
    id: admin.id,
    username: admin.username,
    createdAt: admin.createdAt,
  };
}

// ============================================================
// AUTHENTICATE ADMIN
// ============================================================

export async function authenticateAdmin(
  username,
  password
) {
  const admins =
    loadAdmins();

  const cleanUsername =
    String(
      username || ""
    )
      .trim()
      .toLowerCase();

  if (!cleanUsername) {
    return null;
  }

  const admin =
    admins.find(
      (item) =>
        String(
          item.username || ""
        )
          .trim()
          .toLowerCase() ===
        cleanUsername
    );

  if (!admin) {
    return null;
  }

  const valid =
    verifyPassword(
      password,
      admin.passwordHash
    );

  if (!valid) {
    return null;
  }

  return sanitizeAdmin(
    admin
  );
}

// ============================================================
// ADMIN SESSIONS
// ============================================================

function loadSessions() {
  const data =
    loadJson(
      SESSIONS_FILE,
      []
    );

  return Array.isArray(data)
    ? data
    : [];
}

function saveSessions(
  sessions
) {
  saveJson(
    SESSIONS_FILE,
    sessions
  );
}

// ============================================================
// CLEANUP EXPIRED SESSIONS
// ============================================================

export function cleanupAdminSessions() {
  const sessions =
    loadSessions();

  const now =
    Date.now();

  const valid =
    sessions.filter(
      (session) =>
        session &&
        Number(
          session.expiresAt
        ) > now
    );

  if (
    valid.length !==
    sessions.length
  ) {
    saveSessions(
      valid
    );
  }

  return valid;
}

// ============================================================
// CREATE SESSION
// ============================================================

export function createAdminSession(
  admin
) {
  if (!admin) {
    throw new Error(
      "Admin tidak valid."
    );
  }

  const sessions =
    cleanupAdminSessions();

  const sessionId =
    crypto
      .randomBytes(32)
      .toString("hex");

  const now =
    Date.now();

  const session = {
    id: sessionId,

    adminId:
      admin.id,

    username:
      admin.username,

    createdAt:
      now,

    expiresAt:
      now + SESSION_TTL,
  };

  sessions.push(
    session
  );

  saveSessions(
    sessions
  );

  return sessionId;
}

// ============================================================
// GET ADMIN FROM SESSION
// ============================================================

export function getAdminFromSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  const sessions =
    cleanupAdminSessions();

  const session =
    sessions.find(
      (item) =>
        item &&
        item.id ===
          sessionId
    );

  if (!session) {
    return null;
  }

  const admins =
    loadAdmins();

  const admin =
    admins.find(
      (item) =>
        item &&
        item.id ===
          session.adminId
    );

  if (!admin) {
    return null;
  }

  return sanitizeAdmin(
    admin
  );
}

// ============================================================
// DELETE SESSION
// ============================================================

export function deleteAdminSession(
  sessionId
) {
  if (!sessionId) {
    return;
  }

  const sessions =
    cleanupAdminSessions();

  const filtered =
    sessions.filter(
      (session) =>
        session &&
        session.id !==
          sessionId
    );

  saveSessions(
    filtered
  );
}

// ============================================================
// COOKIE PARSER
// ============================================================

function getCookie(
  req,
  name
) {
  const header =
    String(
      req.headers.cookie ||
        ""
    );

  if (!header) {
    return null;
  }

  const cookies =
    header.split(";");

  for (
    const cookie of cookies
  ) {
    const [
      key,
      ...values
    ] =
      cookie
        .trim()
        .split("=");

    if (
      key === name
    ) {
      try {
        return decodeURIComponent(
          values.join("=")
        );
      } catch {
        return null;
      }
    }
  }

  return null;
}

// ============================================================
// GET ADMIN FROM REQUEST
// ============================================================

export function getAdminFromRequest(
  req
) {
  const sessionId =
    getCookie(
      req,
      COOKIE_NAME
    );

  if (!sessionId) {
    return null;
  }

  return getAdminFromSession(
    sessionId
  );
}

// ============================================================
// REQUIRE ADMIN
// ============================================================

export function requireAdmin(
  req,
  res,
  next
) {
  const admin =
    getAdminFromRequest(
      req
    );

  if (!admin) {
    return res
      .status(401)
      .json({
        ok: false,
        authenticated: false,
        error:
          "Admin authentication diperlukan.",
      });
  }

  req.admin =
    admin;

  next();
}

// ============================================================
// SET ADMIN COOKIE
// ============================================================

export function setAdminCookie(
  res,
  sessionId
) {
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(
      sessionId
    )}`,

    "Path=/",

    "HttpOnly",

    "Secure",

    "SameSite=None",

    `Max-Age=${Math.floor(
      SESSION_TTL / 1000
    )}`,
  ];

  res.setHeader(
    "Set-Cookie",
    cookie.join("; ")
  );
}

// ============================================================
// CLEAR ADMIN COOKIE
// ============================================================

export function clearAdminCookie(
  res
) {
  const cookie = [
    `${COOKIE_NAME}=`,

    "Path=/",

    "HttpOnly",

    "Secure",

    "SameSite=None",

    "Max-Age=0",
  ];

  res.setHeader(
    "Set-Cookie",
    cookie.join("; ")
  );
}

// ============================================================
// INITIAL FILES
// ============================================================

ensureFile(
  ADMINS_FILE,
  {
    admins: [],
  }
);

ensureFile(
  SESSIONS_FILE,
  []
);

// ============================================================
// STARTUP LOG
// ============================================================

console.log(
  `[ADMIN AUTH] Admin file: ${ADMINS_FILE}`
);

console.log(
  `[ADMIN AUTH] Session file: ${SESSIONS_FILE}`
);