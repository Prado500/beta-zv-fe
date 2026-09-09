import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from '../../../auth/components/UserMenu';
import { useSignOut } from '../../../auth/hooks/useSignOut';
import { initialsOf } from '../../../auth/initials';
import { useAuth } from '../../../auth/useAuth';

/**
 * Cabecera de la landing. Ahora sabe quién está dentro.
 *
 * Tres estados y tres caras. Con sesión, el chip con las iniciales y su menú:
 * es el aviso de que el botón de comprar no va a pedir datos. Sin sesión,
 * "Iniciar sesión", que abre el mismo modal de la compra en su modo de entrar.
 * Y mientras la app aún pregunta a `/me`, nada: reservar el hueco y esperar es
 * mejor que enseñar "Iniciar sesión" y cambiarlo por un avatar medio segundo
 * después.
 *
 * Aquí no hay ni un `fetch`: quien sabe si hay sesión es `useAuth`, y quien la
 * cierra es `useSignOut`.
 */

interface HeaderProps {
  /** Abre la puerta de entrar. Sin él no se ofrece "Iniciar sesión". */
  onSignIn?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSignIn }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const auth = useAuth();
  const session = useSignOut();

  const closeMenu = () => setIsMobileMenuOpen(false);
  const signedIn = auth.status === 'authenticated' && auth.user !== null;

  return (
    <header className="w-full bg-paper/95 shadow-sm border-b border-wine/10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter h-14 md:h-16 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#D4AF37] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <span className="font-script text-wine text-2xl md:text-3xl leading-none pb-1">Eternal Dedications</span>
        </div>
        <nav className="hidden md:flex gap-6 items-center">
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Inicio</a>
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Gallery</a> */}
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Features</a> */}
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Precio</a>
          {/* Ruta de la app, no ancla de la landing: va con `Link` para no recargar la página */}
          <Link className="font-label-md text-on-surface-variant hover:text-primary transition-colors" to="/mis-dedicatorias">Mis Dedicatorias</Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          {signedIn && auth.user ? (
            <UserMenu user={auth.user} onSignOut={() => void session.signOut()} busy={session.busy} />
          ) : auth.status === 'anonymous' ? (
            onSignIn && (
              <button
                type="button"
                onClick={onSignIn}
                className="font-label-md font-medium text-wine hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Iniciar sesión
              </button>
            )
          ) : (
            // Sonda en curso: se reserva el hueco para que nada salte al resolverse.
            <span aria-hidden="true" className="w-9 h-9" />
          )}
          <a className="font-label-md font-medium text-white bg-primary hover:bg-primary-container px-6 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2" href="#pricing">
            Comienza a escribir
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </a>
        </div>
        <button
          className="md:hidden text-wine p-3 -mr-2 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Hairline dorado que separa el header del contenido */}
      <div className="h-px w-full rule-gold"></div>

      {session.error && (
        <p role="alert" className="text-xs text-error font-medium text-center py-1.5 bg-white/80">
          {session.error}
        </p>
      )}

      {/* Menú desplegable responsive */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white border-b border-wine/10 px-5 py-3 flex flex-col gap-1">
          {signedIn && auth.user && (
            <div className="flex items-center gap-3 px-2 py-3 -mx-2 border-b border-wine/10 mb-1">
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
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg" href="#" onClick={closeMenu}>Inicio</a>
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#" onClick={() => setIsMobileMenuOpen(false)}>Gallery</a> */}
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#" onClick={() => setIsMobileMenuOpen(false)}>Features</a> */}
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg" href="#pricing" onClick={closeMenu}>Precio</a>
          <Link className="font-label-md text-on-surface-variant hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg" to="/mis-dedicatorias" onClick={closeMenu}>Mis Dedicatorias</Link>
          {auth.status === 'anonymous' && onSignIn && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onSignIn();
              }}
              className="font-label-md text-wine font-medium hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer"
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
              className="font-label-md text-wine font-medium hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              {session.busy ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          )}
          <a className="font-label-md font-medium text-white bg-wine hover:bg-primary px-6 py-3.5 rounded-full text-center transition-all flex items-center justify-center gap-2 mt-1" href="#pricing" onClick={closeMenu}>
            Empezar ahora
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </a>
        </nav>
      )}
    </header>
  );
};
