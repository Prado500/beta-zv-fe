import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './modules/promo/page/LandingPage';
import EditorPage from './modules/editor/page/EditorPage';
import CardViewerPage from './modules/viewer/page/CardViewerPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
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
