# PPK Telegram Collector

Backend ini memakai Telegram MTProto melalui akun Telegram yang diotorisasi.

## Kenapa bukan hanya Bot API?

Bot API cocok untuk banyak fungsi grup, tetapi angka presence online member tidak dapat diambil secara lengkap/akurat hanya dengan Bot API. Collector ini memakai akun Telegram user melalui MTProto.

## 1. Buat API ID + API HASH

Buka `https://my.telegram.org`, login dengan akun Telegram collector, lalu buat aplikasi di API development tools.

Isi `.env`:

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=xxxxxxxx
TELEGRAM_PHONE=+628xxxxxxxxxx
TELEGRAM_GROUP=@usernamegrup
```

Jika grup tidak punya username, gunakan numeric ID seperti:

```env
TELEGRAM_GROUP=-1001234567890
```

## 2. Install

```bash
npm install
```

## 3. Login pertama kali

```bash
npm run collector:login
```

Telegram akan mengirim kode login. Jika akun memakai 2FA, masukkan password saat diminta.

Session disimpan di:

```text
server/session.txt
```

JANGAN commit file tersebut ke GitHub.

## 4. Jalankan collector

```bash
npm run collector
```

API tersedia di:

```text
http://SERVER_IP:3001/api/community
```

Health check:

```text
http://SERVER_IP:3001/api/health
```

## 5. Jalankan sebagai systemd

Contoh service:

```ini
[Unit]
Description=PPK Telegram Collector
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/ppk-community
ExecStart=/usr/bin/npm run collector
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Simpan sebagai:

```text
/etc/systemd/system/ppk-telegram.service
```

Kemudian:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ppk-telegram
sudo systemctl status ppk-telegram
```

## Presence online

`online` di sini hanya menghitung member dengan status Telegram `UserStatusOnline` yang terlihat oleh akun collector pada saat polling.

Jangan menganggap:
- `recently`
- `last week`
- `last month`

sebagai online.

Telegram juga dapat menyembunyikan presence karena privacy settings.

## Keamanan

- Jangan upload `.env`.
- Jangan upload `server/session.txt`.
- Gunakan akun collector khusus jika memungkinkan.
- Jangan berikan session string kepada orang lain.
- Batasi akses port 3001 dengan firewall/reverse proxy jika backend dipasang di VPS.
