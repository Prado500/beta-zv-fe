import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { DOCUMENT_TYPES } from '../../modules/legal/documentTypes';
import { fieldClass, type FieldTone } from './formStyles';

/**
 * Desplegable de tipo de documento.
 *
 * Vista pura: recibe lo que `register` devuelve y el tono del campo, y no sabe de qué
 * formulario viene. Lo que se ve son las etiquetas del equipo legal; lo que viaja es
 * el código DIAN, que es el `value` de cada `<option>`.
 *
 * No lleva opción vacía a propósito: viene preseleccionado en cédula de ciudadanía,
 * que es lo que tiene la gran mayoría. Una opción "Selecciona…" convertiría un campo
 * que casi nadie necesita tocar en uno obligatorio para todos.
 */

interface DocumentTypeSelectProps {
  id: string;
  tone: FieldTone;
  field: UseFormRegisterReturn<'documentType'>;
}

export const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({ id, tone, field }) => (
  <select id={id} {...field} className={fieldClass(tone, 'cursor-pointer appearance-none')}>
    {DOCUMENT_TYPES.map((type) => (
      <option key={type.code} value={type.code}>
        {type.label}
      </option>
    ))}
  </select>
);
