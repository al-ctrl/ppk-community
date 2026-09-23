import React, {
  useRef,
  useState,
} from "react";

import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import WebsiteOpening from "./WebsiteOpening.jsx";

import "./index.css";

const isAdminPage =
  window.location.pathname === "/admin" ||
  window.location.pathname.startsWith("/admin/");


function PublicApp() {
  const audioRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [showOpening, setShowOpening] = useState(true);

  const fadeInMusic = (audio, targetVolume = 0.25, duration = 2500) => {
  const startTime = performance.now();

  audio.volume = 0;

  const fade = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    audio.volume = targetVolume * progress;

    if (progress < 1) {
      requestAnimationFrame(fade);
    }
  };

  requestAnimationFrame(fade);
};


const startWebsite = async () => {
  const audio = audioRef.current;

  try {
    if (audio) {
      audio.loop = true;
      audio.preload = "auto";

      // Mulai dari 00:18
      audio.currentTime = 50;

      // Play dulu dengan volume 0
      audio.volume = 0;

      await audio.play();

      // Fade-in menuju volume 0.25
      fadeInMusic(audio, 0.10, 2500);

      console.log(
        "[MUSIC] Started from 00:18 with fade-in"
      );
    }
  } catch (error) {
    console.warn(
      "[MUSIC] Gagal memutar:",
      error
    );
  }

  setStarted(true);
};

  return (
    <>
      {/* ================================================== */}
      {/* GLOBAL MUSIC */}
      {/* SATU-SATUNYA AUDIO WEBSITE */}
      {/* ================================================== */}

      <audio
        ref={audioRef}
        id="global-background-music"
        src="/music/lagu1.mp3"
        preload="auto"
        loop
        playsInline
      />

      {/* ================================================== */}
      {/* WEBSITE UTAMA */}
      {/* ================================================== */}

      <App />

      {/* ================================================== */}
      {/* OPENING */}
      {/* ================================================== */}

      {showOpening && (
        <WebsiteOpening
          started={started}
          onStart={startWebsite}
          onComplete={() => {
            setShowOpening(false);
          }}
        />
      )}
    </>
  );
}


ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {isAdminPage ? (
      <AdminApp />
    ) : (
      <PublicApp />
    )}
  </React.StrictMode>
);