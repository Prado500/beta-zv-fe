import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CookieBanner } from './components/ui/CookieBanner';
import { usePixelPageViews } from './hooks/usePixelPageViews';
import { MetaPixel } from './components/analytics/MetaPixel';
import { AuthProvider } from './modules/auth/AuthProvider';
import LandingPage from './modules/promo/page/LandingPage';
import EditorPage from './modules/editor/page/EditorPage';
import CardViewerPage from './modules/viewer/page/CardViewerPage';
import PaymentReturnPage from './modules/promo/page/PaymentReturnPage';
import MyDedicationsPage from './modules/dedications/page/MyDedicationsPage';

/**
 * El pixel de Meta, que necesita estar dentro del Router para saber la ruta.
 * No pinta nada, y no carga nada mientras no haya identificador configurado Y
 * consentimiento expreso en el banner de cookies.
 */
const PixelPageViews = () => {
  usePixelPageViews();
  return null;
};

export default function App() {
  return (
    <Router>
      <PixelPageViews />
      {/*
        Meta Pixel. Va aquí dentro, y no en `index.html`, porque en una SPA el
        documento se carga una sola vez: es el router quien sabe que el usuario
        cambió de pantalla. No pinta nada.
      */}
      <MetaPixel />
      {/*
        La sesión se conoce en un solo sitio. La cookie es `HttpOnly`, así que
        el proveedor pregunta a `/me` —solo si hay pista de un inicio previo— y
        publica el veredicto; cabecera, modal y panel lo leen de aquí.
      */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor" element={<EditorPage />} />
          {/*
            Panel posventa. La ruta no lleva envoltorio de sesión: es la propia
            página la que pide el listado y, ante un 401, monta la puerta de
            inicio de sesión. Así hay una sola sonda y una sola puerta, también
            cuando la sesión caduca a medio uso.
          */}
          <Route path="/mis-dedicatorias" element={<MyDedicationsPage />} />
          {/*
            Vuelta de Mercado Pago. Es la URL que el backend registra como
            `back_url`: trae el `payment_id` en la query y aquí se cambia por una
            verificación contra el servidor antes de abrir el editor.
          */}
          <Route path="/pago/retorno" element={<PaymentReturnPage />} />
          {/*
            Visor público. `/carta/:slug` es la ruta que el backend escribe en el
            correo y codifica en el QR (`FRONTEND_URL/carta/<slug>`); `/c/:slug` se
            mantiene para no romper enlaces antiguos.
          */}
          <Route path="/carta/:slug" element={<CardViewerPage />} />
          <Route path="/c/:slug" element={<CardViewerPage />} />
        </Routes>
      </AuthProvider>
      {/*
        El aviso de cookies, por encima de todo y fuera de las rutas: la
        decisión es de la visita entera, no de una pantalla. Se pinta solo
        mientras no se haya decidido nada.
      */}
      <CookieBanner />
    </Router>
  );
}
