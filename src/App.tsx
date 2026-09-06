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
        {/* Visor público: es la URL que se codifica en el QR */}
        <Route path="/c/:id" element={<CardViewerPage />} />
      </Routes>
    </Router>
  );
}
