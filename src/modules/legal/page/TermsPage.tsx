import terms from '../content/terminos-y-condiciones.md?raw';
import { LegalPageLayout } from '../components/LegalPageLayout';

/** Términos y Condiciones de Servicio, en `/terminos`. */
export default function TermsPage() {
  return <LegalPageLayout markdown={terms} />;
}
