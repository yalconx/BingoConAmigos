# 🎱 Bingo Online

App de bingo multijugador en tiempo real con salas privadas por código.

---

## 🚀 Cómo publicar (sin saber programar)

### PASO 1 — Crear cuenta en GitHub (gratis)
1. Ve a https://github.com/signup
2. Crea una cuenta con tu email
3. Verifica el email

---

### PASO 2 — Subir el código a GitHub
1. Ve a https://github.com/new
2. Nombre del repositorio: `bingo-online`
3. Déjalo en **Privado** (Private) → haz clic en **Create repository**
4. Haz clic en **uploading an existing file**
5. Arrastra **todos los archivos y carpetas** de este proyecto
6. Haz clic en **Commit changes**

---

### PASO 3 — Crear base de datos Firebase (gratis)
1. Ve a https://console.firebase.google.com
2. Haz clic en **Añadir proyecto** → ponle un nombre (ej: `mi-bingo`)
3. Desactiva Google Analytics → **Crear proyecto**
4. En el menú izquierdo: **Compilación → Realtime Database**
5. Haz clic en **Crear una base de datos**
   - Selecciona la ubicación más cercana (ej: `europe-west1`)
   - Elige **Empezar en modo de prueba** → **Habilitar**
6. Copia la URL de la base de datos (termina en `.firebaseio.com`)

#### Configurar reglas de seguridad
1. En Firebase → Realtime Database → **Reglas**
2. Pega esto y guarda:
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

#### Obtener las credenciales
1. En Firebase → ⚙️ Configuración del proyecto → **General**
2. Baja hasta "Tus apps" → haz clic en **</>** (Web)
3. Registra la app con cualquier nombre
4. Copia los valores de `firebaseConfig` — los necesitarás en el Paso 4

---

### PASO 4 — Publicar en Vercel (gratis)
1. Ve a https://vercel.com/signup
2. Regístrate con tu cuenta de GitHub
3. Haz clic en **Add New → Project**
4. Selecciona el repositorio `bingo-online` → **Import**
5. Antes de hacer deploy, añade las variables de entorno:
   - Haz clic en **Environment Variables**
   - Añade estas 7 variables (los valores los sacas del `firebaseConfig` del Paso 3):

| Variable | Dónde está en firebaseConfig |
|----------|------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `databaseURL` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

6. Haz clic en **Deploy** ✅

En 2-3 minutos tendrás una URL pública tipo `https://bingo-online-xxx.vercel.app`

---

## 🎮 Cómo jugar

1. **El bombo** entra a la app → "Soy el Bombo" → crea una sala → recibe un código de 4 letras
2. **Los jugadores** entran a la app → "Soy Jugador" → introducen el código
3. El bombo pulsa **Sacar bola** → los números aparecen en tiempo real en todos los cartones
4. Los jugadores tocan los números de su cartón para marcarlos
5. El bombo canta **Línea** o **Bingo** cuando alguien avisa

---

## 📁 Estructura del proyecto

```
bingo-app/
├── pages/
│   ├── index.js          # Landing (elegir rol)
│   ├── bombo.js          # Vista del bombo/narrador
│   └── player.js         # Vista del jugador con cartón
├── lib/
│   ├── firebase.js       # Configuración Firebase
│   └── bingo.js          # Lógica del juego
├── styles/
│   └── globals.css       # Estilos globales
└── package.json
```

---

## ❓ Preguntas frecuentes

**¿Es gratis?**
Sí. Firebase Realtime Database tiene un plan gratuito (Spark) que aguanta perfectamente partidas de bingo. Vercel también es gratuito para proyectos personales.

**¿Cuántos jugadores pueden entrar?**
Sin límite técnico. Para una partida normal de bingo familiar, funciona perfectamente.

**¿Los cartones son únicos?**
Sí. Cada jugador que entra a una sala recibe un cartón generado aleatoriamente con una semilla única basada en el timestamp.
