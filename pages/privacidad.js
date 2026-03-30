import Head from "next/head";
import Link from "next/link";
import styles from "./legal.module.css";

export default function Privacidad() {
  return (
    <>
      <Head>
        <title>Política de Privacidad — Bingo Con Amigos</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.page}>
        <div className={styles.container}>
          <Link href="/" className={styles.back}>← Volver al inicio</Link>
          <h1 className={styles.title}>Política de Privacidad</h1>
          <p className={styles.updated}>Última actualización: marzo 2025</p>

          <section className={styles.section}>
            <h2>1. Responsable</h2>
            <p>El responsable de este sitio web es un particular contactable en <a href="mailto:yalconx@gmail.com">yalconx@gmail.com</a>. No existe sociedad mercantil asociada a este servicio.</p>
          </section>

          <section className={styles.section}>
            <h2>2. Datos que NO se recopilan</h2>
            <p>Bingo Con Amigos <strong>no recopila, almacena ni trata ningún dato personal</strong> de sus usuarios. Concretamente:</p>
            <ul>
              <li>No se requiere registro ni cuenta de usuario.</li>
              <li>No se solicitan datos de identificación personal (nombre real, correo electrónico, teléfono, etc.).</li>
              <li>No se utilizan cookies de rastreo ni tecnologías de seguimiento.</li>
              <li>No se comparte ningún dato con terceros.</li>
              <li>Los nombres introducidos para jugar son temporales, se almacenan únicamente durante la duración de la partida en Firebase Realtime Database y se eliminan automáticamente.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Servicios de terceros</h2>
            <p>Este sitio utiliza <strong>Firebase Realtime Database</strong> de Google para la sincronización en tiempo real de las partidas. Los datos de las partidas (números cantados, estado de la sala, nombres de sesión) se almacenan temporalmente en los servidores de Google y se eliminan de forma periódica. Para más información consulta la <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">política de privacidad de Firebase</a>.</p>
            <p>El sitio está alojado en <strong>Vercel</strong>. Puedes consultar su política de privacidad en <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">vercel.com</a>.</p>
          </section>

          <section className={styles.section}>
            <h2>4. Contacto</h2>
            <p>Para cualquier consulta relacionada con la privacidad puedes escribir a <a href="mailto:yalconx@gmail.com">yalconx@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </>
  );
}
