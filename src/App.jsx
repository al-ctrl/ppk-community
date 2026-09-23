import { useEffect, useMemo, useState } from "react";

import {
  Anchor,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Gamepad2,
  Menu,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  X,
  Zap,
  CalendarDays,
  Clock3,
  Swords,
  CircleDot,
} from "lucide-react";

// =========================================================
// CONFIG
// =========================================================

const API_URL = (
  import.meta.env.VITE_COMMUNITY_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "");

// =========================================================
// FALLBACK DATA
// =========================================================

const fallback = {
  ok: false,
  group: {
    title: "PPK — Para Pemancing Kocak",
    username: null,
    inviteLink: null,
  },
  members: 0,
  online: 0,
  onlinePercent: 0,
  activeCrew: [],
  updatedAt: null,
};

// =========================================================
// STATIC COMMUNITY DATA
// =========================================================

const FOUNDERS = [
  {
    username: "@rexanxyz",
    role: "FOUNDER",
    description:
      "Pendiri PPK dan pengembang awal komunitas.",
  },
];

const ADMINS = [
  {
    username: "@cottonbacconn",
    role: "DEVELOPER",
    description:
      "Developer dan pengelola sistem PPK.",
  },
  {
    username: "@raxxyxyz",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@ohelweyy",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@cheiionlyy",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@haloeluna",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@chilokei",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@bask4raa",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@agardigi",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@oke_bre",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@poizy1",
    role: "ADMIN",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
]

const ELDER = [
  {
    username: "@ponakanburhan",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@Bossslanaa",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@ar4ppp",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@zeynfcku",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@Likkxyz",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@lgirapuh",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@hikelaa",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@ratuswag",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@kepindikss",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@pacalnaakeonho",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@ngavrej",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
  {
    username: "@astagabrn",
    role: "ELDER",
    description:
      "Mengelola komunitas dan aktivitas PPK.",
  },
];

// =========================================================
// FISHING GAMES
// =========================================================

const FISHING_GAMES = [
  {
    name: "Fish It Game Bot",
    shortName: "MAIN BOT",
    description:
      "Bot utama untuk memulai permainan bagi player baru.",
    username: "@fish_it_game_bot",
    url: "https://t.me/fish_it_game_bot",
    logo: "https://cdn5.telesco.pe/file/TNElfY4LozRQkM-rY1bQkZrmOoKrY_JSlYl18DXyqUK4geXJuQHrq9t45nKEQNFqwFGRetLtJP3gqZkJHWUFIl5-1eDSb-8PaLQWbLvYn0y0I-PbUaEm0LaU2kp9f3IQ7hpImwpKQ4znfuAGDjW7PGdXrGnFj6AiP0rE-fej5j_wOGxwVsU-WsyOSdX_S7MpzCvJspekyt6EpbfOR_ueYN2wIwvnv9IohZ820cAjlDlXRoqzDN6vU-spT6Tn1f9zbUnnMPHDv_ibB90YMX6iQ36gxeNN089ZK5fQ5GLBlvgmQiNgOmK7YUYxF21Edh9tR24O5VIjIGDebUdmmjDHIQ.jpg",
    status: "NEW PLAYER",
  },
  {
    name: "Fish It VIP 1",
    shortName: "VIP 1",
    description:
      "Bot khusus untuk pemain VIP 1 Default.",
    username: "@fish_it_vip_bot",
    url: "https://t.me/fish_it_vip_bot",
    logo: "https://cdn5.telesco.pe/file/pBZtV17mG6qkzxNoRec-Gh_fa9U1FxTxYWHTNlEhpgYoJbMcLaf1QKrZWPOCqau44uAxAi3lGFrFA8bZzvPvD2n21Trv-jH4Uwhi-7vJC1Hs-YnBlidnrD8i_Bzk00ucVo_jZIZTAwxpUlspu3Vp8ygq7djV0tg2O0BYMu-hxVVtEz9PXquPxLc5xpSGXiM8jq_VysboD-SikL5u-AqWvoRzibNLL2bIyb7oTTlIdbhEZWkB6nvZogvYLHcxGyobkBcUeEPlr50wmhRNlMtoXJgi_EG1AMoGdcA1koouvYpamHcMgV92e0zU6jiqEEq5yWoMBaweVlpVgMDA2Fs6DA.jpg",
    status: "VIP 1",
  },
  {
    name: "Fish It VIP 3",
    shortName: "VIP 3 RED",
    description:
      "Bot khusus untuk pemain VIP 3 Merah.",
    username: "@fish_it_vip3_bot",
    url: "https://t.me/fish_it_vip3_bot",
    logo: "https://cdn5.telesco.pe/file/V6PUVojyvPQZBlsrrQ48_6_GyI0HgkNXrwa1y2mRm7gmfHe23i9UYpcYlv9G9_Ua3HHevECB-OS3CX8GRzF2QZ_BB8CMtBFtPapGg0k3BA46dJIf70RVzPUQHc3e5bSaMBSg4PdD3Bjsss5XI2lNKny0uYjzxKLV4oDkYE1bU1P4FfOjQlmcgHRJ0QFrOH-gjOHy1Ang5QYJQ60Zs2SilpbRApfA9vHjMQWUw4GZLGL0Czx_NuV80pNSMPSVnFfltQBvNXNjBPn4OQ2nYTP_KO6wrl7e0pdz3b79rLymy6_yyGz1eOlpwVqpOYgWBvqa5SvQZO2bhsjt5coWPZZd-A.jpg",
    status: "VIP 3",
  },
  {
    name: "Fish It VIP 4",
    shortName: "VIP 4 BLACK",
    description:
      "Bot khusus untuk pemain VIP 4 Hitam.",
    username: "@fish_it_vip4_bot",
    url: "https://t.me/fish_it_vip4_bot",
    logo: "https://cdn5.telesco.pe/file/Pa0z0_cUZeJJ4jZso5uVDEWrTOlo58hPaes5tQslMw8OrIVRim7Aa0ImzNDRhzClizLoXJnK4t5BruN_1SqeLgm_fsBYnCY9iwVCGPVgQ1H_T9LxW0Mo502Hwm8sr5N3wYG7sdftc2zOq_8MfK3u8VIkNY7qg6m-7t-ftLhrHL_-yDopKChtLH9OPE8jYplS30ZTfL6xN7TaOI2u754k5jcIkD5qX1GtK-WTuaDQ-zWYQknvd9GsPAmUkdOTmCHiw-9UxynhBisZNrXC1sRwEHFyl793LPtfvs6rSAaX1F2sQYgOJ-TcahJlcj2AFUEe8PACEMRIpfYKHoYzWA8E8w.jpg",
    status: "VIP 4",
  },
  {
    name: "Fish It VIP 5",
    shortName: "VIP 5 WHITE",
    description:
      "Bot khusus untuk pemain VIP 5 Putih.",
    username: "@fish_it_vip5_bot",
    url: "https://t.me/fish_it_vip5_bot",
    logo: "https://cdn5.telesco.pe/file/S5s3MvLPKrbJNzUiI-T14gaGQ69VJKcKFqhrJSBtG-lb_6BjzRYape71ls0QxRFqu3LAaPEcRGDmLzEpso1OCn3BftLnNczmGFKX2lBdeA2sNyEYF--RD4-fjsevyn0qCdm08j49yluKBpiiJhqnvePTVFWOv-kkZHuNYYGGKLOqEI2XpS9DkpFKdTQkE4dotr7txyE-KjPBZHktdjTech_OuZ5pWpLa5WSlkmtw5rTz53tyoQSdnsqE9YfMR0QrEfOqZOeYMBZLcGgrlwtYKbfbz9dZvxXOCrUOQUl7FJTn57R3NkvrOXvayrz6inovsoBx1XRJB9jwbl2Hp68DwA.jpg",
    status: "VIP 5",
  },
  {
    name: "Fish It Market Channel",
    shortName: "MARKET",
    description:
      "Channel resmi trading dan tempat jual beli item Fish It.",
    username: "@fish_it_market",
    url: "https://t.me/fish_it_market",
    logo: "https://cdn5.telesco.pe/file/Zs3YZUuvl1ucalrU2fEVZKy5rL_Xsi7ihdRoggUErjPB3N0X3KkOcgwZCwbeIuRv-VknzXs_AWoAMOuIusbq5hq_IdMg3Xd3mt69paePpHsEzvR8xU_5nPbJJKn_0UbgQcBj42-yWwhsvRAzaF8LWeagUGN6WQESGlM6w9Xm_RqNIILMqU3me-O-4LHW_dUxLr8upWaKcjVkcp9KV-eaKgs4hv_y8Gwl44qllWSydSuuPeGDbAAzGJhongKNt-0cNXaAPFph_ODNt60-lgEHFjAiUW_GD2lzzJwD4U-BRyrSLksRkqSA5EStRALhDYpilnoUpDCF8NCAQ2al4H4dqQ.jpg",
    status: "CHANNEL",
  },
  {
    name: "Fish It Market Bot",
    shortName: "TRADING BOT",
    description:
      "Bot trading Fish It yang digunakan untuk transaksi penjualan.",
    username: "@fish_it_market_bot",
    url: "https://t.me/fish_it_market_bot",
    logo: "https://cdn5.telesco.pe/file/EPKiH-ZG92oUE4RmyjXxQVTu-xq2fVbEHMmpQod04QGvcVgGYNGJy0PJJt5KLEOfMCskKrm_SZDSIV0IaEJV2IUvGv23M8XDbxzDhUzjL8_xOUMvU6nFVxCj8eJupjtZzH83coFrNqXrft6r5ZTez3ZP3TXDrjCMBDvtUfnmOPR5JejyqLAyf60PtgvYbW1SH20kaYIkIoICp0wu9ZuB8QBgV2QmlgdGPCM_TaDC_5KWtBs2ciz3Wbu9d0LNevr2bk8k-x7V-26Ksry8gZsWEgHIG_I7x43RwrWXyQhkgABNo3umPiXMLOqqjLLay5u9tpYMeDB7Ak2ErUHH6LA2oA.jpg",
    status: "TRADING",
  },
];

// =========================================================
// HELPERS
// =========================================================

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function cleanUsername(username) {
  return String(username || "")
    .trim()
    .replace(/^@+/, "");
}

function getTelegramProfileUrl(username) {
  const clean = cleanUsername(username);

  if (!clean) {
    return null;
  }

  return `https://t.me/${encodeURIComponent(clean)}`;
}

function getAvatarUrl(photo) {
  if (!photo) return null;

  const value = String(photo);

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function getTelegramAvatarUrl(username) {
  const clean = cleanUsername(username);

  if (!clean) {
    return null;
  }

  return `${API_URL}/api/telegram/avatar/${encodeURIComponent(
    clean
  )}`;
}

function formatUpdatedAt(date) {
  if (!date) return "Belum tersedia";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Belum tersedia";
  }

  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventDate(date) {
  if (!date) return "Tanggal belum ditentukan";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =========================================================
// EVENT STATUS HELPERS
// =========================================================

function getEventStatus(event) {
  const status = String(
    event?.status ||
      event?.state ||
      "upcoming"
  )
    .trim()
    .toLowerCase();

  if (
    [
      "live",
      "ongoing",
      "active",
      "berlangsung",
    ].includes(status)
  ) {
    return "live";
  }

  if (
    [
      "finished",
      "done",
      "completed",
      "selesai",
      "cancelled",
    ].includes(status)
  ) {
    return "finished";
  }

  return "upcoming";
}

function getEventTitle(event) {
  return (
    event?.title ||
    event?.name ||
    event?.eventName ||
    "Event Komunitas"
  );
}

function getEventDescription(event) {
  return (
    event?.description ||
    event?.desc ||
    event?.details ||
    "Tidak ada deskripsi rinci."
  );
}

function getEventDate(event) {
  return (
    event?.date ||
    event?.eventDate ||
    event?.startDate ||
    event?.startAt ||
    event?.datetime ||
    null
  );
}

function getEventChallenges(event) {
  if (Array.isArray(event?.challenges)) {
    return event.challenges;
  }

  if (Array.isArray(event?.challenge)) {
    return event.challenge;
  }

  if (Array.isArray(event?.tasks)) {
    return event.tasks;
  }

  return [];
}

// =========================================================
// WINNER HELPERS
// =========================================================

function normalizeWinnerSlot(
  participant,
  index
) {
  const source =
    participant &&
    typeof participant === "object"
      ? participant
      : {};

  return {
    position: index + 1,

    username: cleanUsername(
      source.username ||
        source.name ||
        source.displayName ||
        ""
    ),

    userId: String(
      source.userId ||
        source.id ||
        source.telegramId ||
        ""
    ).trim(),

    prize: String(
      source.prize || ""
    ).trim(),

    claimUsername: cleanUsername(
      source.claimUsername ||
        source.claim ||
        source.claimedBy ||
        ""
    ),

    prizeSent:
      source.prizeSent === true ||
      source.prizeSent === 1 ||
      source.prizeSent === "1" ||
      String(
        source.prizeSent
      ).toLowerCase() === "true",
  };
}

function getWinnerSlots(challenge) {
  if (
    !challenge ||
    typeof challenge !== "object"
  ) {
    return [];
  }

  const rawParticipants =
    Array.isArray(
      challenge.participants
    )
      ? challenge.participants
      : Array.isArray(
          challenge.winners
        )
      ? challenge.winners
      : [];

  let winnerCount = Number(
    challenge.winnerCount ??
      challenge.winnerLimit ??
      rawParticipants.length ??
      0
  );

  if (!Number.isFinite(winnerCount)) {
    winnerCount = 0;
  }

  winnerCount = Math.max(
    0,
    Math.min(
      100,
      Math.floor(winnerCount)
    )
  );

  if (winnerCount === 0) {
    return [];
  }

  return Array.from(
    {
      length: winnerCount,
    },
    (_, index) =>
      normalizeWinnerSlot(
        rawParticipants[index],
        index
      )
  );
}

function isWinnerSlotFilled(
  participant
) {
  if (!participant) {
    return false;
  }

  return Boolean(
    String(
      participant.username || ""
    ).trim() ||
      String(
        participant.userId || ""
      ).trim()
  );
}

function getWinnerDisplayName(
  participant
) {
  if (
    !isWinnerSlotFilled(
      participant
    )
  ) {
    return null;
  }

  if (participant.username) {
    return `@${cleanUsername(
      participant.username
    )}`;
  }

  if (participant.userId) {
    return `User ${participant.userId}`;
  }

  return null;
}

function getWinnerProfileUrl(
  participant
) {
  if (!participant) {
    return null;
  }

  if (participant.username) {
    return getTelegramProfileUrl(
      participant.username
    );
  }

  return null;
}

function getClaimUrl(participant) {
  if (
    !participant?.claimUsername
  ) {
    return null;
  }

  return getTelegramProfileUrl(
    participant.claimUsername
  );
}

// =========================================================
// TELEGRAM PROFILE API
// =========================================================

const telegramProfileCache =
  new Map();

const telegramProfilePromises =
  new Map();

async function fetchTelegramProfile(
  username
) {
  const clean =
    cleanUsername(username);

  if (!clean) {
    return null;
  }

  if (
    telegramProfileCache.has(
      clean
    )
  ) {
    return telegramProfileCache.get(
      clean
    );
  }

  if (
    telegramProfilePromises.has(
      clean
    )
  ) {
    return telegramProfilePromises.get(
      clean
    );
  }

  const request = fetch(
    `${API_URL}/api/team/${encodeURIComponent(
      clean
    )}`,
    {
      cache: "no-store",
    }
  )
    .then(async (response) => {
      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.ok
      ) {
        throw new Error(
          result?.error ||
            "Telegram profile tidak valid."
        );
      }

      telegramProfileCache.set(
        clean,
        result
      );

      return result;
    })
    .finally(() => {
      telegramProfilePromises.delete(
        clean
      );
    });

  telegramProfilePromises.set(
    clean,
    request
  );

  return request;
}

function useTelegramProfile(
  username
) {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    let cancelled = false;

    const clean =
      cleanUsername(username);

    if (!clean) {
      setProfile(null);
      setLoading(false);
      setError(
        "Username Telegram kosong."
      );
      return;
    }

    const cached =
      telegramProfileCache.get(
        clean
      );

    if (cached) {
      setProfile(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchTelegramProfile(clean)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProfile(null);
          setError(
            err?.message ||
              "Gagal mengambil profil."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return {
    profile,
    loading,
    error,
  };
}

// =========================================================
// COMMUNITY API
// =========================================================

function useCommunityStats() {
  const [data, setData] =
    useState(fallback);

  const [loading, setLoading] =
    useState(true);

  async function load() {
    try {
      const response = await fetch(
        `${API_URL}/api/community`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Status ${response.status}`
        );
      }

      const result =
        await response.json();

      setData({
        ...fallback,
        ...result,
        group: {
          ...fallback.group,
          ...(result.group || {}),
        },
      });
    } catch {
      setData((current) => ({
        ...current,
        ok: false,
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval =
      setInterval(load, 60000);

    return () =>
      clearInterval(interval);
  }, []);

  return {
    data,
    loading,
    reload: load,
  };
}

function useEvents() {
  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  async function load() {
    try {
      const response = await fetch(
        `${API_URL}/api/events`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Status ${response.status}`
        );
      }

      const result =
        await response.json();

      const nextEvents =
        Array.isArray(result)
          ? result
          : Array.isArray(
              result?.events
            )
          ? result.events
          : [];

      setEvents(nextEvents);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval =
      setInterval(load, 10000);

    return () =>
      clearInterval(interval);
  }, []);

  return {
    events,
    loading,
    error,
    reload: load,
  };
}

// =========================================================
// LOGO
// =========================================================

function Logo() {
  return (
    <a
      href="#home"
      className="logo"
    >
      <span className="logo-symbol">
        <Anchor
          size={20}
          strokeWidth={2.2}
        />
      </span>

      <span className="logo-copy">
        <strong>PPK</strong>

        <small>
          PARA PEMANCING KOCAK
        </small>
      </span>
    </a>
  );
}

// =========================================================
// NAVBAR
// =========================================================

function Navbar({
  connected,
}) {
  const [open, setOpen] =
    useState(false);

  const links = [
    ["Tentang", "#about"],
    ["Games", "#games"],
    [
      "Event Komunitas",
      "#events",
    ],
    ["Community", "#community"],
    ["Team", "#team"],
    ["Aktivitas", "#activity"],
    ["FAQ", "#faq"],
  ];

  return (
    <header className="navbar">
      <div className="nav-shell">
        <Logo />

        <nav
          className={`nav-links ${
            open ? "open" : ""
          }`}
        >
          {links.map(
            ([label, href]) => (
              <a
                href={href}
                key={href}
                onClick={() =>
                  setOpen(false)
                }
              >
                {label}
              </a>
            )
          )}

          <a
            href="#community"
            className="nav-join"
            onClick={() =>
              setOpen(false)
            }
          >
            <span>
              Join Community
            </span>

            <ArrowRight size={15} />
          </a>
        </nav>

        <div className="nav-status">
          <span
            className={
              connected
                ? "status-dot online"
                : "status-dot"
            }
          />

          <span>
            {connected
              ? "LIVE"
              : "OFFLINE"}
          </span>
        </div>

        <button
          type="button"
          className="menu-button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() =>
            setOpen(
              (value) => !value
            )
          }
        >
          {open ? (
            <X />
          ) : (
            <Menu />
          )}
        </button>
      </div>
    </header>
  );
}

// =========================================================
// HERO
// =========================================================

function Hero({ data }) {
  const online = Number(
    data.online || 0
  );

  const members = Number(
    data.members || 0
  );

  return (
    <section
      id="home"
      className="hero"
    >
      <div className="hero-stars" />
      <div className="hero-grid" />

      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-content container">
        <div className="hero-badge">
          <span className="live-dot" />
          <span>PPK COMMUNITY</span>

          <span className="badge-separator">
            /
          </span>

          <span>EST. 2026</span>
        </div>

        <h1>
          Satu laut.
          <br />
          <span>Satu kru.</span>
          <br />
          Satu{" "}
          <em>kekocakan.</em>
        </h1>

        <p className="hero-description">
          PPK — Para Pemancing Kocak
          adalah organisasi pemain di
          dalam game mancing. Tempat
          kru berkumpul, mabar, berbagi
          cerita, dan tentu saja bikin
          suasana tetap kocak.
        </p>

        <div className="hero-actions">
          <a
            href="#community"
            className="button button-primary"
          >
            Lihat Community
            <ArrowRight size={17} />
          </a>

          <a
            href="#games"
            className="button button-secondary"
          >
            Lihat Games
          </a>

          <a
            href="#events"
            className="button button-secondary"
          >
            Lihat Event
          </a>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <strong>
              {formatNumber(
                members
              )}
            </strong>

            <span>MEMBERS</span>
          </div>

          <div className="metric-divider" />

          <div className="hero-metric">
            <strong className="green-number">
              {formatNumber(
                online
              )}
            </strong>

            <span>
              ONLINE NOW
            </span>
          </div>

          <div className="metric-divider" />

          <div className="hero-metric">
            <strong>
              {data.onlinePercent !==
                undefined &&
              data.onlinePercent !==
                null
                ? `${data.onlinePercent}%`
                : "—"}
            </strong>

            <span>
              ACTIVE RATE
            </span>
          </div>
        </div>
      </div>

      <div className="hero-ocean">
        <div className="moon">
          <div className="moon-crater crater-one" />
          <div className="moon-crater crater-two" />
          <div className="moon-crater crater-three" />
        </div>

        <div className="distant-horizon" />

        <div className="boat">
          <div className="boat-mast" />

          <div className="boat-flag">
            <span>PPK</span>
          </div>

          <div className="boat-cabin">
            <div />
            <div />
          </div>

          <div className="boat-hull" />
        </div>

        <div className="ocean ocean-back" />
        <div className="ocean ocean-mid" />
        <div className="ocean ocean-front" />
        <div className="reflection" />
      </div>

      <a
        href="#about"
        className="scroll-indicator"
      >
        <span>
          SCROLL TO EXPLORE
        </span>

        <ArrowDown size={15} />
      </a>
    </section>
  );
}

// =========================================================
// ABOUT
// =========================================================

function About() {
  return (
    <section
      id="about"
      className="section about-section"
    >
      <div className="container about-layout">
        <div className="about-copy">
          <div className="section-eyebrow">
            <span className="eyebrow-line" />
            ABOUT PPK
          </div>

          <h2>
            Lebih dari
            <br />
            sekadar{" "}
            <em>clan.</em>
          </h2>

          <p className="large-copy">
            PPK adalah organisasi
            pemain di dalam game mancing
            yang tumbuh dari satu hal
            sederhana: bermain bersama.
          </p>

          <p>
            Di sini, anggota bisa
            menemukan kru untuk bermain,
            berbagi hasil tangkapan,
            mengikuti kegiatan komunitas,
            atau sekadar masuk Telegram
            untuk ikut meramaikan
            obrolan.
          </p>

          <div className="about-points">
            <div>
              <ShieldCheck size={18} />

              <span>
                Komunitas pemain
              </span>
            </div>

            <div>
              <Gamepad2 size={18} />

              <span>
                Mabar & aktivitas game
              </span>
            </div>

            <div>
              <MessageCircle size={18} />

              <span>
                Komunikasi satu kru
              </span>
            </div>
          </div>
        </div>

        <div className="about-visual">
          <div className="about-card">
            <div className="about-card-top">
              <span>
                PPK / 001
              </span>

              <span className="card-live">
                <i />
                ACTIVE
              </span>
            </div>

            <div className="about-emblem">
              <div className="emblem-ring">
                <Waves size={55} />
              </div>
            </div>

            <div className="about-card-title">
              <span>PARA</span>

              <strong>
                PEMANCING
              </strong>

              <span>KOCAK</span>
            </div>

            <div className="about-card-bottom">
              <span>
                ONE CREW
              </span>

              <span>
                ONE OCEAN
              </span>

              <span>
                ∞ STORIES
              </span>
            </div>
          </div>

          <div className="about-floating-card">
            <Sparkles size={15} />

            <div>
              <strong>
                Seriously.
              </strong>

              <span>
                Not serious.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// GAMES
// =========================================================

function Games() {
  return (
    <section
      id="games"
      className="section games-section"
    >
      <div className="container">
        <div className="games-heading">
          <div>
            <div className="section-eyebrow">
              <span className="eyebrow-line" />
              OUR GAMES
            </div>

            <h2>
              Dunia tempat
              <br />
              kru{" "}
              <em>bermain.</em>
            </h2>
          </div>

          <p>
            PPK merupakan organisasi
            pemain yang berkegiatan di
            berbagai game mancing. Setiap
            game memiliki identitas dan
            perjalanan kru masing-masing.
          </p>
        </div>

        <div className="games-grid">
          {FISHING_GAMES.map(
            (game) => (
              <a
                className="game-card"
                key={
                  game.username ||
                  game.name
                }
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="game-card-top">
                  <span className="game-number">
                    {game.shortName}
                  </span>

                  <span className="game-status">
                    <i />
                    {game.status}
                  </span>
                </div>

                <div className="game-card-body">
                  <div className="game-logo">
                    <img
                      src={game.logo}
                      alt={`${game.name} logo`}
                      loading="lazy"
                      onError={(
                        event
                      ) => {
                        event.currentTarget.style.display =
                          "none";

                        const fallbackElement =
                          event.currentTarget
                            .nextElementSibling;

                        if (
                          fallbackElement
                        ) {
                          fallbackElement.style.display =
                            "flex";
                        }
                      }}
                    />

                    <div
                      className="game-logo-fallback"
                      style={{
                        display:
                          "none",
                      }}
                    >
                      <Gamepad2
                        size={36}
                      />
                    </div>
                  </div>

                  <div className="game-info">
                    <h3>
                      {game.name}
                    </h3>

                    <span className="game-username">
                      {game.username}
                    </span>

                    <p>
                      {
                        game.description
                      }
                    </p>
                  </div>
                </div>

                <div className="game-card-footer">
                  <span>
                    BUKA DI TELEGRAM
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </div>
              </a>
            )
          )}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// WINNER SLOT
// =========================================================

function WinnerSlot({
  participant,
  position,
}) {
  const filled = isWinnerSlotFilled(participant);

  const winnerUsername = cleanUsername(
    participant?.username || ""
  );

  const claimUsername = cleanUsername(
    participant?.claimUsername || ""
  );

  const winnerTelegramUrl = winnerUsername
    ? getTelegramProfileUrl(winnerUsername)
    : null;

  const claimTelegramUrl = claimUsername
    ? getTelegramProfileUrl(claimUsername)
    : null;

  const prizeSent = participant?.prizeSent === true;

  return (
    <div
      className={`event-winner-slot ${
        filled
          ? "winner-slot-filled"
          : "winner-slot-empty"
      }`}
    >
      {/* POSITION */}
      <div className="event-winner-position">
        <span>#{position}</span>
      </div>

      {/* CONTENT */}
      <div className="event-winner-info">

        {/* TOP */}
        <div className="event-winner-top">
          <div className="event-winner-identity">
            <strong>
              {filled
                ? `@${winnerUsername}`
                : "Belum dimenangkan"}
            </strong>

            {filled && (
              <span className="event-winner-status filled">
                PEMENANG
              </span>
            )}
          </div>

          {!filled && (
            <span className="event-winner-status empty">
              TERSEDIA
            </span>
          )}
        </div>

        {/* PRIZE */}
        <div
          className={`event-winner-prize ${
            participant?.prize
              ? ""
              : "event-winner-prize-empty"
          }`}
        >
          <Trophy size={13} />

          <span>
            {participant?.prize
              ? participant.prize
              : "Hadiah belum ditentukan"}
          </span>
        </div>

        {filled && (
          <>
            {/* ACTIONS */}
            <div className="event-winner-actions">
              {winnerTelegramUrl && (
                <a
                  href={winnerTelegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-winner-profile-button"
                >
                  <ExternalLink size={12} />
                  <span>Profil Pemenang</span>
                </a>
              )}

              {claimTelegramUrl && (
                <a
                  href={claimTelegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-winner-claim-button"
                >
                  <ExternalLink size={12} />
                  <span>
                    Claim @{claimUsername}
                  </span>
                </a>
              )}
            </div>

            {/* CLAIM */}
            {claimUsername && (
              <div className="event-winner-claim-row">
                <span>Claim oleh</span>

                {claimTelegramUrl ? (
                  <a
                    href={claimTelegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{claimUsername}
                  </a>
                ) : (
                  <strong>
                    @{claimUsername}
                  </strong>
                )}
              </div>
            )}

            {/* PRIZE STATUS */}
            <div
              className={`event-winner-prize-status ${
                prizeSent
                  ? "sent"
                  : "pending"
              }`}
            >
              <span className="event-winner-prize-status-dot" />

              <span>
                {prizeSent
                  ? "HADIAH SUDAH DIKIRIM"
                  : "HADIAH BELUM DIKIRIM"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =========================================================
// EVENT CHALLENGE
// =========================================================

function EventChallenge({
  challenge,
  index,
}) {
  const challengeName =
    typeof challenge === "string"
      ? challenge
      : challenge?.title ||
        challenge?.name ||
        challenge?.challenge ||
        `Challenge ${index + 1}`;

  if (
    typeof challenge ===
    "string"
  ) {
    return (
      <div className="event-challenge">
        <div className="event-challenge-main">
          <CircleDot size={13} />

          <strong>
            {challengeName}
          </strong>
        </div>
      </div>
    );
  }

  const winnerSlots =
    getWinnerSlots(
      challenge
    );

  const totalSlots =
    winnerSlots.length;

  const filledSlots =
    winnerSlots.filter(
      isWinnerSlotFilled
    ).length;

  const challengeImage =
    challenge?.image || "";

  const challengeItems =
    Array.isArray(
      challenge?.items
    )
      ? challenge.items
      : [];

  const isCustom =
    challenge?.type ===
    "custom";

  return (
    <div className="event-challenge event-challenge-expanded">

      {/* CHALLENGE HEADER */}
      <div className="event-challenge-header">
        <div className="event-challenge-main">
          <CircleDot size={13} />

          <strong>
            {challengeName}
          </strong>
        </div>

        {totalSlots > 0 && (
          <div className="event-winner-summary">
            <Users size={12} />

            <span>
              {filledSlots}/
              {totalSlots}
            </span>
          </div>
        )}
      </div>

      {/* DESCRIPTION */}
      {challenge.description && (
        <p className="event-challenge-description">
          {
            challenge.description
          }
        </p>
      )}

      {/* IMAGE */}
      {challengeImage && (
        <div className="event-challenge-image-container">
          <img
            src={challengeImage}
            alt={challengeName}
            loading="lazy"
          />
        </div>
      )}

      {/* CUSTOM ITEMS */}
      {isCustom &&
        challengeItems.length >
          0 && (
          <div className="event-custom-items">
            <strong>
              CUSTOM ITEMS:
            </strong>

            <div>
              {challengeItems.map(
                (
                  item,
                  itemIdx
                ) => (
                  <div
                    key={
                      item.id ||
                      itemIdx
                    }
                    className="event-custom-item"
                  >
                    {item.image && (
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.title ||
                          "Item"
                        }
                      />
                    )}

                    <div>
                      {item.title && (
                        <div>
                          {
                            item.title
                          }
                        </div>
                      )}

                      {item.description && (
                        <small>
                          {
                            item.description
                          }
                        </small>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* WINNERS */}
      {totalSlots > 0 ? (
        <div className="event-winner-slots">
          {winnerSlots.map(
            (
              participant,
              slotIndex
            ) => (
              <WinnerSlot
                key={`${challengeName}-slot-${slotIndex}`}
                participant={
                  participant
                }
                position={
                  slotIndex + 1
                }
              />
            )
          )}
        </div>
      ) : (
        <div className="event-no-winner-slots">
          <span>
            Challenge ini tidak
            memiliki slot
            pemenang.
          </span>
        </div>
      )}
    </div>
  );
}

// =========================================================
// EVENT CARD
// =========================================================

function EventCard({
  event,
}) {
  const status =
    getEventStatus(event);

  const title =
    getEventTitle(event);

  const description =
    getEventDescription(
      event
    );

  const date =
    getEventDate(event);

  const time =
    formatEventTime(date);

  const challenges =
    getEventChallenges(
      event
    );

  const rules = Array.isArray(
    event?.rules
  )
    ? event.rules
    : [];

  const banner =
    event?.banner || "";

  const statusLabel = {
    live: "LIVE NOW",
    upcoming: "UPCOMING",
    finished: "FINISHED",
  }[status];

  return (
    <article
      className={`event-card event-card-${status}`}
    >
      <div className="event-card-glow" />

      {/* BANNER */}
      {banner && (
        <div className="event-banner-container">
          <img
            src={banner}
            alt={title}
            loading="lazy"
          />
        </div>
      )}

      {/* TOP */}
      <div className="event-card-top">
        <span className="event-status">
          <i />
          {statusLabel}
        </span>

        {date && (
          <span className="event-date-small">
            {formatEventDate(
              date
            )}
          </span>
        )}
      </div>

      {/* ICON */}
      <div className="event-icon">
        {status === "live" ? (
          <Radio size={25} />
        ) : status ===
          "finished" ? (
          <CheckCircle2
            size={25}
          />
        ) : (
          <CalendarDays
            size={25}
          />
        )}
      </div>

      {/* CONTENT */}
      <div className="event-content">
        <h3>{title}</h3>

        <p>
          {description}
        </p>
      </div>

      {/* RULES */}
      {rules.length > 0 && (
        <div className="event-rules-section">
          <div className="event-rules-heading">
            <ShieldCheck
              size={15}
            />

            <span>
              PERATURAN EVENT
            </span>
          </div>

          <ul>
            {rules.map(
              (
                rule,
                idx
              ) => (
                <li key={idx}>
                  {rule}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* META */}
      <div className="event-meta">
        {date && (
          <div className="event-meta-item">
            <CalendarDays
              size={15}
            />

            <span>
              {formatEventDate(
                date
              )}
            </span>
          </div>
        )}

        {time && (
          <div className="event-meta-item">
            <Clock3 size={15} />

            <span>
              {time} WIB
            </span>
          </div>
        )}
      </div>

      {/* CHALLENGES */}
      {challenges.length >
        0 && (
        <div className="event-challenges">
          <div className="event-challenges-heading">
            <Swords size={15} />

            <span>
              CHALLENGES
            </span>
          </div>

          <div className="event-challenge-list">
            {challenges.map(
              (
                challenge,
                index
              ) => (
                <EventChallenge
                  challenge={
                    challenge
                  }
                  index={index}
                  key={
                    typeof challenge ===
                    "string"
                      ? `${challenge}-${index}`
                      : challenge?.id ||
                        challenge?._id ||
                        `${getEventTitle(
                          event
                        )}-${index}`
                  }
                />
              )
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="event-card-footer">
        <span>
          {status === "live"
            ? "EVENT SEDANG BERLANGSUNG"
            : status ===
              "finished"
            ? "EVENT TELAH SELESAI"
            : "SIAP UNTUK DIMULAI"}
        </span>

        <ArrowRight
          size={16}
        />
      </div>
    </article>
  );
}

// =========================================================
// EVENTS
// =========================================================

function Events() {
  const {
    events,
    loading,
    error,
  } = useEvents();

  const sortedEvents =
    useMemo(() => {
      const priority = {
        live: 0,
        upcoming: 1,
        finished: 2,
      };

      return [...events].sort(
        (a, b) => {
          const statusA =
            getEventStatus(a);

          const statusB =
            getEventStatus(b);

          if (
            priority[statusA] !==
            priority[statusB]
          ) {
            return (
              priority[statusA] -
              priority[statusB]
            );
          }

          const dateA =
            new Date(
              getEventDate(a) || 0
            ).getTime();

          const dateB =
            new Date(
              getEventDate(b) || 0
            ).getTime();

          return dateA - dateB;
        }
      );
    }, [events]);

  const liveCount =
    events.filter(
      (event) =>
        getEventStatus(
          event
        ) === "live"
    ).length;

  return (
    <section
      id="events"
      className="section events-section"
    >
      <div className="container">
        <div className="events-heading">
          <div>
            <div className="section-eyebrow">
              <span className="eyebrow-line" />
              COMMUNITY EVENT
            </div>

            <h2>
              Event
              <br />
              <em>
                komunitas.
              </em>
            </h2>
          </div>

          <div className="events-heading-right">
            <p>
              Informasi event
              kompetisi dan kegiatan
              seru dari komunitas PPK.
              Perubahan diperbarui
              otomatis secara
              real-time.
            </p>

            <div className="events-live-indicator">
              <span
                className={
                  liveCount > 0
                    ? "events-pulse active"
                    : "events-pulse"
                }
              />

              {liveCount > 0
                ? `${liveCount} EVENT LIVE`
                : "EVENT SYSTEM ONLINE"}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="events-state">
            <div className="events-loading-spinner" />

            <strong>
              Memuat informasi...
            </strong>

            <span>
              Mengambil data terbaru
              dari server PPK.
            </span>
          </div>
        ) : error ? (
          <div className="events-state events-state-error">
            <Radio size={25} />

            <strong>
              Data tidak dapat
              dimuat
            </strong>

            <span>
              Server event sedang
              tidak dapat dihubungi.
            </span>
          </div>
        ) : sortedEvents.length ===
          0 ? (
          <div className="events-state">
            <CalendarDays
              size={28}
            />

            <strong>
              Tidak ada event
            </strong>

            <span>
              Belum ada event komunitas
              yang tersedia saat ini.
            </span>
          </div>
        ) : (
          <div className="events-grid">
            {sortedEvents.map(
              (
                item,
                index
              ) => (
                <EventCard
                  key={
                    item.id ||
                    item._id ||
                    `${getEventTitle(
                      item
                    )}-${index}`
                  }
                  event={item}
                />
              )
            )}
          </div>
        )}

        <div className="events-sync-info">
          <span className="events-sync-dot" />

          <span>
            LIVE SYNC • diperbarui
            otomatis setiap 10 detik
          </span>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// COMMUNITY
// =========================================================

function Community({
  data,
  loading,
}) {
  const members = Number(
    data.members || 0
  );

  const online = Number(
    data.online || 0
  );

  const percent = Math.min(
    100,
    Math.max(
      0,
      Number(
        data.onlinePercent || 0
      )
    )
  );

  const connected =
    Boolean(data.ok);

  return (
    <section
      id="community"
      className="section community-section"
    >
      <div className="container">
        <div className="community-heading">
          <div>
            <div className="section-eyebrow">
              <span className="eyebrow-line" />
              LIVE COMMUNITY
            </div>

            <h2>
              Kru PPK,
              <br />
              <em>
                secara langsung.
              </em>
            </h2>
          </div>

          <div className="community-description">
            <p>
              Data komunitas diambil
              dari grup Telegram PPK
              melalui collector dan
              diperbarui secara
              berkala.
            </p>

            <div
              className={`connection-pill ${
                connected
                  ? "connected"
                  : ""
              }`}
            >
              <span />

              {loading
                ? "SYNCING"
                : connected
                ? "TELEGRAM CONNECTED"
                : "API OFFLINE"}
            </div>
          </div>
        </div>

        <div className="community-dashboard">
          <div className="dashboard-main">
            <div className="dashboard-top">
              <div className="dashboard-label">
                <Radio size={15} />
                COMMUNITY OVERVIEW
              </div>

              <Zap size={18} />
            </div>

            <div className="dashboard-number">
              {formatNumber(
                members
              )}
            </div>

            <div className="dashboard-title">
              TOTAL MEMBERS
            </div>

            <div className="dashboard-footer">
              <div>
                <span>
                  TELEGRAM
                </span>

                <strong>
                  {data.group
                    ?.username ||
                    "@PPK"}
                </strong>
              </div>

              <div>
                <span>
                  LAST SYNC
                </span>

                <strong>
                  {formatUpdatedAt(
                    data.updatedAt
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-online">
            <div className="dashboard-top">
              <div className="dashboard-label">
                <Users size={15} />
                PRESENCE
              </div>

              <span className="pulse-icon" />
            </div>

            <div className="online-number">
              {formatNumber(
                online
              )}
            </div>

            <div className="dashboard-title">
              MEMBERS ONLINE
            </div>

            <div className="presence-progress">
              <div
                style={{
                  width: `${percent}%`,
                }}
              />
            </div>

            <div className="presence-bottom">
              <span>
                ACTIVE RATE
              </span>

              <strong>
                {percent}%
              </strong>
            </div>
          </div>

          <div className="dashboard-community">
            <div className="dashboard-top">
              <div className="dashboard-label">
                <Anchor size={15} />
                COMMUNITY
              </div>

              <span className="community-badge">
                PPK
              </span>
            </div>

            <div className="community-brand">
              <h3>
                Kru PPK
              </h3>

              <p>
                Akses cepat ke komunitas
                Telegram resmi.
              </p>
            </div>

            <div className="dashboard-community-links">
              {data.group
                ?.inviteLink ? (
                <a
                  href={
                    data.group
                      .inviteLink
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="dashboard-link"
                >
                  <span>
                    Grup Telegram
                  </span>

                  <ExternalLink
                    size={13}
                  />
                </a>
              ) : (
                <span className="dashboard-muted">
                  Grup tidak tersedia
                </span>
              )}

              <a
                href={
                  data.channel
                    ?.inviteLink ||
                  "https://t.me/fish_it_market"
                }
                target="_blank"
                rel="noreferrer"
                className="dashboard-link dashboard-link-channel"
              >
                <span>
                  Channel Telegram PPK
                </span>

                <ExternalLink
                  size={13}
                />
              </a>
            </div>
          </div>
        </div>

        <div className="community-note">
          <CheckCircle2 size={16} />

          <span>
            Presence mengikuti status
            online yang dapat dilihat
            oleh akun Telegram collector.
            Pengaturan privasi Telegram
            dapat memengaruhi data yang
            tersedia.
          </span>
        </div>

        <Crew data={data} />
      </div>
    </section>
  );
}

// =========================================================
// CREW
// =========================================================

function Crew({ data }) {
  const crew = Array.isArray(
    data.activeCrew
  )
    ? data.activeCrew
    : [];

  return (
    <div className="crew-section">
      <div className="crew-heading">
        <div>
          <div className="section-eyebrow">
            <span className="eyebrow-line" />
            ACTIVE CREW
          </div>

          <h3>
            Yang sedang
            <br />
            <em>
              berlayar.
            </em>
          </h3>
        </div>

        <div className="crew-counter">
          <strong>
            {crew.length}
          </strong>

          <span>
            ONLINE
          </span>
        </div>
      </div>

      {crew.length > 0 ? (
        <div className="member-grid">
          {crew
            .slice(0, 50)
            .map(
              (member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                />
              )
            )}
        </div>
      ) : (
        <div className="empty-members">
          <Users size={25} />

          <strong>
            Tidak ada member online
          </strong>

          <span>
            Belum ada presence yang
            dapat ditampilkan.
          </span>
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
}) {
  const [imageError, setImageError] =
    useState(false);

  const avatarUrl =
    getAvatarUrl(
      member.photo
    );

  useEffect(() => {
    setImageError(false);
  }, [member.photo]);

  const initial = (
    member.name || "?"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <article className="member-card">
      <div className="member-avatar">
        {avatarUrl &&
        !imageError ? (
          <img
            src={avatarUrl}
            alt={
              member.name ||
              "Telegram User"
            }
            loading="lazy"
            onError={() =>
              setImageError(true)
            }
          />
        ) : (
          <span>
            {initial}
          </span>
        )}

        <i />
      </div>

      <div className="member-details">
        <strong>
          {member.name ||
            "Telegram User"}
        </strong>

        <span>
          {member.username
            ? member.username.startsWith(
                "@"
              )
              ? member.username
              : `@${member.username}`
            : "Telegram member"}
        </span>
      </div>

      <div className="member-status">
        <span />
        ONLINE
      </div>
    </article>
  );
}

// =========================================================
// TEAM MEMBER
// =========================================================

function TeamMember({
  member,
  featured = false,
}) {
  const {
    profile,
    loading,
    error,
  } = useTelegramProfile(
    member.username
  );

  const [imageError, setImageError] =
    useState(false);

  useEffect(() => {
    setImageError(false);
  }, [member.username]);

  const displayName =
    profile?.name ||
    (loading
      ? "Memuat profil..."
      : cleanUsername(
          member.username
        ));

  const displayUsername =
    profile?.username ||
    member.username;

  const avatarUrl = profile?.photo
    ? getAvatarUrl(
        profile.photo
      )
    : getTelegramAvatarUrl(
        member.username
      );

  const initial = (
    profile?.name ||
    cleanUsername(
      member.username
    ) ||
    "?"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <article
      className={`team-card ${
        featured
          ? "team-card-featured"
          : ""
      }`}
    >
      <div className="team-avatar">
        {avatarUrl &&
        !imageError ? (
          <img
            src={avatarUrl}
            alt={`${displayName} Telegram profile`}
            loading="lazy"
            onError={() =>
              setImageError(true)
            }
          />
        ) : (
          <span>
            {loading
              ? "..."
              : initial}
          </span>
        )}

        <span className="team-online-dot" />
      </div>

      <div className="team-info">
        <div className="team-info-top">
          <span className="team-role">
            {member.role}
          </span>

          {featured && (
            <span className="team-featured-label">
              MAIN
            </span>
          )}
        </div>

        <h3>
          {displayName}
        </h3>

        <strong>
          {displayUsername}
        </strong>

        <p>
          {member.description}
        </p>

        {error && (
          <small className="team-profile-error">
            Profil Telegram tidak
            dapat dimuat.
          </small>
        )}
      </div>
    </article>
  );
}

// =========================================================
// TEAM
// =========================================================

function Team() {
  return (
    <section
      id="team"
      className="section team-section"
    >
      <div className="container">
        <div className="team-heading">
          <div>
            <div className="section-eyebrow">
              <span className="eyebrow-line" />
              THE CREW BEHIND PPK
            </div>

            <h2>
              Founder &
              <br />
              <em>
                Administrators.
              </em>
            </h2>
          </div>

          <p>
            Orang-orang yang berada
            di balik pengelolaan PPK
            dan membantu menjaga
            komunitas tetap berjalan.
          </p>
        </div>

        <div className="team-block founder-block">
          <div className="team-block-heading">
            <Trophy size={18} />

            <span>
              FOUNDER
            </span>
          </div>

          <div className="founder-list">
            {FOUNDERS.map(
              (
                member,
                index
              ) => (
                <TeamMember
                  key={`${member.username}-${index}`}
                  member={member}
                  featured
                />
              )
            )}
          </div>
        </div>

        <div className="team-block admin-block">
          <div className="team-block-heading">
            <ShieldCheck
              size={18}
            />

            <span>
              ADMINISTRATION —{" "}
              {ADMINS.length} MEMBERS
            </span>
          </div>

          <div className="admin-grid">
            {ADMINS.map(
              (
                member,
                index
              ) => (
                <TeamMember
                  key={`${member.username}-${index}`}
                  member={member}
                />
              )
            )}
          </div>
        </div>

        <div className="team-block elder-block">
          <div className="team-block-heading">
            <Users size={18} />

            <span>
              ELDER / MEMBER CLAN —{" "}
              {ELDER.length} MEMBERS
            </span>
          </div>

          <div className="admin-grid elder-grid">
            {ELDER.map(
              (
                member,
                index
              ) => (
                <TeamMember
                  key={`${member.username}-${index}`}
                  member={member}
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// ACTIVITY
// =========================================================

function Activity() {
  const items = [
    {
      number: "01",
      title: "Weekly Fishing",
      description:
        "Kumpul, mabar, dan berburu tangkapan bersama kru PPK.",
      icon: Waves,
    },
    {
      number: "02",
      title: "Community Event",
      description:
        "Event internal dan kegiatan khusus untuk seluruh anggota.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "Crew Moments",
      description:
        "Momen, pencapaian, cerita, dan kekocakan dari komunitas.",
      icon: MessageCircle,
    },
  ];

  return (
    <section
      id="activity"
      className="section activity-section"
    >
      <div className="container">
        <div className="activity-heading">
          <div>
            <div className="section-eyebrow">
              <span className="eyebrow-line" />
              WHAT WE DO
            </div>

            <h2>
              Selalu ada
              <br />
              alasan untuk{" "}
              <em>
                kumpul.
              </em>
            </h2>
          </div>

          <p>
            Bukan cuma soal ikan.
            PPK adalah tentang kru,
            momen, dan cerita yang
            terjadi selama permainan.
          </p>
        </div>

        <div className="activity-list">
          {items.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <div
                  className="activity-card"
                  key={
                    item.number
                  }
                >
                  <div className="activity-number">
                    {item.number}
                  </div>

                  <div className="activity-icon">
                    <Icon size={21} />
                  </div>

                  <div className="activity-content">
                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {
                        item.description
                      }
                    </p>
                  </div>

                  <ArrowRight
                    className="activity-arrow"
                    size={19}
                  />
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// FAQ
// =========================================================

function FAQ() {
  const [active, setActive] =
    useState(0);

  const items = [
    [
      "Apakah PPK komunitas mancing real life?",
      "Tidak. PPK adalah organisasi atau clan pemain di dalam game mancing.",
    ],
    [
      "Dari mana statistik member berasal?",
      "Backend collector menggunakan Telegram MTProto untuk membaca data grup dengan akun Telegram yang telah diotorisasi.",
    ],
    [
      "Apakah angka online selalu 100% akurat?",
      "Tidak selalu. Telegram membatasi visibility presence berdasarkan privacy dan status yang tersedia untuk akun collector.",
    ],
    [
      "Website ini digunakan untuk apa?",
      "Website PPK digunakan sebagai profile dan pusat informasi komunitas.",
    ],
    [
      "Apakah website harus terus menjalankan collector?",
      "Collector harus tetap berjalan agar data dapat diperbarui. Website frontend dapat ditempatkan di Vercel.",
    ],
  ];

  return (
    <section
      id="faq"
      className="section faq-section"
    >
      <div className="container faq-layout">
        <div className="faq-intro">
          <div className="section-eyebrow">
            <span className="eyebrow-line" />
            FAQ
          </div>

          <h2>
            Pertanyaan
            <br />
            <em>
              kru baru.
            </em>
          </h2>

          <p>
            Beberapa hal yang perlu
            diketahui sebelum bergabung
            dengan PPK.
          </p>
        </div>

        <div className="faq-list">
          {items.map(
            (
              [
                question,
                answer,
              ],
              index
            ) => {
              const open =
                active === index;

              return (
                <button
                  type="button"
                  key={question}
                  className={`faq-item ${
                    open
                      ? "active"
                      : ""
                  }`}
                  aria-expanded={open}
                  onClick={() =>
                    setActive(
                      open
                        ? -1
                        : index
                    )
                  }
                >
                  <div className="faq-question">
                    <span className="faq-index">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <strong>
                      {question}
                    </strong>

                    <span className="faq-chevron">
                      <ChevronDown
                        size={17}
                      />
                    </span>
                  </div>

                  <div className="faq-answer">
                    <p>
                      {answer}
                    </p>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// FOOTER
// =========================================================

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <Waves />
      </div>

      <div className="container">
        <div className="footer-main">
          <div>
            <Logo />

            <p>
              Satu komunitas.
              <br />
              Banyak kekocakan.
            </p>
          </div>

          <div className="footer-navigation">
            <span>
              NAVIGATION
            </span>

            <a href="#about">
              Tentang
            </a>

            <a href="#games">
              Games
            </a>

            <a href="#events">
              Event
            </a>

            <a href="#community">
              Community
            </a>

            <a href="#team">
              Team
            </a>

            <a href="#activity">
              Aktivitas
            </a>

            <a href="#faq">
              FAQ
            </a>
          </div>

          <div className="footer-navigation">
            <span>
              COMMUNITY
            </span>

            <a href="#events">
              Events
            </a>

            <a href="#community">
              Live Status
            </a>

            <a href="#community">
              Active Crew
            </a>

            <a href="#team">
              Founder & Admin
            </a>

            <a href="#community">
              Telegram
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 PPK — Para
            Pemancing Kocak
          </span>

          <span>
            Built for the crew.
          </span>
        </div>
      </div>
    </footer>
  );
}

// =========================================================
// RESPONSIVE / VISUAL OVERRIDES
// =========================================================

function ResponsiveStyles() {
  return (
    <style>{`
      /* Touch / button behavior */
      button,
      a {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      button:focus-visible,
      a:focus-visible {
        outline: 2px solid rgba(80, 255, 187, 0.75);
        outline-offset: 3px;
      }

      /* Event presentation */
      .events-section {
        overflow: hidden;
      }

      .events-heading {
        align-items: end;
        gap: 32px;
      }

      .events-heading-right {
        max-width: 390px;
      }

      .events-grid {
        align-items: start;
        gap: 22px;
      }

      .event-card {
        position: relative;
        min-width: 0;
        overflow: hidden;
        border-radius: 24px;
        isolation: isolate;
      }

      .event-card-glow {
        pointer-events: none;
      }

      .event-banner-container {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 7;
        overflow: hidden;
        border-radius: 18px;
        margin-bottom: 20px;
        background: rgba(255, 255, 255, 0.035);
      }

      .event-banner-container::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 48%, rgba(3, 11, 13, 0.42));
        pointer-events: none;
      }

      .event-banner-container img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .event-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .event-status,
      .event-date-small {
        min-height: 30px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 7px 11px;
        white-space: nowrap;
      }

      .event-date-small {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .event-icon {
        width: 52px;
        height: 52px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        margin: 18px 0 14px;
      }

      .event-content h3 {
        margin: 0;
        line-height: 1.08;
        overflow-wrap: anywhere;
      }

      .event-content p,
      .event-challenge-description {
        overflow-wrap: anywhere;
      }

      .event-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 18px;
      }

      .event-meta-item {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 11px 12px;
        border-radius: 13px;
      }

      .event-meta-item span {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .event-rules-section,
      .event-challenges {
        margin-top: 18px;
      }

      .event-rules-section ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }

      .event-rules-section li {
        overflow-wrap: anywhere;
      }

      .event-challenge-list {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }

      .event-challenge {
        min-width: 0;
        border-radius: 16px;
      }

      .event-challenge-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .event-challenge-main {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .event-challenge-main strong {
        overflow-wrap: anywhere;
      }

      .event-challenge-image-container {
        width: 100%;
        margin-top: 12px;
        overflow: hidden;
        border-radius: 13px;
      }

      .event-challenge-image-container img {
        display: block;
        width: 100%;
        max-height: 340px;
        object-fit: cover;
      }

      .event-custom-items > div {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 10px;
      }

      .event-custom-item {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .event-custom-item img {
        flex: 0 0 42px;
        width: 42px;
        height: 42px;
        object-fit: cover;
        border-radius: 10px;
      }

      .event-custom-item > div {
        min-width: 0;
      }

      .event-custom-item small {
        overflow-wrap: anywhere;
      }

      .event-winner-slots {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .event-winner-slot {
        min-width: 0;
      }

      .event-winner-top,
      .event-winner-identity {
        min-width: 0;
      }

      .event-winner-identity strong,
      .event-winner-prize span,
      .event-winner-claim-row a,
      .event-winner-claim-row strong {
        overflow-wrap: anywhere;
      }

      .event-winner-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .event-winner-actions a {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
      }

      .event-card-footer {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 20px;
      }

      .event-card-footer span {
        overflow-wrap: anywhere;
      }

      .events-sync-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-align: center;
      }

      /* Elder / clan-member category */
      .elder-block {
        margin-top: 24px;
      }

      .elder-grid .team-card {
        min-width: 0;
      }

      /* General touch targets */
      .button,
      .nav-join,
      .dashboard-link,
      .game-card-footer,
      .event-card-footer,
      .menu-button,
      .faq-item,
      .event-winner-profile-button,
      .event-winner-claim-button {
        -webkit-user-select: none;
        user-select: none;
      }

      @media (max-width: 900px) {
        .container {
          width: min(100% - 32px, 760px);
        }

        .events-heading,
        .community-heading,
        .team-heading,
        .games-heading,
        .crew-heading {
          gap: 20px;
        }

        .events-grid {
          grid-template-columns: minmax(0, 1fr);
        }

        .event-card {
          width: 100%;
        }

        .admin-grid,
        .member-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        html {
          scroll-padding-top: 76px;
        }

        .container {
          width: min(100% - 24px, 560px);
        }

        .nav-shell {
          min-height: 64px;
          padding-inline: 12px;
        }

        .logo {
          min-width: 0;
        }

        .logo-copy small {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-status {
          display: none;
        }

        .menu-button {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
        }

        .nav-links {
          left: 12px;
          right: 12px;
          width: auto;
          max-height: calc(100vh - 82px);
          overflow-y: auto;
          padding: 10px;
          border-radius: 18px;
        }

        .nav-links a {
          min-height: 44px;
          display: flex;
          align-items: center;
          width: 100%;
          padding: 11px 12px;
          border-radius: 12px;
        }

        .nav-links .nav-join {
          justify-content: center;
          margin-top: 4px;
        }

        .hero-actions {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .hero-actions .button {
          width: 100%;
          min-height: 46px;
          justify-content: center;
        }

        .hero-metrics {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .metric-divider {
          display: none;
        }

        .hero-metric {
          min-width: 0;
        }

        .hero-metric strong {
          font-size: clamp(20px, 7vw, 30px);
        }

        .hero-metric span {
          font-size: 8px;
          letter-spacing: 0.1em;
        }

        .games-grid,
        .member-grid,
        .admin-grid {
          grid-template-columns: 1fr;
        }

        .event-card {
          border-radius: 18px;
        }

        .event-banner-container {
          aspect-ratio: 16 / 9;
          border-radius: 14px;
          margin-bottom: 15px;
        }

        .event-card-top {
          align-items: flex-start;
          flex-direction: column;
          gap: 8px;
        }

        .event-status,
        .event-date-small {
          white-space: normal;
          width: fit-content;
          max-width: 100%;
        }

        .event-icon {
          width: 46px;
          height: 46px;
          margin: 14px 0 12px;
        }

        .event-meta {
          grid-template-columns: 1fr;
        }

        .event-custom-items > div {
          grid-template-columns: 1fr;
        }

        .event-winner-actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .event-winner-actions a {
          width: 100%;
        }

        .event-winner-top {
          align-items: flex-start;
          flex-direction: column;
          gap: 7px;
        }

        .event-winner-prize {
          align-items: flex-start;
        }

        .event-card-footer {
          align-items: flex-start;
        }

        .event-card-footer svg {
          flex: 0 0 auto;
        }

        .team-block-heading {
          align-items: flex-start;
        }

        .team-block-heading span {
          overflow-wrap: anywhere;
        }

        .team-card {
          min-width: 0;
        }

        .team-info h3,
        .team-info strong,
        .team-info p {
          overflow-wrap: anywhere;
        }

        .faq-item {
          width: 100%;
          min-height: 54px;
        }

        .faq-question {
          grid-template-columns: 28px minmax(0, 1fr) 32px;
          gap: 8px;
        }

        .faq-question strong {
          overflow-wrap: anywhere;
        }

        .footer-navigation a {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
        }

        /* Make every interactive control comfortable for thumbs. */
        .button,
        .dashboard-link,
        .game-card-footer,
        .event-card-footer,
        .event-winner-profile-button,
        .event-winner-claim-button {
          min-height: 44px;
        }
      }

      @media (max-width: 420px) {
        .container {
          width: calc(100% - 20px);
        }

        .nav-shell {
          padding-inline: 10px;
        }

        .logo-symbol {
          width: 36px;
          height: 36px;
        }

        .logo-copy strong {
          font-size: 17px;
        }

        .logo-copy small {
          display: none;
        }

        .hero-metrics {
          grid-template-columns: 1fr;
          padding-top: 8px;
        }

        .hero-metric {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 0;
        }

        .hero-metric strong {
          font-size: 24px;
        }

        .event-content h3 {
          font-size: 24px;
        }
      }
    `}</style>
  );
}

// =========================================================
// APP
// =========================================================

export default function App() {
  const { data, loading } = useCommunityStats();
  const connected = Boolean(data.ok);

  const pageTitle = useMemo(
    () =>
      data.group?.title ||
      "PPK — Para Pemancing Kocak",
    [data.group?.title]
  );

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <>
      <ResponsiveStyles />
      <Navbar connected={connected} />

      <main>
        <Hero data={data} />
        <About />
        <Games />
        <Community
          data={data}
          loading={loading}
        />
        <Team />
        <Events />
        <Activity />
        <FAQ />
      </main>

      <Footer />
    </>
  );
}