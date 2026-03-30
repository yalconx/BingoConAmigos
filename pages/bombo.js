import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import { getNarration } from "../lib/bingo";
import styles from "./bombo.module.css";

export default function Bombo() {
  const router = useRouter();
  const { room } = router.query;

  const [gameState, setGameState] = useState(null);
  const [currentBall, setCurrentBall] = useState(null);
  const [narration, setNarration] = useState("Pulsa «Sacar bola» para comenzar la partida");
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const rollRef = useRef(null);

  useEffect(() => {
    if (!room) return;
    const unsub = onValue(ref(db, `rooms/${room}`), (snap) => {
      if (snap.exists()) setGameState(snap.val());
    });
    return () => unsub();
  }, [room]);

  const drawBall = async () => {
    if (!gameState || rolling) return;
    const remaining = gameState.remaining || [];
    if (remaining.length === 0) return;

    setRolling(true);
    let ticks = 0;
    const maxTicks = 10;

    rollRef.current = setInterval(async () => {
      ticks++;
      setCurrentBall(remaining[Math.floor(Math.random() * remaining.length)]);
      if (ticks >= maxTicks) {
        clearInterval(rollRef.current);
        const idx = Math.floor(Math.random() * remaining.length);
        const picked = remaining[idx];
        const newRemaining = remaining.filter((_, i) => i !== idx);
        const newCalled = [...(gameState.called || []), picked];
        await update(ref(db, `rooms/${room}`), {
          called: newCalled,
          remaining: newRemaining,
          started: true,
          finished: newRemaining.length === 0,
          lastNumber: picked,
        });
        setCurrentBall(picked);
        setNarration(getNarration(picked));
        setRolling(false);
      }
    }, 90);
  };

  const announceLine = async () => {
    await update(ref(db, `rooms/${room}`), { lineAnnounced: true });
    setNarration("🎉 ¡LÍNEA! Un jugador ha completado una línea. ¿Seguimos para el BINGO?");
  };

  const announceBingo = async () => {
    await update(ref(db, `rooms/${room}`), { bingoAnnounced: true, finished: true });
    setNarration("🏆 ¡¡¡BINGO!!! ¡Tenemos ganador! ¡Enhorabuena!");
  };

  const resetGame = async () => {
    const fresh = {
      called: [],
      remaining: Array.from({ length: 90 }, (_, i) => i + 1),
      started: false, finished: false,
      lineAnnounced: false, bingoAnnounced: false,
      lastNumber: null, createdAt: Date.now(),
    };
    await set(ref(db, `rooms/${room}`), fresh);
    setCurrentBall(null);
    setNarration("¡Nueva partida! Pulsa «Sacar bola» para empezar");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!gameState) return <div className={styles.loading}>Conectando…</div>;

  const called = gameState.called || [];
  const remaining = gameState.remaining || [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/")}>← Salir</button>
        <div className={styles.roomBadge} onClick={copyCode} title="Copiar código">
          <span className={styles.roomLabel}>Código de sala</span>
          <span className={styles.roomCode}>{room}</span>
          <span className={styles.copyHint}>{copied ? "¡Copiado!" : "copiar"}</span>
        </div>
        <div className={styles.progress}>{called.length} / 90</div>
      </header>

      {/* Share banner */}
      {called.length === 0 && (
        <div className={styles.shareBanner}>
          📣 Comparte el código <strong>{room}</strong> con los jugadores para que entren
        </div>
      )}

      {/* Stage */}
      <section className={styles.stage}>
        <div className={`${styles.ball} ${rolling ? styles.ballRolling : ""} ${currentBall ? styles.ballActive : ""}`}>
          <span>{currentBall ?? "?"}</span>
        </div>
        <p className={styles.narration}>{narration}</p>
      </section>

      {/* Controls */}
      <section className={styles.controls}>
        <button
          className={styles.drawBtn}
          onClick={drawBall}
          disabled={rolling || remaining.length === 0}
        >
          {rolling ? "Sacando…" : remaining.length === 0 ? "¡Bolas agotadas!" : "🎱 Sacar bola"}
        </button>
        <div className={styles.secondaryBtns}>
          <button className={`${styles.secBtn} ${styles.lineBtn}`} onClick={announceLine} disabled={!!gameState.lineAnnounced}>
            🎉 Cantar Línea
          </button>
          <button className={`${styles.secBtn} ${styles.bingoBtn}`} onClick={announceBingo} disabled={!!gameState.bingoAnnounced}>
            🏆 Cantar Bingo
          </button>
          <button className={`${styles.secBtn} ${styles.resetBtn}`} onClick={resetGame}>
            🔄 Nueva partida
          </button>
        </div>
      </section>

      {/* Number board */}
      <section className={styles.boardSection}>
        <h3 className={styles.sectionTitle}>Tabla de números</h3>
        <div className={styles.board}>
          {Array.from({ length: 90 }, (_, i) => i + 1).map(n => (
            <div key={n} className={`${styles.boardNum}
              ${called.includes(n) ? styles.boardNumCalled : ""}
              ${n === currentBall && !rolling ? styles.boardNumCurrent : ""}
            `}>
              {n}
            </div>
          ))}
        </div>
      </section>

      {/* Call order */}
      <section className={styles.historySection}>
        <h3 className={styles.sectionTitle}>Orden de salida ({called.length})</h3>
        <div className={styles.pills}>
          {called.length === 0
            ? <span className={styles.empty}>Ningún número todavía</span>
            : [...called].reverse().map((n, i) => (
              <span key={i} className={styles.pill}>{n}</span>
            ))
          }
        </div>
      </section>
    </div>
  );
}
