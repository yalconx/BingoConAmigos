import { useState } from "react";
import { useRouter } from "next/router";
import { ref, set, get } from "firebase/database";
import { db } from "../lib/firebase";
import { generateRoomCode } from "../lib/bingo";
import styles from "./index.module.css";

export default function Landing() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    setError("");
    const code = generateRoomCode();
    const remaining = Array.from({ length: 90 }, (_, i) => i + 1);
    await set(ref(db, `rooms/${code}`), {
      called: [],
      remaining,
      started: false,
      finished: false,
      createdAt: Date.now(),
    });
    router.push(`/bombo?room=${code}`);
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 2) { setError("Introduce el código de sala"); return; }
    setLoading(true);
    setError("");
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) {
      setError("Sala no encontrada. ¿Está bien el código?");
      setLoading(false);
      return;
    }
    router.push(`/player?room=${code}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgStars} />
      <div className={styles.bgGlow} />

      <header className={styles.hero}>
        <div className={styles.ballRow}>
          {["B","I","N","G","O"].map((l, i) => (
            <div key={l} className={styles.heroBall} style={{ animationDelay: `${i * 0.15}s` }}>
              {l}
            </div>
          ))}
        </div>
        <p className={styles.tagline}>El bingo online de toda la vida</p>
      </header>

      <main className={styles.cards}>
        {/* BOMBO */}
        <div className={styles.card}>
          <div className={styles.cardEmoji}>🎱</div>
          <h2 className={styles.cardTitle}>Crear nueva partida</h2>
          <p className={styles.cardDesc}>Crea una sala, comparte el código y empieza a cantar números</p>
          <button className={`${styles.btn} ${styles.btnGreen}`} onClick={createRoom} disabled={loading}>
            {loading ? "Creando sala…" : "Crear nueva partida"}
          </button>
        </div>

        {/* JUGADOR */}
        <div className={styles.card}>
          <div className={styles.cardEmoji}>🎴</div>
          <h2 className={styles.cardTitle}>Unirme a una partida</h2>
          <p className={styles.cardDesc}>Introduce el código que te ha dado el bombo para entrar</p>
          <input
            className={styles.codeInput}
            placeholder="XXXX"
            maxLength={4}
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e => e.key === "Enter" && joinRoom()}
          />
          <button className={`${styles.btn} ${styles.btnGold}`} onClick={joinRoom} disabled={loading}>
            {loading ? "Entrando…" : "Unirme a la partida"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </main>

      <footer className={styles.footer}>
        Cada jugador recibe un cartón único generado aleatoriamente
      </footer>
    </div>
  );
}
