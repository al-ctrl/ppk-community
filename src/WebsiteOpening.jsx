
import { useEffect, useState } from "react";
import "./Opening.css";

const scenes = [
  { type: "fishit", duration: 3500 },
  { type: "ppk", duration: 3000 },
  { type: "developers", duration: 4000 },
];

const DEVELOPER_USERNAME = "cottonbacconn";

const API_BASE = (
  import.meta.env.VITE_COMMUNITY_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

const PARTICLE_COUNT = 10;

function ParticleLayer() {
  return (
    <div className="opening-particles">
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
        <span
          key={index}
          className="opening-particle"
          style={{ "--particle-index": index }}
        />
      ))}
    </div>
  );
}

function OpeningBackground() {
  return (
    <div className="opening-background">
      <div className="opening-glow opening-glow-one" />
      <div className="opening-glow opening-glow-two" />
      <div className="opening-grid" />
      <ParticleLayer />
    </div>
  );
}

export default function WebsiteOpening({
  started,
  onStart,
  onComplete,
}) {
  const [scene, setScene] = useState(0);
  const [closing, setClosing] = useState(false);

  const [developer, setDeveloper] = useState({
    username: `@${DEVELOPER_USERNAME}`,
    name: "Developer",
    avatar: apiUrl(`/api/telegram/avatar/${DEVELOPER_USERNAME}`),
    hasPhoto: true,
  });

  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDeveloper() {
      try {
        const response = await fetch(
          apiUrl(`/api/team/${DEVELOPER_USERNAME}`),
          {
            method: "GET",
            cache: "default",
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (!data?.ok || controller.signal.aborted) return;

        const username = String(
          data.username || DEVELOPER_USERNAME
        )
          .trim()
          .replace(/^@+/, "");

        const name =
          [data.firstName, data.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          String(data.name || "").trim() ||
          DEVELOPER_USERNAME;

        let avatar = data.photo || "";

        if (!avatar && data.hasPhoto !== false) {
          avatar = apiUrl(
            `/api/telegram/avatar/${DEVELOPER_USERNAME}`
          );
        } else if (avatar.startsWith("/")) {
          avatar = apiUrl(avatar);
        }

        if (controller.signal.aborted) return;

        setDeveloper({
          username: `@${username}`,
          name,
          avatar,
          hasPhoto: data.hasPhoto !== false,
        });

        setAvatarFailed(false);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("[OPENING] Gagal memuat developer:", error);
        }
      }
    }

    loadDeveloper();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!started || closing) return;

    const currentScene = scenes[scene];

    if (!currentScene) return;

    const timer = window.setTimeout(() => {
      if (scene < scenes.length - 1) {
        setScene((current) => current + 1);
      } else {
        setClosing(true);
      }
    }, currentScene.duration);

    return () => window.clearTimeout(timer);
  }, [started, scene, closing]);

  useEffect(() => {
    if (!closing) return;

    const timer = window.setTimeout(() => {
      onComplete?.();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [closing, onComplete]);

  if (!started) {
    return (
      <div className="website-opening">
        <OpeningBackground />

        <div className="opening-start-screen">
          <div className="opening-start-logo-wrap">
            <div className="opening-logo-ring" />
            <div className="opening-logo-ring opening-logo-ring-two" />

            <img
              src="/logos/fish-it.png"
              alt="Fish It"
              className="opening-start-logo opening-transparent-logo"
              fetchPriority="high"
            />
          </div>

          <div className="opening-start-title">FISH IT</div>
          <div className="opening-start-subtitle">COMMUNITY</div>

          <button
            type="button"
            className="opening-start-button"
            onClick={onStart}
          >
            <span className="opening-start-icon">▶</span>
            <span>MULAI WEBSITE</span>
          </button>

          <div className="opening-start-hint">
            Klik untuk memulai
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`website-opening ${
        closing ? "opening-closing" : ""
      }`}
    >
      <OpeningBackground />

      <div className="opening-content">
        {scene === 0 && (
          <section
            key="fishit"
            className="opening-scene opening-fishit"
          >
            <div className="opening-logo-wrap">
              <div className="opening-logo-ring" />
              <div className="opening-logo-ring opening-logo-ring-two" />

              <img
                src="/logos/fish-it.png"
                alt="Fish It"
                className="opening-fishit-logo opening-transparent-logo"
              />
            </div>

            <div className="opening-title">FISH IT</div>
            <div className="opening-subtitle">COMMUNITY</div>

            <div className="opening-description">
              Welcome to the Fish It Community
            </div>
          </section>
        )}

        {scene === 1 && (
          <section
            key="ppk"
            className="opening-scene opening-ppk"
          >
            <div className="opening-small-label">PART OF</div>

            <div className="opening-ppk-logo-wrap">
              <div className="opening-ppk-ring" />

              <img
                src="/logos/ppk1.png"
                alt="PPK"
                className="opening-ppk-logo opening-transparent-logo"
              />
            </div>

            <div className="opening-title">PPK COMMUNITY</div>
            <div className="opening-line" />

            <div className="opening-description">
              A community built together
            </div>
          </section>
        )}

        {scene === 2 && (
          <section
            key="developers"
            className="opening-scene opening-developers"
          >
            <div className="opening-small-label">DEVELOPED BY</div>
            <div className="opening-dev-title">DEVELOPER</div>
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
                    onError={() => setAvatarFailed(true)}
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
                <span>TELEGRAM DEVELOPER</span>
                <strong>{developer.name}</strong>
                <small>{developer.username}</small>
              </div>
            </div>

            <div className="opening-description">
              Creating the PPK Comunity Website
            </div>
          </section>
        )}
      </div>

      <div className="opening-bottom">
        <span className="opening-loading-line">
          <span
            className="opening-loading-progress"
            style={{
              width: `${((scene + 1) / scenes.length) * 100}%`,
            }}
          />
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
