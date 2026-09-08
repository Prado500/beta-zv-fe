import { useEffect, useState } from 'react';

/**
 * Cuenta regresiva en segundos para bloquear una acción irreversible.
 *
 * Existe para poner un freno deliberado delante de un botón: el usuario que ya
 * venía dándole a "siguiente" en piloto automático se topa con unos segundos en
 * los que lo único que puede hacer es leer. Ese es todo el propósito — si el
 * botón se pudiera pulsar al instante, la pantalla de confirmación sería un
 * trámite más que se salta sin mirar.
 *
 * **La cuenta arranca al montar y se reinicia montando otra vez.** No lleva un
 * `active` que la rearme: quien lo use debe renderizar el componente solo
 * mientras la pantalla esté en pie —`{paso === 'x' && <Pantalla />}`— y entonces
 * `useState` ya nace con el valor bueno y no hay nada que sincronizar. Un
 * interruptor habría obligado a copiar `seconds` al estado desde el efecto, que
 * es justo la cascada de renders que React desaconseja, y a cambio de nada: el
 * remontaje ya hace ese trabajo, y lo hace bien.
 *
 * @param seconds desde dónde cuenta (3 → "3", "2", "1", 0)
 * @returns segundos que faltan; `0` significa "ya se puede"
 */
export const useCountdown = (seconds: number): number => {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Al llegar a 0 se queda ahí: `setState` con el mismo valor no repinta,
      // así que el intervalo sobrante no cuesta nada y el callback no necesita
      // limpiarse a sí mismo desde dentro.
      setLeft((remaining) => (remaining <= 1 ? 0 : remaining - 1));
    }, 1000);

    // Sin esto, desmontar la pantalla a mitad de cuenta deja un intervalo
    // huérfano llamando a `setState` sobre un componente que ya no existe.
    return () => window.clearInterval(id);
    // El callback solo usa la forma funcional de `setLeft`, así que no depende
    // de `seconds`: el intervalo se monta una vez y vive lo que viva la pantalla.
  }, []);

  return left;
};
