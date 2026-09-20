import "dotenv/config";
import fs from "fs";
import path from "path";
import input from "input";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const phone = process.env.TELEGRAM_PHONE;
const sessionFile = path.resolve(process.env.SESSION_FILE || "./server/session.txt");

if (!apiId || !apiHash || !phone) {
  throw new Error("Isi TELEGRAM_API_ID, TELEGRAM_API_HASH, dan TELEGRAM_PHONE di .env");
}

const session = fs.existsSync(sessionFile)
  ? new StringSession(fs.readFileSync(sessionFile, "utf8").trim())
  : new StringSession("");

const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });

await client.start({
  phoneNumber: async () => phone,
  password: async () => input.text("Password 2FA Telegram (kosongkan jika tidak ada): "),
  phoneCode: async () => input.text("Kode Telegram: "),
  onError: (err) => console.error(err),
});

fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
fs.writeFileSync(sessionFile, client.session.save(), "utf8");
console.log("Login berhasil. Session disimpan di server/session.txt");
await client.disconnect();