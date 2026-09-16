import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutInput, CheckoutValues } from '../../../hooks/useCheckoutFlow';
import { DocumentTypeSelect } from '../../../../../components/ui/DocumentTypeSelect';
import { FieldError } from '../../../../../components/ui/FieldError';
import { fieldClass, fieldTone, HINT, LABEL } from '../../../../../components/ui/formStyles';

/**
 * La factura, y con ella el documento de identidad.
 *
 * Va aparte de `AccountStep` porque es otra responsabilidad: el paso de la
 * cuenta pregunta quién eres y a dónde te escribimos; esto pregunta si además
 * necesitas un documento tributario. Son dos conversaciones distintas y solo una
 * le ocurre a casi nadie.
 *
 * Los campos no se esconden con CSS, no se montan: mientras no haya factura no
 * existen en el árbol, así que ni salen en la navegación por teclado ni los
 * anuncia un lector de pantalla ni hay nada que rellenar por descuido.
 *
 * Vista pura, como el resto del paso: pinta y avisa. Quién es obligatorio y
 * cuándo lo decide el esquema de `useCheckoutFlow`.
 */

interface InvoiceFieldsProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
}

export const InvoiceFields: React.FC<InvoiceFieldsProps> = ({ form }) => {
  const {
    register,
    watch,
    setValue,
    clearErrors,
    formState: { errors, dirtyFields },
  } = form;

  const wantsInvoice = watch('wantsInvoice');
  const tone = (field: 'documentType' | 'documentNumber') =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  /**
   * Al desmarcar se suelta el número escrito. No basta con dejar de enviarlo: un
   * documento de identidad que ya no se pide tampoco tiene por qué seguir en
   * memoria, y si se vuelve a marcar la casilla el campo debe estar limpio.
   */
  const onToggle = (checked: boolean) => {
    if (checked) return;
    setValue('documentNumber', '', { shouldDirty: false });
    clearErrors('documentNumber');
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          {...register('wantsInvoice', {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => onToggle(event.target.checked),
          })}
          className="mt-0.5 size-4 shrink-0 accent-wine cursor-pointer"
        />
        <span className="text-sm text-on-surface-variant">
          ¿Requieres factura a tu nombre o de tu empresa?
        </span>
      </label>

      {wantsInvoice && (
        <>
          {/*
            Tipo y número van en la misma fila: son un solo dato partido en dos, y
            separarlos haría que el paso pareciera más largo de lo que es. El tipo
            viene preseleccionado en cédula, así que para casi todo el mundo esto
            es un campo, no dos.
          */}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
            <div>
              <label className={LABEL} htmlFor="buy-document-type">
                Tipo de documento
              </label>
              <DocumentTypeSelect
                id="buy-document-type"
                tone={tone('documentType')}
                field={register('documentType')}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="buy-document-number">
                Número de documento
              </label>
              {/*
                `inputMode` y no `type="number"`: un number corta los ceros a la
                izquierda, no admite las letras del pasaporte y en escritorio pinta
                unas flechas que aquí no significan nada. Lo que se quiere es el
                teclado numérico del móvil.
              */}
              <input
                id="buy-document-number"
                {...register('documentNumber')}
                inputMode="numeric"
                maxLength={20}
                autoComplete="off"
                placeholder="1098765432"
                aria-invalid={Boolean(errors.documentNumber)}
                aria-describedby={errors.documentNumber ? 'buy-document-number-error' : undefined}
                className={fieldClass(tone('documentNumber'))}
              />
            </div>
          </div>
          <FieldError id="buy-document-number-error" message={errors.documentNumber?.message} />

          <p className={HINT}>
            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
            Lo necesitamos para emitir la factura electrónica ante la DIAN.
          </p>
        </>
      )}
    </div>
  );
};
