import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ref, onValue, update, serverTimestamp } from "firebase/database";
import { db } from "../lib/firebase";
import { generateCard, checkLine, checkBingo } from "../lib/bingo";
import styles from "./player.module.css";
import Head from "next/head";

function genPlayerId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Pantalla de nombre ──────────────────────────────────────────────
function NameScreen({ room, onJoin }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!name.trim()) { setError("Escribe tu nombre para continuar"); return; }
    setLoading(true);
    onJoin(name.trim());
  };

  return (
    <div className={styles.nameScreen}>
      <div className={styles.nameCard}>
        <div className={styles.nameEmoji}>🎴</div>
        <h1 className={styles.nameTitle}>¡A jugar!</h1>
        <p className={styles.nameDesc}>Sala <strong>{room}</strong> · Introduce tu nombre para recibir tu cartón</p>
        <input
          className={styles.nameInputBig}
          placeholder="Tu nombre"
          maxLength={20}
          value={name}
          autoFocus
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleJoin()}
        />
        {error && <p className={styles.nameError}>{error}</p>}
        <button className={styles.joinBtn} onClick={handleJoin} disabled={loading}>
          {loading ? "Entrando…" : "Entrar a la partida →"}
        </button>
      </div>
    </div>
  );
}

// ── Vista del cartón ────────────────────────────────────────────────
function CardView({ room, playerName, playerId, card }) {
  const router = useRouter();
  const [gameState, setGameState] = useState(null);
  const [marked, setMarked] = useState(new Set());
  const [autoMark, setAutoMark] = useState(false);
  const [lineRow, setLineRow] = useState(-1);
  const [hasBingo, setHasBingo] = useState(false);
  const [toast, setToast] = useState(null);
  const [newNumbers, setNewNumbers] = useState(new Set());
  const prevCalledRef = useRef([]);
  const lineRowRef = useRef(-1);
  const hasBingoRef = useRef(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const checkAndNotify = (nextMarked) => {
    const lr = checkLine(card, nextMarked);
    if (lr !== -1 && lineRowRef.current === -1) {
      lineRowRef.current = lr;
      setLineRow(lr);
      showToast("🎉 ¡LÍNEA!");
      update(ref(db, `rooms/${room}`), { playerLine: true, playerLineWinner: playerName });
    }
    if (checkBingo(card, nextMarked) && !hasBingoRef.current) {
      hasBingoRef.current = true;
      setHasBingo(true);
      showToast(`🏆 ¡¡BINGO!! ¡${playerName} gana!`);
      update(ref(db, `rooms/${room}`), { playerBingo: true, playerBingoWinner: playerName });
    }
  };

  // Register / refresh presence in Firebase
  useEffect(() => {
    if (!room || !playerId || !playerName) return;
    update(ref(db, `rooms/${room}/players/${playerId}`), {
      name: playerName,
      joinedAt: Date.now(),
      active: true,
    });
    // Mark inactive on unmount
    return () => {
      update(ref(db, `rooms/${room}/players/${playerId}`), { active: false });
    };
  }, [room, playerId, playerName]);

  useEffect(() => {
    if (!room) return;
    const unsub = onValue(ref(db, `rooms/${room}`), (snap) => {
      if (!snap.exists()) return;
      const state = snap.val();
      setGameState(state);

      const curr = state.called || [];
      const prev = new Set(prevCalledRef.current);
      const fresh = curr.filter(n => !prev.has(n));

      if (fresh.length > 0) {
        setNewNumbers(new Set(fresh));
        setTimeout(() => setNewNumbers(new Set()), 1200);

        if (autoMark) {
          setMarked(prevMarked => {
            const next = new Set(prevMarked);
            card.flat().filter(n => n !== null).forEach(n => {
              if (fresh.includes(n)) next.add(n);
            });
            checkAndNotify(next);
            return next;
          });
        }
      }
      prevCalledRef.current = curr;
    });
    return () => unsub();
  }, [room, autoMark]);

  // Auto-mark all existing called numbers when toggled on
  useEffect(() => {
    if (!autoMark || !gameState) return;
    const called = gameState.called || [];
    const allNums = card.flat().filter(n => n !== null);
    setMarked(prev => {
      const next = new Set(prev);
      called.forEach(n => { if (allNums.includes(n)) next.add(n); });
      checkAndNotify(next);
      return next;
    });
  }, [autoMark]);

  const toggleMark = (num) => {
    if (autoMark) return;
    const called = gameState?.called || [];
    if (!called.includes(num)) return;
    setMarked(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      checkAndNotify(next);
      return next;
    });
  };

  const called = gameState?.called || [];
  const lastNum = called[called.length - 1];
  const players = gameState?.players
    ? Object.values(gameState.players).filter(p => p.active !== false)
    : [];
  const bingoWinner = gameState?.playerBingoWinner;

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/")}>← Salir</button>
        <div className={styles.roomChip}>
          Sala <strong>{room}</strong> · <span className={styles.playerName}>{playerName}</span>
        </div>
        <div className={styles.calledCount}>{called.length}/90</div>
      </header>

      <div className={styles.playersBar}>
        👥 <strong>{players.length}</strong> jugador{players.length !== 1 ? "es" : ""} en esta partida
      </div>

      <div className={styles.lastRow}>
        {lastNum ? (
          <>
            <div className={styles.lastLabel}>Último número</div>
            <div className={styles.lastNum}>{lastNum}</div>
          </>
        ) : (
          <div className={styles.waiting}>⏳ Esperando que empiece la partida…</div>
        )}
      </div>

      {gameState?.bingoAnnounced && (
        <div className={`${styles.announceBanner} ${styles.bingoBanner}`}>
          🏆 ¡¡BINGO!! {bingoWinner ? `¡${bingoWinner} ha ganado!` : "¡La partida ha terminado!"}
        </div>
      )}
      {gameState?.lineAnnounced && !gameState?.bingoAnnounced && (
        <div className={styles.announceBanner}>🎉 ¡Se ha cantado LÍNEA! ¿Seguimos?</div>
      )}

      <div className={styles.modeToggleWrap}>
        <span className={styles.modeLabel}>Marcar números:</span>
        <div className={styles.modeToggle}>
          <button className={`${styles.modeBtn} ${!autoMark ? styles.modeBtnActive : ""}`} onClick={() => setAutoMark(false)}>✋ Manual</button>
          <button className={`${styles.modeBtn} ${autoMark ? styles.modeBtnActive : ""}`} onClick={() => setAutoMark(true)}>⚡ Automático</button>
        </div>
        <p className={styles.modeHint}>{autoMark ? "Los números de tu cartón se marcan solos al salir" : "Toca los números para marcarlos tú"}</p>
      </div>

      <div className={styles.cardWrap}>
        <div className={styles.card}>
          {card.map((row, r) => (
            <div key={r} className={`${styles.row} ${lineRow === r ? styles.lineRow : ""}`}>
              {row.map((num, c) => {
                if (num === null) return <div key={c} className={`${styles.cell} ${styles.empty}`} />;
                const isCalled = called.includes(num);
                const isMarked = marked.has(num);
                const isNew = newNumbers.has(num);
                return (
                  <div
                    key={c}
                    className={`${styles.cell} ${isCalled ? styles.cellCalled : ""} ${isMarked ? styles.cellMarked : ""} ${isNew ? styles.cellNew : ""} ${autoMark ? styles.cellAuto : ""}`}
                    onClick={() => toggleMark(num)}
                  >
                    <span className={styles.cellNum}>{num}</span>
                    {isMarked && <span className={styles.stamp}>✓</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hasBingo && <div className={`${styles.achievement} ${styles.achievementBingo}`}>🏆 ¡BINGO COMPLETO! ¡Enhorabuena {playerName}!</div>}
      {lineRow !== -1 && !hasBingo && <div className={styles.achievement}>🎉 ¡Tienes línea! Sigue para el Bingo</div>}

      <section className={styles.historySection}>
        <div className={styles.historyTitle}>Números cantados ({called.length})</div>
        <div className={styles.pills}>
          {called.length === 0
            ? <span className={styles.empty2}>Ningún número todavía</span>
            : [...called].reverse().map((n, i) => (
              <span key={i} className={`${styles.pill} ${marked.has(n) ? styles.pillMarked : ""}`}>{n}</span>
            ))
          }
        </div>
      </section>
    </div>
  );
}

// ── Componente raíz ─────────────────────────────────────────────────
export default function Player() {
  const router = useRouter();
  const { room } = router.query;

  const [playerName, setPlayerName] = useState(null);
  // New playerId every time this page loads (no sessionStorage caching)
  const playerIdRef = useRef(genPlayerId());
  const playerId = playerIdRef.current;

  // New card every time (unique per visit, no cache)
  const cardRef = useRef(null);
  if (!cardRef.current) {
    const seed = Date.now() ^ (Math.random() * 0xffffffff | 0);
    cardRef.current = generateCard(seed);
  }
  const card = cardRef.current;

  if (!room) return null;

  if (!playerName) {
    return (
      <>
        <Head><title>Unirse a partida — Bingo Con Amigos</title></Head>
        <NameScreen room={room} onJoin={setPlayerName} />
      </>
    );
  }

  return (
    <>
      <Head><title>Mi cartón — Bingo Con Amigos</title></Head>
      <CardView
        room={room}
        playerName={playerName}
        playerId={playerId}
        card={card}
      />
    </>
  );
}
