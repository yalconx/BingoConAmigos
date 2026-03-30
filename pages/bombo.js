import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import { getNarration } from "../lib/bingo";
import styles from "./bombo.module.css";
import Head from "next/head";

export default function Bombo() {
  const router = useRouter();
  const { room, name } = router.query;

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

  const getInviteUrl = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/player?room=${room}`;
  };

  const shareWhatsApp = () => {
    const url = getInviteUrl();
    const text = `🎱 ¡Te invito a jugar al Bingo!\nEntra con el código *${room}* o pulsa el enlace:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getInviteUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    const winner = gameState.playerLineWinner || "";
    await update(ref(db, `rooms/${room}`), { lineAnnounced: true });
    setNarration(`🎉 ¡LÍNEA cantada! ${winner ? `¡Enhorabuena ${winner}!` : ""} ¿Seguimos para el BINGO?`);
  };

  const announceBingo = async () => {
    const winner = gameState.playerBingoWinner || "";
    await update(ref(db, `rooms/${room}`), { bingoAnnounced: true, finished: true });
    setNarration(`🏆 ¡¡¡BINGO!!! ${winner ? `¡${winner} gana la partida!` : "¡Tenemos ganador!"} ¡Enhorabuena!`);
  };

  const resetGame = async () => {
    const fresh = {
      called: [],
      remaining: Array.from({ length: 90 }, (_, i) => i + 1),
      started: false, finished: false,
      lineAnnounced: false, bingoAnnounced: false,
      playerLine: false, playerBingo: false,
      playerLineWinner: null, playerBingoWinner: null,
      lastNumber: null, createdAt: Date.now(),
      players: gameState?.players || {},
    };
    await set(ref(db, `rooms/${room}`), fresh);
    setCurrentBall(null);
    setNarration("¡Nueva partida! Pulsa «Sacar bola» para empezar");
  };

  if (!gameState) return <div className={styles.loading}>Conectando…</div>;

  const called = gameState.called || [];
  const remaining = gameState.remaining || [];
  const playerHasLine = gameState.playerLine;
  const playerHasBingo = gameState.playerBingo;
  const lineWinner = gameState.playerLineWinner;
  const bingoWinner = gameState.playerBingoWinner;
  const players = gameState.players ? Object.values(gameState.players) : [];

  return (
    <>
      <Head><title>Partida {room} — Bingo Con Amigos</title></Head>
      <div className={styles.page}>

        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push("/")}>← Salir</button>
          <div className={styles.roomBadge} onClick={copyLink} title="Copiar enlace">
            <span className={styles.roomLabel}>Código de sala</span>
            <span className={styles.roomCode}>{room}</span>
            <span className={styles.copyHint}>{copied ? "¡Copiado!" : "copiar"}</span>
          </div>
          <div className={styles.progress}>{called.length} / 90</div>
        </header>

        {/* Player count + list */}
        <div className={styles.playersBar}>
          <span className={styles.playersCount}>👥 {players.length} jugador{players.length !== 1 ? "es" : ""} conectado{players.length !== 1 ? "s" : ""}</span>
          {players.length > 0 && (
            <div className={styles.playersList}>
              {players.map((p, i) => (
                <span key={i} className={styles.playerChip}>{p.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* Player alerts */}
        {playerHasBingo && (
          <div className={`${styles.playerAlert} ${styles.playerAlertBingo}`}>
            🏆 ¡{bingoWinner || "Un jugador"} tiene BINGO! Compruébalo y cántalo.
          </div>
        )}
        {playerHasLine && !playerHasBingo && (
          <div className={styles.playerAlert}>
            🎉 ¡{lineWinner || "Un jugador"} tiene LÍNEA! Compruébalo y cántalo.
          </div>
        )}

        {/* Share */}
        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Invita a los jugadores</p>
          <div className={styles.shareBtns}>
            <button className={styles.waBtn} onClick={shareWhatsApp}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Invitar por WhatsApp
            </button>
            <button className={styles.copyBtn} onClick={copyLink}>
              {copied ? "✓ Copiado" : "🔗 Copiar enlace"}
            </button>
          </div>
          <p className={styles.codeDisplay}>Código: <strong>{room}</strong></p>
        </div>

        {/* Stage */}
        <section className={styles.stage}>
          <div className={`${styles.ball} ${rolling ? styles.ballRolling : ""} ${currentBall ? styles.ballActive : ""}`}>
            <span>{currentBall ?? "?"}</span>
          </div>
          <p className={styles.narration}>{narration}</p>
        </section>

        {/* Controls */}
        <section className={styles.controls}>
          <button className={styles.drawBtn} onClick={drawBall} disabled={rolling || remaining.length === 0}>
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
              <div key={n} className={`${styles.boardNum} ${called.includes(n) ? styles.boardNumCalled : ""} ${n === currentBall && !rolling ? styles.boardNumCurrent : ""}`}>
                {n}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.historySection}>
          <h3 className={styles.sectionTitle}>Orden de salida ({called.length})</h3>
          <div className={styles.pills}>
            {called.length === 0
              ? <span className={styles.empty}>Ningún número todavía</span>
              : [...called].reverse().map((n, i) => <span key={i} className={styles.pill}>{n}</span>)
            }
          </div>
        </section>
      </div>
    </>
  );
}
