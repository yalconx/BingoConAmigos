import { useState } from "react";
import { useRouter } from "next/router";
import { ref, set, get } from "firebase/database";
import { db } from "../lib/firebase";
import { generateRoomCode } from "../lib/bingo";
import styles from "./index.module.css";
import Head from "next/head";
import Link from "next/link";

export default function Landing() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hostName, setHostName] = useState("");

  const createRoom = async () => {
    if (!hostName.trim()) { setError("Pon tu nombre antes de crear la partida"); return; }
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
      players: {},
    });
    router.push(`/bombo?room=${code}&name=${encodeURIComponent(hostName.trim())}`);
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
    <>
      <Head>
        <title>Bingo Online Gratis con Amigos | Juega al Bingo en Casa</title>
        <meta name="description" content="Juega al bingo online gratis con amigos y familia desde casa o desde el móvil. Crea una sala, comparte el código y ¡a jugar! Sin descargas, sin registro." />
        <meta name="keywords" content="bingo online, jugar bingo en casa, bingo con amigos, bingo gratis, bingo online gratis, bingo desde el móvil, bingo familiar, bingo con familia, juego bingo online, bingo en español" />
        <meta property="og:title" content="Bingo Online Gratis con Amigos | Juega al Bingo en Casa" />
        <meta property="og:description" content="El bingo online más sencillo para jugar con amigos y familia. Crea una sala, comparte el código y ¡a jugar desde cualquier dispositivo!" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://bingoconamigos.vercel.app" />
      </Head>

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
            <p className={styles.cardDesc}>Organiza la partida, comparte el código y canta los números</p>
            <input
              className={styles.nameInput}
              placeholder="Tu nombre (organizador)"
              maxLength={20}
              value={hostName}
              onChange={e => { setHostName(e.target.value); setError(""); }}
            />
            <button className={`${styles.btn} ${styles.btnGreen}`} onClick={createRoom} disabled={loading}>
              {loading ? "Creando sala…" : "Crear nueva partida"}
            </button>
          </div>

          {/* JUGADOR */}
          <div className={styles.card}>
            <div className={styles.cardEmoji}>🎴</div>
            <h2 className={styles.cardTitle}>Unirme a una partida</h2>
            <p className={styles.cardDesc}>Introduce el código que te ha dado el organizador</p>
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
          Cada jugador recibe un cartón único generado aleatoriamente &nbsp;·&nbsp;
          <Link href="/privacidad" className={styles.footerLink}>Privacidad</Link>
          &nbsp;·&nbsp;
          <Link href="/legal" className={styles.footerLink}>Aviso legal</Link>
        </footer>

        {/* SEO CONTENT */}
        <section className={styles.seoSection}>
          <div className={styles.seoGrid}>
            <div className={styles.seoBlock}>
              <div className={styles.seoIcon}>🏠</div>
              <h2 className={styles.seoTitle}>Juega al bingo en casa</h2>
              <p className={styles.seoText}>¿Buscas un plan divertido para hacer en casa? Nuestro bingo online es perfecto para reuniones familiares, cenas con amigos o tardes de juegos. Sin cartones de papel, sin bolillero físico: todo desde el móvil o el ordenador.</p>
            </div>
            <div className={styles.seoBlock}>
              <div className={styles.seoIcon}>👥</div>
              <h2 className={styles.seoTitle}>Bingo con amigos online</h2>
              <p className={styles.seoText}>¿Tus amigos están repartidos por distintas ciudades? Con Bingo Con Amigos podéis jugar juntos en tiempo real desde cualquier lugar. Un jugador crea la sala, comparte el código por WhatsApp y en segundos todos tienen su cartón único.</p>
            </div>
            <div className={styles.seoBlock}>
              <div className={styles.seoIcon}>📱</div>
              <h2 className={styles.seoTitle}>Bingo desde el móvil</h2>
              <p className={styles.seoText}>Nuestra app está optimizada para móvil. No necesitas descargar nada: entra desde el navegador de tu iPhone o Android, elige tu rol y empieza a jugar en segundos. El cartón se adapta perfectamente a cualquier pantalla.</p>
            </div>
            <div className={styles.seoBlock}>
              <div className={styles.seoIcon}>🎉</div>
              <h2 className={styles.seoTitle}>Bingo para fiestas y reuniones</h2>
              <p className={styles.seoText}>Cumpleaños, Navidades, reuniones de empresa, despedidas... el bingo es el juego perfecto para cualquier celebración. El organizador lleva el bombo desde su pantalla mientras todos los jugadores marcan sus cartones en tiempo real.</p>
            </div>
            <div className={styles.seoBlock}>
              <div className={styles.seoIcon}>✅</div>
              <h2 className={styles.seoTitle}>Gratis, sin registro, sin descargas</h2>
              <p className={styles.seoText}>No necesitas crear una cuenta ni instalar ninguna aplicación. Entra, crea tu sala o únete con un código, y a jugar. Es completamente gratuito y funciona en cualquier navegador moderno.</p>
            </div>
            <div className={styles.seoBlock}>
              <div className={styles.seoIcon}>🎱</div>
              <h2 className={styles.seoTitle}>Bingo español auténtico</h2>
              <p className={styles.seoText}>Jugamos al bingo español de toda la vida: cartones de 3 filas y 9 columnas con 15 números del 1 al 90. El bombo narra cada número con los clásicos pregones de siempre. ¡El patito, las dos palitos, los dos gordos y el noventa, rey del tablero!</p>
            </div>
          </div>

          <div className={styles.seoFaq}>
            <h2 className={styles.seoFaqTitle}>Preguntas frecuentes sobre el bingo online</h2>
            <div className={styles.faqList}>
              <details className={styles.faq}>
                <summary className={styles.faqQ}>¿Cómo se juega al bingo online con amigos?</summary>
                <p className={styles.faqA}>Es muy sencillo: el organizador crea una sala y recibe un código de 4 letras. Lo comparte por WhatsApp con sus amigos, que entran con ese código y reciben cada uno un cartón diferente. El organizador va sacando bolas y los jugadores marcan sus números. El primero en completar una línea o el cartón completo gana.</p>
              </details>
              <details className={styles.faq}>
                <summary className={styles.faqQ}>¿Cuántos jugadores pueden jugar a la vez?</summary>
                <p className={styles.faqA}>No hay límite de jugadores. Puedes jugar con 2 personas o con 50. Cada jugador recibirá un cartón único y diferente generado aleatoriamente.</p>
              </details>
              <details className={styles.faq}>
                <summary className={styles.faqQ}>¿Necesito descargar alguna aplicación?</summary>
                <p className={styles.faqA}>No. Bingo Con Amigos funciona directamente desde el navegador de tu móvil u ordenador. Sin instalaciones, sin registro, sin pagar nada.</p>
              </details>
              <details className={styles.faq}>
                <summary className={styles.faqQ}>¿Los cartones son realmente diferentes para cada jugador?</summary>
                <p className={styles.faqA}>Sí. Cada cartón se genera aleatoriamente con una semilla única en el momento de entrar a la sala, por lo que es prácticamente imposible que dos jugadores tengan el mismo cartón.</p>
              </details>
              <details className={styles.faq}>
                <summary className={styles.faqQ}>¿Se puede marcar los números automáticamente?</summary>
                <p className={styles.faqA}>Sí. Cada jugador puede elegir entre marcar los números manualmente tocando su cartón, o activar el modo automático para que se marquen solos al salir.</p>
              </details>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
