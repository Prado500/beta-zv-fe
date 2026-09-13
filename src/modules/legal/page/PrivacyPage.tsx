import privacy from '../content/politica-de-privacidad.md?raw';
import { LegalPageLayout } from '../components/LegalPageLayout';

/** Política de Tratamiento de Datos Personales y Privacidad, en `/privacidad`. */
export default function PrivacyPage() {
  return <LegalPageLayout markdown={privacy} />;
}
