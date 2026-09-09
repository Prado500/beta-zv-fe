import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './modules/promo/page/LandingPage';
import EditorPage from './modules/editor/page/EditorPage';
import CardViewerPage from './modules/viewer/page/CardViewerPage';
import PaymentReturnPage from './modules/promo/page/PaymentReturnPage';
import MyDedicationsPage from './modules/dedications/page/MyDedicationsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
        {/*
          Panel posventa. La ruta no lleva envoltorio de sesión: la cookie es
          `HttpOnly` y no se puede leer desde aquí; es la propia página la que
          pide el listado y, ante un 401, monta la puerta de inicio de sesión.
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
    </Router>
  );
}
