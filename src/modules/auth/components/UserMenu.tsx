import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { firstNameOf, initialsOf } from '../initials';
import type { UserResponse } from '../services/auth';

/**
 * El chip de sesión de la cabecera: iniciales, nombre y un menú de dos cosas.
 *
 * Su primera función no es el menú, es existir: mientras se ve, la persona sabe
 * que está dentro y que el botón de comprar no le va a pedir sus datos. Por eso
 * se pinta con el mismo lenguaje que el resto de la página —vino, filo dorado—
 * y no como un icono genérico de "cuenta".
 *
 * Se cierra con Escape, con clic fuera y al elegir algo. `aria-haspopup` y
 * `aria-expanded` cuentan al lector de pantalla que hay un menú y si está
 * abierto; los elementos van con `role="menuitem"` por el mismo motivo.
 */

interface UserMenuProps {
  user: UserResponse;
  onSignOut: () => void;
  /** Cerrando sesión: el botón se apaga para que no salgan dos peticiones. */
  busy: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut, busy }) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  const initials = initialsOf(user.name, user.email);
  const firstName = firstNameOf(user.name, user.email);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Tu cuenta: ${user.name || user.email}`}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-blush/50 transition-colors cursor-pointer"
      >
        <span
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-wine text-white ring-2 ring-[#D4AF37]/70 flex items-center justify-center text-[11px] font-bold tracking-wider"
        >
          {initials}
        </span>
        <span className="font-label-md text-on-surface-variant max-w-28 truncate">{firstName}</span>
        <span className="material-symbols-outlined text-[18px] text-wine/60">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-[0_18px_40px_-16px_rgba(94,10,27,0.45)] border border-wine/15 p-2 z-50"
        >
          <div className="px-3 py-2 border-b border-wine/10 mb-1">
            <p className="text-sm font-semibold text-on-background truncate">{user.name || firstName}</p>
            <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            to="/mis-dedicatorias"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-blush/50 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">history_edu</span>
            Mis dedicatorias
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            disabled={busy}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-blush/50 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {busy ? 'Saliendo…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  );
};
