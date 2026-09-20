import fs from "fs";
import path from "path";
import crypto from "crypto";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMINS_FILE = path.join(__dirname, "admins.json");

function ensureFile() {
  if (!fs.existsSync(ADMINS_FILE)) {
    fs.writeFileSync(
      ADMINS_FILE,
      JSON.stringify({ admins: [] }, null, 2),
      "utf8"
    );
  }
}

function loadAdmins() {
  ensureFile();

  const raw = fs.readFileSync(ADMINS_FILE, "utf8").trim();

  if (!raw) {
    throw new Error(`admins.json kosong: ${ADMINS_FILE}`);
  }

  const data = JSON.parse(raw);

  if (!Array.isArray(data.admins)) {
    throw new Error(
      `Format admins.json tidak valid. Field "admins" harus berupa array.`
    );
  }

  return data.admins;
}

function saveAdmins(admins) {
  const tempFile = `${ADMINS_FILE}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify({ admins }, null, 2),
    "utf8"
  );

  fs.renameSync(tempFile, ADMINS_FILE);
}

function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex")
) {
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `scrypt:${salt}:${hash}`;
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("");
  console.log("================================");
  console.log("        PPK ADMIN CREATOR");
  console.log("================================");
  console.log("");
  console.log(`Admin file: ${ADMINS_FILE}`);
  console.log("");

  let admins;

  try {
    admins = loadAdmins();
  } catch (error) {
    console.error("");
    console.error("❌ admins.json tidak valid.");
    console.error(error.message);
    console.error("");
    process.exit(1);
  }

  const username = await ask("Username admin : ");
  const password = await ask("Password admin : ");

  if (!username) {
    console.log("❌ Username tidak boleh kosong.");
    process.exit(1);
  }

  if (!password) {
    console.log("❌ Password tidak boleh kosong.");
    process.exit(1);
  }

  if (password.length < 6) {
    console.log("❌ Password minimal 6 karakter.");
    process.exit(1);
  }

  const normalizedUsername = username
    .trim()
    .toLowerCase();

  const existing = admins.find(
    (admin) =>
      String(admin.username || "")
        .trim()
        .toLowerCase() === normalizedUsername
  );

  if (existing) {
    console.log("");
    console.log("❌ Username admin tersebut sudah terdaftar.");
    console.log("");
    process.exit(1);
  }

  const admin = {
    id: crypto.randomUUID(),
    username: username.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  admins.push(admin);

  saveAdmins(admins);

  console.log("");
  console.log("================================");
  console.log("       ADMIN BERHASIL DIBUAT");
  console.log("================================");
  console.log("");
  console.log(`Username : ${admin.username}`);
  console.log("Password : ********");
  console.log("");
  console.log(`Disimpan ke: ${ADMINS_FILE}`);
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("❌ Gagal membuat admin:");
  console.error(error);
  process.exit(1);
});