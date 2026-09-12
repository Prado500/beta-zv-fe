import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutInput, CheckoutValues } from '../../../hooks/useCheckoutFlow';
import { DocumentTypeSelect } from '../../../../../components/ui/DocumentTypeSelect';
import { FieldError } from '../../../../../components/ui/FieldError';
import { fieldClass, fieldTone, HINT, LABEL } from '../../../../../components/ui/formStyles';

/**
 * Paso 1: quién es legalmente y a dónde le escribimos.
 *
 * El nombre y el documento son la misma idea partida en dos, así que van juntos: la
 * factura electrónica que exige la DIAN necesita las dos cosas. El correo es lo otro,
 * porque es por donde llega la carta.
 *
 * Pinta y devuelve eventos, nada más. Ni valida ni decide cuándo se avanza: eso
 * lo resuelve `useCheckoutFlow`, que es quien sabe qué campos tiene este paso.
 *
 * El enlace de "¿Ya tienes cuenta?" va aquí y solo aquí, a la vista desde el
 * primer segundo: la detección silenciosa de "este correo ya existe" al escribir
 * pasa desapercibida cuando hay más campos que mirar. Un recurrente tiene que
 * poder salir de este formulario antes de rellenar nada.
 */

interface AccountStepProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
  onNext: () => void;
  onSwitchToLogin: () => void;
}

export const AccountStep: React.FC<AccountStepProps> = ({ form, onNext, onSwitchToLogin }) => {
  const {
    register,
    formState: { errors, dirtyFields },
  } = form;

  const tone = (field: 'name' | 'email' | 'documentType' | 'documentNumber') =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  return (
    // Enter avanza igual que el botón: en un formulario de dos campos, obligar
    // al ratón para pasar de paso es fricción gratuita.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <div>
        <label className={LABEL} htmlFor="buy-name">
          Tu nombre
        </label>
        <input
          id="buy-name"
          {...register('name')}
          maxLength={120}
          autoComplete="name"
          placeholder="Sebastián"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'buy-name-error' : undefined}
          className={fieldClass(tone('name'))}
        />
        <FieldError id="buy-name-error" message={errors.name?.message} />
        {/*
          La etiqueta sigue siendo "Tu nombre" a propósito: la aclaración va aquí
          debajo y no en el `label`, que es lo que la gente ya reconoce.
        */}
        <p className={HINT}>
          <span className="material-symbols-outlined text-[15px]">badge</span>
          Escríbelo como aparece en tu documento.
        </p>
      </div>

      {/*
        Tipo y número van en la misma fila: son un solo dato partido en dos, y
        separarlos en dos bloques haría que el paso pareciera más largo de lo que es.
        El tipo viene preseleccionado en cédula, así que para casi todo el mundo esto
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
            `inputMode` y no `type="number"`: un number corta los ceros a la izquierda,
            no admite las letras del pasaporte y en escritorio pinta unas flechas que
            aquí no significan nada. Lo que se quiere es el teclado numérico del móvil.
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

      <div>
        <label className={LABEL} htmlFor="buy-email">
          Tu correo
        </label>
        <input
          id="buy-email"
          type="email"
          {...register('email')}
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'buy-email-error' : undefined}
          className={fieldClass(tone('email'))}
        />
        <FieldError id="buy-email-error" message={errors.email?.message} />
        <p className={HINT}>
          <span className="material-symbols-outlined text-[15px]">mail</span>
          Aquí te llegará el enlace de tu carta cuando esté lista.
        </p>
      </div>

      <button
        type="submit"
        className="mt-1 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        Siguiente
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>

      <p className="text-sm text-on-surface-variant text-center">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-wine underline underline-offset-4 decoration-wine/40 hover:text-primary hover:decoration-primary transition-colors cursor-pointer"
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
};
