# 💌 ZyExperience / Plataforma de Dedicatorias Digitales Interactivas

Plataforma web diseñada para crear tarjetas interactivas personalizadas (con música, galerías de fotos y animaciones) acompañadas de un código QR físico para imprimir y regalar.

---

## 🔄 Flujo del Sistema (User Journey)

El ciclo de vida de la compra y generación del producto sigue este orden estricto:

1. **Landing Page:** El usuario visualiza la propuesta, ve un preview interactivo, consulta la disponibilidad en tiempo real (*stock*) y elige su temática.
2. **Pasarela de Pagos:** El usuario realiza el pago seguro del servicio.
3. **Editor de Tarjetas:** Tras la confirmación del pago, el usuario accede al editor para personalizar textos, fotos, canciones y temática.
4. **Generación y Envía:** 
   * Se genera un código QR personalizado según el tema elegido apuntando a la URL final.
   * Se compila el archivo `.html` interactivo.
   * El sistema envía automáticamente al correo del comprador: el HTML, la imagen del QR en alta resolución (HD) y el enlace web directo.

---

## 🔌 Conexión con la API

Todas las llamadas pasan por `src/utils/api.ts`, que es el único sitio donde se
manejan cookies y CSRF:

* **Sesión.** Cookie `HttpOnly` del backend. Cada llamada usa `credentials: 'include'`;
  no hay ningún token en `localStorage` ni en el estado de React.
* **CSRF.** `apiFetch` pide `GET /api/v1/auth/csrf` la primera vez, cachea el token y
  lo manda en `X-CSRF-Token` en todo POST/PUT/PATCH/DELETE. Si el servidor lo rechaza
  por caducado, lo renueva y reintenta una sola vez.
* **Origen.** Por defecto las rutas son relativas (mismo origen). En desarrollo el
  proxy de `vite.config.ts` manda `/api` a `http://127.0.0.1:8000`; esto **no es
  comodidad**: la cookie es `SameSite=Lax` y en una llamada de 5173 a 8000 el
  navegador no la enviaría. Se puede apuntar a otro backend con
  `VITE_API_PROXY_TARGET` (desarrollo) o `VITE_API_BASE_URL` (build).

### Creación asíncrona de la carta

`POST /api/v1/letters` responde **202 Accepted**: valida la compra, encola el encargo
y contesta sin haber escrito nada. En ese momento **no existe** enlace público ni QR,
así que el editor muestra una pantalla de "tu carta se está procesando" y el enlace,
el QR y el archivo adjunto llegan por correo cuando el worker termina. Las fotos se
suben antes, una a una, a `POST /api/v1/letters/photos/eager`; la previsualización usa
siempre `URL.createObjectURL` porque el contenedor temporal es privado y no devuelve
URLs públicas.

---

## 🛠️ Stack Tecnológico y Librerías

### Frontend (Este Repositorio)
* **Framework:** React con TypeScript
* **Build Tool:** Vite
* **Estilos:** Tailwind CSS
* **Generación de QR:** `qr-code-styling` (renderizado avanzado por Canvas/SVG adaptado por temas)
* **Iconos / UI:** Lucide / Material Symbols
* **Control de Estado:** React Hooks / Context API

---

## 📁 Estructura del Proyecto

```text
src/
├── assets/
│   └── flores/             # Recursos de flores divididos por temas (1 al 4)
├── modules/
│   ├── editor/             # Módulo del editor de tarjetas
│   │   ├── components/     # AnimatedBackground.tsx, PhonePreview.tsx
│   │   ├── page/           # EditorPage.tsx
│   │   └── types.ts        # Tipados del editor
│   └── promo/              # Módulo de la Landing Page
│       ├── components/     # Layout y secciones (Hero, Features, Pricing, etc.)
│       └── page/           # LandingPage.tsx
└── utils/
    └── exportHtml.ts       # Lógica de compilación y descarga del HTML/QR
