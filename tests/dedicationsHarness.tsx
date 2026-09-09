import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ANONYMOUS, type AuthSnapshot } from '../src/modules/auth/AuthContext';
import { AuthProvider } from '../src/modules/auth/AuthProvider';
import MyDedicationsPage from '../src/modules/dedications/page/MyDedicationsPage';
import type { Dedication } from '../src/modules/dedications/services/dedications';
import { EditorStub } from './EditorStub';

/**
 * Andamio compartido por las pruebas del panel "Mis dedicatorias".
 *
 * Las filas son las del ejemplo real del handoff, con sus nulos tal como los
 * manda el backend: una compra pagada que nunca llegó al editor, un borrador con
 * carta empezada y una carta publicada. Nada de aquí conoce la implementación
 * del panel: monta, busca y pulsa, que es lo que hace una persona.
 */

export const DRAFT_EMPTY: Dedication = {
  purchaseId: '6c1f2b7e-3a1d-4c8b-9d2e-0f1a2b3c4d5e',
  letterId: null,
  state: 'draft',
  title: null,
  recipientName: null,
  theme: null,
  publicSlug: null,
  publicUrl: null,
  paidAt: '2026-09-08T20:11:03.412Z',
  publishedAt: null,
  updatedAt: '2026-09-08T20:11:03.412Z',
};

export const DRAFT_STARTED: Dedication = {
  purchaseId: 'a1b2c3d4-0000-4000-8000-000000000002',
  letterId: 'f0e1d2c3-0000-4000-8000-000000000002',
  state: 'draft',
  title: 'Casi lista',
  recipientName: 'Lucía',
  theme: 'starry',
  publicSlug: null,
  publicUrl: null,
  paidAt: '2026-09-06T10:00:00.000Z',
  publishedAt: null,
  updatedAt: '2026-09-06T10:30:00.000Z',
};

export const PUBLISHED: Dedication = {
  purchaseId: 'b2d9e4a1-7f30-4e6c-a5b8-9c0d1e2f3a4b',
  letterId: '0e7a5c33-2b1f-4d9a-8e6c-5f4a3b2c1d0e',
  state: 'published',
  title: 'Para ti 💌',
  recipientName: 'Ana',
  theme: 'classic',
  publicSlug: 'Qx9_2mV0aP3kLd8w',
  publicUrl: 'https://brave-sky-0fa9ccf0f.6.azurestaticapps.net/carta/Qx9_2mV0aP3kLd8w',
  paidAt: '2026-09-07T18:02:41.009Z',
  publishedAt: '2026-09-07T18:09:12.774Z',
  updatedAt: '2026-09-07T18:09:12.774Z',
};

/**
 * Monta el panel en su ruta, con el editor de mentira al lado para poder llegar
 * a él. La sesión que la app cree tener al montar se puede fijar; el panel no
 * la usa para decidir nada —su sonda es el listado—, pero sí la actualiza.
 */
export const renderPanel = (auth: AuthSnapshot = ANONYMOUS) =>
  render(
    <MemoryRouter initialEntries={['/mis-dedicatorias']}>
      <AuthProvider initial={auth}>
        <Routes>
          <Route path="/mis-dedicatorias" element={<MyDedicationsPage />} />
          <Route path="/editor" element={<EditorStub />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

/** La puerta de sesión, si está en pantalla. */
export const gate = () => screen.queryByRole('dialog', { name: /Inicia sesión para ver tus/i });

/** Las tarjetas del panel, en el orden en que llegaron. */
export const cards = () => screen.queryAllByRole('article');
