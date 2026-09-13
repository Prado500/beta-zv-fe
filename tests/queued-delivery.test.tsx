import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueuedModal } from '../src/modules/editor/components/QueuedModal';

/**
 * Lo que se promete al encolar la carta.
 *
 * Es el último momento en que se le dice a la persona qué va a pasar, así que
 * es donde una promesa falsa hace más daño: quien espera un adjunto que no
 * llega da por perdido lo que compró, y escribe a soporte en vez de entrar a
 * "Mis dedicatorias". Por correo viajan el enlace y el QR; el archivo HTML se
 * descarga desde el panel, y aquí tiene que decirse.
 */

const abrir = () =>
  render(
    <QueuedModal
      open
      message=""
      recipientEmail="ana@ejemplo.com"
      onClose={() => {}}
    />,
  );

describe('el acuse de la carta encolada', () => {
  it('dice qué llega por correo: el enlace y el código QR', () => {
    abrir();

    const aviso = screen.getByRole('dialog');
    expect(aviso.textContent).toContain('ana@ejemplo.com');
    expect(aviso.textContent).toMatch(/enlace permanente de la carta y su código QR/);
  });

  it('no promete ningún adjunto, porque no viaja ninguno', () => {
    abrir();

    // La promesa que había: «con el enlace permanente de la carta y el archivo adjunto»
    expect(screen.getByRole('dialog').textContent).not.toMatch(/adjunt/i);
  });

  it('dice dónde está la carta en HTML, y con qué botón se descarga', () => {
    abrir();

    const aviso = screen.getByRole('dialog').textContent ?? '';
    expect(aviso).toContain('Mis dedicatorias');
    expect(aviso).toContain('Carta HTML');
  });

  it('sin correo del destinatario sigue diciendo lo mismo, sin huecos', () => {
    render(<QueuedModal open message="" recipientEmail="" onClose={() => {}} />);

    const aviso = screen.getByRole('dialog').textContent ?? '';
    expect(aviso).toContain('recibirás un correo electrónico');
    expect(aviso).toContain('Mis dedicatorias');
    expect(aviso).not.toMatch(/adjunt/i);
  });

  it('cerrado no promete nada: no se pinta', () => {
    render(<QueuedModal open={false} message="" recipientEmail="a@b.com" onClose={() => {}} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
