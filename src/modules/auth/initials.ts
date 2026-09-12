/**
 * Iniciales para el avatar: "Sebastián Prado" → "SP", "ana" → "A".
 *
 * Sin nombre usable se cae al correo, y sin correo a un signo neutro: el chip
 * tiene que pintarse siempre, porque su función es decir "aquí hay sesión".
 */
export const initialsOf = (name: string, email: string): string => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const letters = words.slice(0, 2).map((word) => word[0]);
  if (letters.length > 0) return letters.join('').toUpperCase();
  const first = email.trim()[0];
  return first ? first.toUpperCase() : '?';
};

/** Nombre de pila para el saludo: la primera palabra, o el correo si no hay nombre. */
export const firstNameOf = (name: string, email: string): string => {
  const first = name.trim().split(/\s+/)[0];
  return first || email;
};
