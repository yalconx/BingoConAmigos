import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { generateCard, checkLine, checkBingo } from "../lib/bingo";
import styles from "./player.module.css";

export default function Player() {
  const router = useRouter();
  const { room } = router.query;

  // Generate unique card per session (stored in sessionStorage so it survives re-renders)
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
  const [lineRow, setLineRow] = useState(-1);
  const [hasBingo, setHasBingo] = useState(false);
  const [toast, setToast] = useState(null);
  const [newNumbers, setNewNumbers] = useState(new Set());
  const prevCalledRef = useRef([]);

  useEffect(() => {
    if (!room) return;
    const unsub = onValue(ref(db, `rooms/${room}`), (snap) => {
      if (snap.exists()) {
        const state = snap.val();
        setGameState(state);
        // Detect newly called numbers for highlight animation
        const prev = new Set(prevCalledRef.current);
        const curr = state.called || [];
        const fresh = curr.filter(n => !prev.has(n));
        if (fresh.length > 0) {
          setNewNumbers(new Set(fresh));
          setTimeout(() => setNewNumbers(new Set()), 1200);
        }
        prevCalledRef.current = curr;
      }
    });
    return () => unsub();
  }, [room]);

  const toggleMark = (num) => {
    const called = gameState?.called || [];
    if (!called.includes(num)) return;
    setMarked(prev => {
      const next = new Set(prev);
      if (next.has(num)) { next.delete(num); } else { next.add(num); }
      // Check line
      const lr = checkLine(card, next);
      if (lr !== -1 && lineRow === -1) { setLineRow(lr); showToast("🎉 ¡LÍNEA!"); }
      // Check bingo
      if (checkBingo(card, next) && !hasBingo) { setHasBingo(true); showToast("🏆 ¡¡BINGO!!"); }
      return next;
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const called = gameState?.called || [];
  const lastNum = called[called.length - 1];

  if (!gameState && room) return <div className={styles.loading}>Conectando a sala {room}…</div>;

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/")}>← Salir</button>
        <div className={styles.roomChip}>Sala <strong>{room}</strong></div>
        <div className={styles.calledCount}>{called.length}/90</div>
      </header>

      {/* Last number */}
      <div className={styles.lastRow}>
        {lastNum ? (
          <>
            <div className={styles.lastLabel}>Último número</div>
            <div className={styles.lastNum}>{lastNum}</div>
          </>
        ) : (
          <div className={styles.waiting}>⏳ Esperando que el bombo empiece…</div>
        )}
      </div>

      {/* Announcements */}
      {gameState?.lineAnnounced && !gameState?.bingoAnnounced && (
        <div className={styles.announceBanner}>🎉 ¡Se ha cantado LÍNEA! ¿Seguimos?</div>
      )}
      {gameState?.bingoAnnounced && (
        <div className={`${styles.announceBanner} ${styles.bingoBanner}`}>🏆 ¡¡BINGO!! ¡La partida ha terminado!</div>
      )}

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
                    className={`${styles.cell}
                      ${isCalled ? styles.cellCalled : ""}
                      ${isMarked ? styles.cellMarked : ""}
                      ${isNew ? styles.cellNew : ""}
                    `}
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

      {/* Achievements */}
      {hasBingo && <div className={`${styles.achievement} ${styles.achievementBingo}`}>🏆 ¡BINGO COMPLETO! ¡Enhorabuena!</div>}
      {lineRow !== -1 && !hasBingo && <div className={styles.achievement}>🎉 ¡Tienes línea! Sigue marcando para el Bingo</div>}

      <p className={styles.hint}>Toca un número llamado para marcarlo</p>

      {/* Called list */}
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
