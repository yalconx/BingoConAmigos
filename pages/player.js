import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ref, onValue, update } from "firebase/database";
import { db } from "../lib/firebase";
import { generateCard, checkLine, checkBingo } from "../lib/bingo";
import styles from "./player.module.css";
import Head from "next/head";

function genPlayerId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Player() {
  const router = useRouter();
  const { room, name } = router.query;

  const playerIdRef = useRef(null);
  if (!playerIdRef.current && typeof window !== "undefined") {
    const key = `bingo_pid_${room}`;
    let saved = sessionStorage.getItem(key);
    if (!saved) { saved = genPlayerId(); sessionStorage.setItem(key, saved); }
    playerIdRef.current = saved;
  }
  const playerId = playerIdRef.current;

  // Generate unique card per session
  const cardRef = useRef(null);
  if (!cardRef.current && typeof window !== "undefined") {
    const key = `bingo_card_${room}`;
    let saved = sessionStorage.getItem(key);
    if (saved) {
      cardRef.current = JSON.parse(saved);
    } else {
      const seed = Date.now() ^ (Math.random() * 0xffffffff | 0);
      const card = generateCard(seed);
      sessionStorage.setItem(key, JSON.stringify(card));
      cardRef.current = card;
    }
  }
  const card = cardRef.current || [];

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
  const registeredRef = useRef(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const checkAndNotify = (nextMarked, calledArr) => {
    const lr = checkLine(card, nextMarked);
    if (lr !== -1 && lineRowRef.current === -1) {
      lineRowRef.current = lr;
      setLineRow(lr);
      showToast("🎉 ¡LÍNEA!");
      if (room) update(ref(db, `rooms/${room}`), { playerLine: true, playerLineWinner: name || "Un jugador" });
    }
    if (checkBingo(card, nextMarked) && !hasBingoRef.current) {
      hasBingoRef.current = true;
      setHasBingo(true);
      showToast(`🏆 ¡¡BINGO!! ¡${name || "¡Tú"} ganas!`);
      if (room) update(ref(db, `rooms/${room}`), { playerBingo: true, playerBingoWinner: name || "Un jugador" });
    }
  };

  // Register player in Firebase
  useEffect(() => {
    if (!room || !playerId || !name || registeredRef.current) return;
    registeredRef.current = true;
    update(ref(db, `rooms/${room}/players/${playerId}`), { name, joinedAt: Date.now() });
  }, [room, playerId, name]);

  useEffect(() => {
    if (!room) return;
    const unsub = onValue(ref(db, `rooms/${room}`), (snap) => {
      if (snap.exists()) {
        const state = snap.val();
        setGameState(state);

        const prev = new Set(prevCalledRef.current);
        const curr = state.called || [];
        const fresh = curr.filter(n => !prev.has(n));

        if (fresh.length > 0) {
          setNewNumbers(new Set(fresh));
          setTimeout(() => setNewNumbers(new Set()), 1200);

          if (autoMark) {
            setMarked(prevMarked => {
              const next = new Set(prevMarked);
              const allCardNums = card.flat().filter(n => n !== null);
              fresh.forEach(n => { if (allCardNums.includes(n)) next.add(n); });
              checkAndNotify(next, curr);
              return next;
            });
          }
        }
        prevCalledRef.current = curr;
      }
    });
    return () => unsub();
  }, [room, autoMark]);

  useEffect(() => {
    if (!autoMark || !gameState) return;
    const called = gameState.called || [];
    const allCardNums = card.flat().filter(n => n !== null);
    setMarked(prev => {
      const next = new Set(prev);
      called.forEach(n => { if (allCardNums.includes(n)) next.add(n); });
      checkAndNotify(next, called);
      return next;
    });
  }, [autoMark]);

  const toggleMark = (num) => {
    if (autoMark) return;
    const called = gameState?.called || [];
    if (!called.includes(num)) return;
    setMarked(prev => {
      const next = new Set(prev);
      if (next.has(num)) { next.delete(num); } else { next.add(num); }
      checkAndNotify(next, called);
      return next;
    });
  };

  const called = gameState?.called || [];
  const lastNum = called[called.length - 1];
  const players = gameState?.players ? Object.values(gameState.players) : [];
  const bingoWinner = gameState?.playerBingoWinner;

  if (!gameState && room) return <div className={styles.loading}>Conectando a sala {room}…</div>;

  return (
    <>
      <Head><title>Mi cartón — Bingo Con Amigos</title></Head>
      <div className={styles.page}>
        {toast && <div className={styles.toast}>{toast}</div>}

        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push("/")}>← Salir</button>
          <div className={styles.roomChip}>Sala <strong>{room}</strong> · <span className={styles.playerName}>{name}</span></div>
          <div className={styles.calledCount}>{called.length}/90</div>
        </header>

        {/* Players count */}
        <div className={styles.playersBar}>
          👥 <strong>{players.length}</strong> jugador{players.length !== 1 ? "es" : ""} en esta partida
        </div>

        {/* Last number */}
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

        {/* Announcements */}
        {gameState?.bingoAnnounced && (
          <div className={`${styles.announceBanner} ${styles.bingoBanner}`}>
            🏆 ¡¡BINGO!! {bingoWinner ? `¡${bingoWinner} ha ganado!` : "¡La partida ha terminado!"}
          </div>
        )}
        {gameState?.lineAnnounced && !gameState?.bingoAnnounced && (
          <div className={styles.announceBanner}>🎉 ¡Se ha cantado LÍNEA! ¿Seguimos?</div>
        )}

        {/* Auto/Manual toggle */}
        <div className={styles.modeToggleWrap}>
          <span className={styles.modeLabel}>Marcar números:</span>
          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${!autoMark ? styles.modeBtnActive : ""}`} onClick={() => setAutoMark(false)}>
              ✋ Manual
            </button>
            <button className={`${styles.modeBtn} ${autoMark ? styles.modeBtnActive : ""}`} onClick={() => setAutoMark(true)}>
              ⚡ Automático
            </button>
          </div>
          <p className={styles.modeHint}>
            {autoMark ? "Los números de tu cartón se marcan solos al salir" : "Toca los números para marcarlos tú"}
          </p>
        </div>

        {/* Card */}
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

        {hasBingo && <div className={`${styles.achievement} ${styles.achievementBingo}`}>🏆 ¡BINGO COMPLETO! ¡Enhorabuena {name}!</div>}
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
    </>
  );
}
