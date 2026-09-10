import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from '../../../auth/components/UserMenu';
import { useSignOut } from '../../../auth/hooks/useSignOut';
import { initialsOf } from '../../../auth/initials';
import { useAuth } from '../../../auth/useAuth';
import { SECTION_LINKS } from './sectionLinks';

/**
 * Cabecera de la landing: las secciones de la página y quién está dentro.
 *
 * Tres estados y tres caras. Con sesión, el chip con las iniciales y su menú:
 * es el aviso de que el botón de comprar no va a pedir datos. Sin sesión,
 * "Iniciar sesión", que abre el mismo modal de la compra en su modo de entrar.
 * Y mientras la app aún pregunta a `/me`, nada: reservar el hueco y esperar es
 * mejor que enseñar "Iniciar sesión" y cambiarlo por un avatar medio segundo
 * después.
 *
 * Los enlaces a las secciones solo caben a partir de `lg`; por debajo viven en
 * el desplegable. La sesión y el botón de escribir se quedan en la barra desde
 * `md`, así que en la franja entre `md` y `lg` el desplegable lista solo las
 * secciones y no repite lo que ya está a la vista.
 *
 * Aquí no hay ni un `fetch`: quien sabe si hay sesión es `useAuth`, y quien la
 * cierra es `useSignOut`.
 */

interface HeaderProps {
  /** Abre la puerta de entrar. Sin él no se ofrece "Iniciar sesión". */
  onSignIn?: () => void;
}

const NAV_LINK =
  'font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap';
const MENU_LINK =
  'font-label-md text-on-surface-variant hover:text-primary hover:bg-blush/50 transition-colors py-3 px-2 -mx-2 rounded-lg';
const MENU_ACTION =
  'font-label-md text-wine font-medium hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer';

export const Header: React.FC<HeaderProps> = ({ onSignIn }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const auth = useAuth();
  const session = useSignOut();

  const closeMenu = () => setIsMobileMenuOpen(false);
  const signedIn = auth.status === 'authenticated' && auth.user !== null;

  return (
    <header className="w-full bg-paper/95 shadow-sm border-b border-wine/10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter h-14 md:h-16 flex justify-between items-center gap-4">
        <a href="#inicio" className="flex items-center gap-2.5 shrink-0">
          <span className="material-symbols-outlined text-[#D4AF37] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <span className="font-script text-wine text-2xl md:text-3xl leading-none pb-1">Eternal Dedications</span>
        </a>

        <nav className="hidden lg:flex gap-5 items-center" aria-label="Secciones">
          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={NAV_LINK}>
              {link.label}
            </a>
          ))}
          {/* Ruta de la app, no ancla de la landing: va con `Link` para no recargar la página */}
          <Link className={NAV_LINK} to="/mis-dedicatorias">
            Mis Dedicatorias
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4">
            {signedIn && auth.user ? (
              <UserMenu user={auth.user} onSignOut={() => void session.signOut()} busy={session.busy} />
            ) : auth.status === 'anonymous' ? (
              onSignIn && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="font-label-md font-medium text-wine hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Iniciar sesión
                </button>
              )
            ) : (
              // Sonda en curso: se reserva el hueco para que nada salte al resolverse.
              <span aria-hidden="true" className="w-9 h-9" />
            )}
            <a
              className="font-label-md font-medium text-white bg-primary hover:bg-primary-container px-5 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2 whitespace-nowrap"
              href="#pricing"
            >
              Comienza a escribir
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </a>
          </div>

          {/* El desplegable llega hasta lg: entre md y lg no cabe la lista de secciones */}
          <button
            type="button"
            className="lg:hidden text-wine p-3 -mr-2 focus:outline-none cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Hairline dorado que separa el header del contenido */}
      <div className="h-px w-full rule-gold"></div>

      {session.error && (
        <p role="alert" className="text-xs text-error font-medium text-center py-1.5 bg-white/80">
          {session.error}
        </p>
      )}

      {/* Menú desplegable responsive. Lo que ya está en la barra desde md
          —quién eres, entrar o salir, el botón de escribir— aquí se oculta
          a partir de md para no aparecer dos veces. */}
      {isMobileMenuOpen && (
        <nav
          className="lg:hidden bg-white border-b border-wine/10 px-5 py-3 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto"
          aria-label="Menú"
        >
          {signedIn && auth.user && (
            <div className="md:hidden flex items-center gap-3 px-2 py-3 -mx-2 border-b border-wine/10 mb-1">
              <span
                aria-hidden="true"
                className="w-9 h-9 shrink-0 rounded-full bg-wine text-white ring-2 ring-[#D4AF37]/70 flex items-center justify-center text-xs font-bold tracking-wider"
              >
                {initialsOf(auth.user.name, auth.user.email)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-background truncate">
                  {auth.user.name || auth.user.email}
                </p>
                <p className="text-xs text-on-surface-variant truncate">{auth.user.email}</p>
              </div>
            </div>
          )}
          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu} className={MENU_LINK}>
              {link.label}
            </a>
          ))}
          <Link className={MENU_LINK} to="/mis-dedicatorias" onClick={closeMenu}>
            Mis Dedicatorias
          </Link>
          {auth.status === 'anonymous' && onSignIn && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onSignIn();
              }}
              className={`md:hidden ${MENU_ACTION}`}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Iniciar sesión
            </button>
          )}
          {signedIn && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                void session.signOut();
              }}
              disabled={session.busy}
              className={`md:hidden ${MENU_ACTION} disabled:opacity-50`}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              {session.busy ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          )}
          <a
            className="md:hidden font-label-md font-medium text-white bg-wine hover:bg-primary px-6 py-3.5 rounded-full text-center transition-all flex items-center justify-center gap-2 mt-2"
            href="#pricing"
            onClick={closeMenu}
          >
            Empezar ahora
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </a>
        </nav>
      )}
    </header>
  );
};
