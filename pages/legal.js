import Head from "next/head";
import Link from "next/link";
import styles from "./legal.module.css";

export default function Legal() {
  return (
    <>
      <Head>
        <title>Aviso Legal — Bingo Con Amigos</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.page}>
        <div className={styles.container}>
          <Link href="/" className={styles.back}>← Volver al inicio</Link>
          <h1 className={styles.title}>Aviso Legal</h1>
          <p className={styles.updated}>Última actualización: marzo 2025</p>

          <section className={styles.section}>
            <h2>1. Titular del sitio web</h2>
            <p>El presente sitio web es gestionado por un particular. No existe ninguna sociedad mercantil, asociación ni entidad jurídica vinculada a este servicio.</p>
            <p>Contacto: <a href="mailto:yalconx@gmail.com">yalconx@gmail.com</a></p>
          </section>

          <section className={styles.section}>
            <h2>2. Objeto y naturaleza del servicio</h2>
            <p>Bingo Con Amigos es una herramienta de entretenimiento gratuita que permite jugar al bingo online con amigos y familiares. El servicio se presta de forma totalmente gratuita, sin publicidad y sin ánimo de lucro.</p>
          </section>

          <section className={styles.section}>
            <h2>3. Propiedad intelectual</h2>
            <p>El código fuente, diseño y contenidos de este sitio web son propiedad de su titular. Queda prohibida su reproducción total o parcial sin autorización expresa.</p>
          </section>

          <section className={styles.section}>
            <h2>4. Exclusión de responsabilidad</h2>
            <p>El titular no se responsabiliza de los posibles daños o perjuicios que puedan derivarse del uso del servicio, incluyendo interrupciones del servicio, pérdida de datos de partidas o fallos técnicos. El servicio se proporciona "tal cual" sin garantías de disponibilidad continua.</p>
          </section>

          <section className={styles.section}>
            <h2>5. Legislación aplicable</h2>
            <p>El presente aviso legal se rige por la legislación española vigente. Para cualquier controversia derivada del uso de este sitio web, las partes se someten a los juzgados y tribunales españoles.</p>
          </section>

          <section className={styles.section}>
            <h2>6. Contacto</h2>
            <p><a href="mailto:yalconx@gmail.com">yalconx@gmail.com</a></p>
          </section>
        </div>
      </div>
    </>
  );
}
