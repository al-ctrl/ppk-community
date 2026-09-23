
import { useEffect, useState } from "react";

import "./Opening.css";

const scenes = [
  {
    type: "fishit",
    duration: 3500,
  },
  {
    type: "ppk",
    duration: 3000,
  },
  {
    type: "developers",
    duration: 4000,
  },
];

const DEVELOPER_USERNAME = "cottonbacconn";

const API_BASE = (
  import.meta.env.VITE_COMMUNITY_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export default function WebsiteOpening({
  started,
  onStart,
  onComplete,
}) {
  const [scene, setScene] = useState(0);
  const [closing, setClosing] = useState(false);

  const [developer, setDeveloper] = useState({
    username: "@cottonbacconn",
    name: "Developer",
    avatar: apiUrl(
      `/api/telegram/avatar/${DEVELOPER_USERNAME}`
    ),
    hasPhoto: true,
  });

  const [avatarFailed, setAvatarFailed] = useState(false);

  /*
   * ============================================================
   * LOAD DEVELOPER
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadDeveloper() {
      try {
        const response = await fetch(
          apiUrl(
            `/api/team/${DEVELOPER_USERNAME}?t=${Date.now()}`
          ),
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          console.warn(
            "[OPENING] Gagal mengambil developer:",
            response.status
          );
          return;
        }

        const data = await response.json();

        if (cancelled || !data?.ok) {
          return;
        }

        const username = String(
          data.username ||
            `@${DEVELOPER_USERNAME}`
        )
          .trim()
          .replace(/^@+/, "");

        const firstName = String(
          data.firstName || ""
        ).trim();

        const lastName = String(
          data.lastName || ""
        ).trim();

        const name =
          [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          String(data.name || "").trim() ||
          DEVELOPER_USERNAME;

        let avatar = data.photo || "";

        /*
         * Jika backend tidak memberikan URL foto,
         * gunakan endpoint avatar Telegram.
         */

        if (!avatar && data.hasPhoto !== false) {
          avatar = apiUrl(
            `/api/telegram/avatar/${DEVELOPER_USERNAME}?t=${Date.now()}`
          );
        }

        /*
         * Kalau backend memberikan path relatif
         * seperti /api/telegram/avatar/xxx,
         * ubah menjadi URL API lengkap.
         */

        if (
          avatar &&
          avatar.startsWith("/")
        ) {
          avatar = apiUrl(
            `${avatar}${
              avatar.includes("?") ? "&" : "?"
            }t=${Date.now()}`
          );
        }

        console.log(
          "[OPENING] Developer:",
          {
            name,
            username: `@${username}`,
            avatar,
            hasPhoto: data.hasPhoto,
          }
        );

        if (cancelled) {
          return;
        }

        setDeveloper({
          username: `@${username}`,
          name,
          avatar,
          hasPhoto: data.hasPhoto === true,
        });

        setAvatarFailed(false);
      } catch (error) {
        console.warn(
          "[OPENING] Error developer:",
          error
        );
      }
    }

    loadDeveloper();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================================
   * OPENING SCENE
   * ============================================================
   */

  useEffect(() => {
    if (!started || closing) {
      return;
    }

    const currentScene = scenes[scene];

    if (!currentScene) {
      finishOpening();
      return;
    }

    const timer = setTimeout(() => {
      if (scene < scenes.length - 1) {
        setScene((current) => current + 1);
      } else {
        finishOpening();
      }
    }, currentScene.duration);

    return () => {
      clearTimeout(timer);
    };
  }, [started, scene, closing]);

  /*
   * ============================================================
   * FINISH
   * ============================================================
   */

  function finishOpening() {
    if (closing) {
      return;
    }

    setClosing(true);

    setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, 1000);
  }

  /*
   * ============================================================
   * START SCREEN
   * ============================================================
   */

  if (!started) {
    return (
      <div className="website-opening">
        <div className="opening-background">
          <div className="opening-glow opening-glow-one" />
          <div className="opening-glow opening-glow-two" />
          <div className="opening-grid" />

          <div className="opening-particles">
            {Array.from({ length: 24 }).map(
              (_, index) => (
                <span
                  key={index}
                  className="opening-particle"
                  style={{
                    "--particle-index": index,
                  }}
                />
              )
            )}
          </div>
        </div>

        <div className="opening-start-screen">
          <div className="opening-start-logo-wrap">
            <div className="opening-logo-ring" />

            <div className="opening-logo-ring opening-logo-ring-two" />

            <img
              src="/logos/fish-it.png"
              alt="Fish It"
              className="opening-start-logo opening-transparent-logo"
            />
          </div>

          <div className="opening-start-title">
            FISH IT
          </div>

          <div className="opening-start-subtitle">
            COMMUNITY
          </div>

          <button
            type="button"
            className="opening-start-button"
            onClick={onStart}
          >
            <span className="opening-start-icon">
              ▶
            </span>

            <span>
              MULAI WEBSITE
            </span>
          </button>

          <div className="opening-start-hint">
            Klik untuk memulai
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * OPENING RENDER
   * ============================================================
   */

  return (
    <div
      className={`website-opening ${
        closing
          ? "opening-closing"
          : ""
      }`}
    >
      <div className="opening-background">
        <div className="opening-glow opening-glow-one" />

        <div className="opening-glow opening-glow-two" />

        <div className="opening-grid" />

        <div className="opening-particles">
          {Array.from({ length: 24 }).map(
            (_, index) => (
              <span
                key={index}
                className="opening-particle"
                style={{
                  "--particle-index": index,
                }}
              />
            )
          )}
        </div>
      </div>

      <div className="opening-content">

        {/* ==================================================
            FISH IT
        ================================================== */}

        {scene === 0 && (
          <section className="opening-scene opening-fishit">

            <div className="opening-logo-wrap">

              <div className="opening-logo-ring" />

              <div className="opening-logo-ring opening-logo-ring-two" />

              <img
                src="/logos/fish-it.png"
                alt="Fish It"
                className="opening-fishit-logo opening-transparent-logo"
              />

            </div>

            <div className="opening-title">
              FISH IT
            </div>

            <div className="opening-subtitle">
              COMMUNITY
            </div>

            <div className="opening-description">
              Welcome to the Fish It Community
            </div>

          </section>
        )}

        {/* ==================================================
            PPK
        ================================================== */}

        {scene === 1 && (
          <section className="opening-scene opening-ppk">

            <div className="opening-small-label">
              PART OF
            </div>

            <div className="opening-ppk-logo-wrap">

              <div className="opening-ppk-ring" />

              <img
                src="/logos/ppk.png"
                alt="PPK"
                className="opening-ppk-logo opening-transparent-logo"
              />

            </div>

            <div className="opening-title">
              PPK COMMUNITY
            </div>

            <div className="opening-line" />

            <div className="opening-description">
              A community built together
            </div>

          </section>
        )}

        {/* ==================================================
            DEVELOPER
        ================================================== */}

        {scene === 2 && (
          <section className="opening-scene opening-developers">

            <div className="opening-small-label">
              DEVELOPED BY
            </div>

            <div className="opening-dev-title">
              DEVELOPER
            </div>

            <div className="opening-dev-line" />

            <div className="opening-dev-card">

              <div className="opening-dev-avatar-wrap">

                <div className="opening-dev-avatar-ring" />

                {developer.hasPhoto &&
                developer.avatar &&
                !avatarFailed ? (
                  <img
                    src={developer.avatar}
                    alt={developer.name}
                    className="opening-dev-avatar-image"
                    loading="eager"
                    decoding="async"
                    onLoad={() => {
                      console.log(
                        "[OPENING] Foto developer berhasil dimuat:",
                        developer.avatar
                      );
                    }}
                    onError={(event) => {
                      console.warn(
                        "[OPENING] Foto developer gagal dimuat:",
                        developer.avatar
                      );

                      event.currentTarget.style.display =
                        "none";

                      setAvatarFailed(true);
                    }}
                  />
                ) : (
                  <div className="opening-dev-avatar-fallback">
                    {(developer.name || "D")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

              </div>

              <div className="opening-dev-info">

                <span>
                  TELEGRAM DEVELOPER
                </span>

                <strong>
                  {developer.name}
                </strong>

                <small>
                  {developer.username}
                </small>

              </div>

            </div>

            <div className="opening-description">
              Creating the PPK Comunity Website
            </div>

          </section>
        )}

      </div>

      {/* ==================================================
          BOTTOM
      ================================================== */}

      <div className="opening-bottom">

        <span className="opening-loading-line">
          <span className="opening-loading-progress" />
        </span>

        <span className="opening-loading-text">
          {scene === 0 && "INITIALIZING"}

          {scene === 1 && "CONNECTING"}

          {scene === 2 && "WELCOME"}
        </span>

      </div>

    </div>
  );
}
