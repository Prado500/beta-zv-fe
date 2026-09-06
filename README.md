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
