import { useCallback, useEffect, useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '../../../utils/api';
import { describeError } from '../../../utils/apiErrors';
import { redirectTo } from '../../../utils/navigation';
import { email, personName } from '../../../utils/validation';
import { useSignOut } from '../../auth/hooks/useSignOut';
import { WRONG_CREDENTIALS } from '../../auth/hooks/useLogin';
import {
  login,
  MAX_PASSWORD,
  MIN_PASSWORD,
  register,
  type UserResponse,
} from '../../auth/services/auth';
import { useAuth } from '../../auth/useAuth';
import {
  DEFAULT_DOCUMENT_TYPE,
  DOCUMENT_TYPE_CODES,
  documentNumberProblem,
} from '../../legal/documentTypes';
import { useLegalTerms } from '../../legal/hooks/useLegalTerms';
import { createPurchase, newIdempotencyKey } from '../services/checkout';
import { rememberPurchaseId } from '../services/purchaseSession';

/**
 * ViewModel de la compra: cuenta o sesión, intención de pago y salida hacia
 * Mercado Pago.
 *
 * El modal solo pinta; toda la secuencia de los IOPS #1 y #2 vive aquí, de modo
 * que se puede probar sin montar un solo `div` y el JSX no tiene que saber que
 * existe una API. El paso en el que está el asistente también es asunto de aquí:
 * es estado del flujo, no decoración de la vista.
 *
 * **Tres puertas, una sola salida.** Quien llega sin cuenta se registra (tres
 * tramos, con el correo confirmado en medio). Quien ya la tiene entra con correo
 * y contraseña, y nada más. Quien ya está dentro no ve ningún formulario: el
 * paso exprés crea la compra en cuanto se abre el modal. Los tres caminos
 * desembocan en `purchase`, que es el único sitio que habla con la pasarela.
 *
 * La pasarela es real: no se simula ningún pago. Este hook llega hasta la puerta
 * —guarda el identificador de la compra y manda el navegador al `checkoutUrl`—
 * y la confirmación ocurre a la vuelta, en `/pago/retorno`, contra el servidor.
 * Aquí no se marca nada como pagado: el navegador no tiene autoridad para eso.
 *
 * Con `intent: 'signin'` el flujo termina al abrir la sesión y avisa con
 * `onSignedIn`: es el "Iniciar sesión" de la cabecera, que no quiere comprar.
 */

/**
 * Contraseña del alta: entre 4 y 10 caracteres y nada más.
 *
 * Se extrae del objeto porque el `refine` de abajo la vuelve a necesitar para
 * decidir si toca comparar; escrita dos veces, las dos reglas divergirían.
 */
const passwordRule = z
  .string()
  .min(MIN_PASSWORD, `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`)
  .max(MAX_PASSWORD, `La contraseña no puede pasar de ${MAX_PASSWORD} caracteres.`);

const registerSchema = z
  .object({
    mode: z.literal('register'),
    name: personName('Tu nombre', 120),
    email: email(),
    password: passwordRule,
    confirmPassword: z.string(),
    documentType: z.enum(DOCUMENT_TYPE_CODES, { error: 'Elige tu tipo de documento.' }),
    documentNumber: z.string().trim().min(1, 'El número de documento es obligatorio.'),
    /**
     * No basta con que el campo exista: tiene que estar marcado. La Ley 1581 exige
     * autorización expresa, y una casilla sin marcar no lo es.
     *
     * Es `boolean().refine(...)` y no `literal(true)` **a propósito**. `literal` emite
     * un issue `invalid_value`, que Zod 4 trata como NO continuable: aborta todos los
     * refinamientos de objeto posteriores. Y como esta casilla nace en `false` y sigue
     * así durante todo el primer paso, el aviso del formato del documento —que vive en
     * el `superRefine` de abajo— no llegaría a ejecutarse jamás. Comprobado contra la
     * versión instalada de zod; hay una prueba que lo fija.
     */
    acceptsTerms: z.boolean().refine((accepted) => accepted, {
      error: 'Necesitamos tu autorización para crear la cuenta.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: 'Las dos contraseñas no coinciden.',
    // El aviso se pinta bajo el segundo campo, que es el que hay que arreglar.
    path: ['confirmPassword'],
    /**
     * Por defecto Zod se salta un `refine` de objeto si **cualquier** otro campo
     * trae error: un nombre inválido dejaría la comparación sin ejecutar y el
     * usuario no vería que sus contraseñas no coinciden. Acotándolo a la propia
     * contraseña, la comparación corre siempre que haya algo que comparar —y se
     * calla mientras aún no llega a los 4 caracteres, que es el orden correcto
     * en el que deben aparecer los mensajes.
     */
    when: (payload) => z.object({ password: passwordRule }).safeParse(payload.value).success,
  })
  /**
   * El formato del número depende del tipo: una cédula solo lleva dígitos, un
   * pasaporte también letras. Va en un refinamiento de objeto porque necesita los
   * dos campos a la vez; el mensaje se pinta bajo el número, que es el que se
   * corrige.
   */
  .superRefine((values, ctx) => {
    // Zod 4 ejecuta este refinamiento aunque otros campos hayan fallado, así que sin
    // esta guarda un número vacío sacaría dos avisos a la vez: "es obligatorio" y
    // "solo admite dígitos". Manda el primero, que es el que se puede arreglar.
    if (!values.documentNumber) return;
    const problem = documentNumberProblem(values.documentType, values.documentNumber);
    if (problem) {
      ctx.addIssue({ code: 'custom', message: problem, path: ['documentNumber'] });
    }
  });

/**
 * Al entrar no se decide cómo debe ser una contraseña, solo que haya una: el
 * servidor acepta hasta 128 y rechazar aquí una que él sí aceptaría dejaría
 * fuera a quien la creó con otra regla.
 */
const loginSchema = z.object({
  mode: z.literal('login'),
  email: email(),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

/**
 * Un solo esquema con dos ramas, elegidas por `mode`. Así el formulario es uno
 * —el correo escrito en un modo sigue puesto en el otro— y cada rama valida solo
 * sus campos: en modo login, un nombre vacío no es un error.
 */
export const checkoutSchema = z.discriminatedUnion('mode', [registerSchema, loginSchema]);

export type CheckoutMode = 'register' | 'login';

/** Lo que hay en los inputs: todos los campos, siempre. La rama decide cuáles cuentan. */
export interface CheckoutInput {
  mode: CheckoutMode;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  documentType: string;
  documentNumber: string;
  acceptsTerms: boolean;
}

export type CheckoutValues = z.output<typeof checkoutSchema>;

/** Para qué se abrió el modal: comprar, o solo entrar (cabecera). */
export type CheckoutIntent = 'checkout' | 'signin';

/**
 * `authenticating` habla con `/auth`; `creating` con `/purchases`; `redirecting`
 * ya no vuelve: el navegador se va.
 */
export type CheckoutStatus = 'idle' | 'authenticating' | 'creating' | 'redirecting';

/**
 * Los tramos del alta, más la entrada y el paso exprés.
 *
 * `confirm-email` no es un paso decorativo: es un freno. El correo es lo único
 * del formulario que no se puede arreglar después —ahí llega el enlace de la
 * carta— y una errata no da ningún síntoma hasta que ya es tarde.
 *
 * `login` es un solo tramo: quien vuelve no necesita freno, su correo ya está
 * en nuestra base de datos. `express` no tiene formulario: hay sesión, se compra.
 */
export type CheckoutStep = 'account' | 'confirm-email' | 'password' | 'login' | 'express';

/** Campos que deben estar sanos para salir de cada tramo del alta. */
const STEP_FIELDS = {
  account: ['name', 'documentType', 'documentNumber', 'email'],
  'confirm-email': ['email'],
} as const satisfies Partial<Record<CheckoutStep, readonly (keyof CheckoutInput)[]>>;

const EXISTING_ACCOUNT = 'Este correo ya tiene cuenta. Entra con tu contraseña para continuar.';

const SESSION_EXPIRED = 'Tu sesión caducó. Entra de nuevo y seguimos con tu compra.';

const NO_GATEWAY =
  'La pasarela de pago no está disponible ahora mismo. Vuelve a intentarlo en un momento.';

const DEFAULTS: CheckoutInput = {
  mode: 'register',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  documentType: DEFAULT_DOCUMENT_TYPE,
  documentNumber: '',
  // Nunca nace marcada: una casilla premarcada no es consentimiento válido.
  acceptsTerms: false,
};

const modeOf = (step: CheckoutStep): CheckoutMode => (step === 'login' ? 'login' : 'register');

export interface CheckoutOptions {
  intent: CheckoutIntent;
  /** Solo con `intent: 'signin'`: la sesión ya está abierta y no hay nada más que hacer. */
  onSignedIn?: () => void;
}

export const useCheckoutFlow = ({ intent, onSignedIn }: CheckoutOptions) => {
  const auth = useAuth();

  // El punto de partida se decide una vez, al abrir. Quien solo quiere entrar
  // va directo a la entrada; quien quiere comprar y ya está dentro, al exprés.
  // Si la sesión resulta no existir, el flujo lo descubrirá con el 401 y
  // cambiará de paso él mismo.
  const [step, setStep] = useState<CheckoutStep>(() => {
    if (intent === 'signin') return 'login';
    return auth.status === 'authenticated' ? 'express' : 'account';
  });
  // El exprés nace ya "creando": si empezara en reposo, el botón de reintentar
  // parpadearía un instante antes de que el efecto arranque la compra.
  const [status, setStatus] = useState<CheckoutStatus>(step === 'express' ? 'creating' : 'idle');

  const form = useForm<CheckoutInput, unknown, CheckoutValues>({
    /**
     * El resolver infiere como entrada la unión de las dos ramas, y para una
     * unión `react-hook-form` solo admite en `trigger` los nombres comunes a
     * ambas: `name` dejaría de ser un campo válido. Los inputs, en cambio, son
     * siempre los cinco (`CheckoutInput`); la rama solo decide cuáles cuentan.
     * El molde declara esa forma plana, que es la que de verdad llega al resolver.
     */
    resolver: zodResolver(checkoutSchema) as unknown as Resolver<
      CheckoutInput,
      unknown,
      CheckoutValues
    >,
    // Fail-fast: el veredicto se actualiza en cada tecla, no al enviar.
    mode: 'onChange',
    // La rama del esquema arranca a juego con el paso inicial.
    defaultValues: { ...DEFAULTS, mode: modeOf(step) },
  });
  /** Fallo: en rojo, con `role="alert"`. */
  const [error, setError] = useState<string | null>(null);
  /** Aviso que explica un cambio de paso ("ya tienes cuenta", "caducó tu sesión"). */
  const [notice, setNotice] = useState<string | null>(null);
  /** Misma clave mientras dure el intento: dos clics no crean dos compras. */
  const idempotencyKey = useRef<string>(newIdempotencyKey());
  /**
   * Cerrojo síncrono. `busy` llega un render tarde y dos clics rápidos caben en
   * ese hueco: sin esto saldrían dos peticiones por una sola intención.
   */
  const inFlight = useRef(false);
  // Se piden al llegar al paso de la contraseña: ahí es donde se muestran y donde se
  // envía su versión. Pedirlos al abrir el modal gastaría una petición por cada
  // persona que ni llega a ese paso.
  const terms = useLegalTerms(step === 'password');

  /** Cambia de tramo y deja el esquema en la rama que toca. */
  const go = useCallback(
    (target: CheckoutStep) => {
      form.setValue('mode', modeOf(target));
      setStep(target);
    },
    [form],
  );

  /**
   * Vacía las contraseñas y su rastro. Se llama al cambiar de modo: lo tecleado
   * como contraseña nueva no debe aparecer puesto en el campo de la vieja, ni
   * dejar el campo pintado en verde sin haber escrito nada.
   */
  const forgetPasswords = useCallback(() => {
    form.setValue('password', '', { shouldDirty: true });
    form.setValue('confirmPassword', '', { shouldDirty: true });
    form.clearErrors(['password', 'confirmPassword']);
  }, [form]);

  const guarded = useCallback(async (work: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await work();
    } finally {
      inFlight.current = false;
    }
  }, []);

  /**
   * La única salida: crea la compra y manda el navegador a Mercado Pago.
   *
   * Un 401 aquí no es un fallo, es información: la sesión que creíamos tener
   * (por `/me`, o por haber entrado hace un rato) caducó. Se pide entrar de
   * nuevo en el sitio, con el correo ya puesto, y la compra se retoma con la
   * misma clave de idempotencia. Mandar a la persona "a la página principal"
   * sería tirar el intento por un detalle de infraestructura.
   */
  const purchase = useCallback(async () => {
    setStatus('creating');
    setError(null);
    try {
      const purchase = await createPurchase(idempotencyKey.current);

      // Sin `checkoutUrl` no hay a dónde ir. Antes de esta línea existía un botón
      // que simulaba el pago; mandar al usuario a una pantalla falsa de éxito es
      // peor que decirle que la pasarela está caída.
      if (!purchase.checkoutUrl) {
        throw new ApiError(503, 'CHECKOUT_UNAVAILABLE', NO_GATEWAY);
      }

      // Se apunta ANTES de salir: al volver de Mercado Pago esta pestaña habrá
      // perdido todo su estado y este identificador es lo único que queda.
      rememberPurchaseId(purchase.id);
      setStatus('redirecting');
      redirectTo(purchase.checkoutUrl);
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 401) {
        const known = auth.user?.email ?? form.getValues('email');
        auth.clear();
        form.setValue('email', known, { shouldDirty: true, shouldValidate: true });
        forgetPasswords();
        setNotice(SESSION_EXPIRED);
        go('login');
      } else {
        setError(
          describeError(problem, {
            // El 503 genérico ("el servicio no está disponible") no le dice a la
            // persona qué pasó; este sí, y es nuestro, no del backend.
            CHECKOUT_UNAVAILABLE: NO_GATEWAY,
          }),
        );
      }
      // Se devuelve el control: el botón vuelve a estar vivo para reintentar.
      setStatus('idle');
    }
  }, [auth, form, forgetPasswords, go]);

  /** Sesión abierta: se publica y se sigue hacia donde se venía. */
  const afterSession = useCallback(
    async (user: UserResponse) => {
      auth.setUser(user);
      if (intent === 'signin') {
        setStatus('idle');
        onSignedIn?.();
        return;
      }
      await purchase();
    },
    [auth, intent, onSignedIn, purchase],
  );

  const runRegister = (values: Extract<CheckoutValues, { mode: 'register' }>) =>
    guarded(async () => {
      setStatus('authenticating');
      setError(null);
      setNotice(null);

      // Si la cuenta ya existía, un fallo posterior de sesión significa "otra
      // contraseña", no "no pudimos registrarte". Sin este dato el mensaje mentiría.
      let accountExisted = false;

      try {
        try {
          // Se arma el alta campo a campo en vez de reenviar `values`: el backend
          // declara `extra="forbid"` y `confirmPassword` —que nunca fue suyo, solo
          // sirvió para cazar la errata— tumbaría la petición con un 422.
          await register({
            name: values.name,
            email: values.email,
            password: values.password,
            documentType: values.documentType,
            documentNumber: values.documentNumber,
            acceptedTermsVersion: terms.terms?.version ?? '',
          });
        } catch (problem) {
          // Solo el correo repetido significa "ya tienes cuenta". El conflicto de
          // documento (REGISTRATION_CONFLICT) es otra cosa: mandar ahí a iniciar
          // sesión dejaría a la persona intentando entrar en una cuenta ajena.
          if (
            !(problem instanceof ApiError) ||
            problem.status !== 409 ||
            problem.code !== 'EMAIL_IN_USE'
          ) {
            throw problem;
          }
          accountExisted = true;
        }

        let user: UserResponse;
        try {
          user = await login(values.email, values.password);
        } catch (problem) {
          if (accountExisted && problem instanceof ApiError && problem.status === 401) {
            // Cuenta previa y contraseña distinta: no es un error, es la persona
            // equivocada de puerta. Se le abre la suya con el correo ya puesto.
            forgetPasswords();
            setNotice(EXISTING_ACCOUNT);
            go('login');
            setStatus('idle');
            return;
          }
          throw problem;
        }

        await afterSession(user);
      } catch (problem) {
        setError(describeError(problem));
        setStatus('idle');
      }
    });

  const runLogin = (values: Extract<CheckoutValues, { mode: 'login' }>) =>
    guarded(async () => {
      setStatus('authenticating');
      setError(null);
      setNotice(null);
      try {
        const user = await login(values.email, values.password);
        await afterSession(user);
      } catch (problem) {
        setError(
          describeError(problem, {
            INVALID_CREDENTIALS: WRONG_CREDENTIALS,
            '401': WRONG_CREDENTIALS,
          }),
        );
        setStatus('idle');
      }
    });

  /**
   * Avanza solo si lo escrito en este paso aguanta la validación.
   *
   * `trigger` con la lista de campos del paso valida **esos** y devuelve el
   * veredicto; validar el formulario entero pintaría en rojo campos que la
   * persona todavía no ha visto.
   */
  const advance = useCallback(
    async (from: keyof typeof STEP_FIELDS, to: CheckoutStep) => {
      if (await form.trigger(STEP_FIELDS[from])) go(to);
    },
    [form, go],
  );

  const next = useCallback(() => advance('account', 'confirm-email'), [advance]);

  /**
   * El correo se vuelve a validar aquí porque en la pantalla de confirmación es
   * editable: se entra con uno bueno y se puede salir con uno roto.
   */
  const confirmEmail = useCallback(() => advance('confirm-email', 'password'), [advance]);

  const back = useCallback(() => {
    setError(null);
    setStep((current) => (current === 'password' ? 'confirm-email' : 'account'));
  }, []);

  /**
   * El enlace "¿Ya tienes cuenta?" / "¿Primera vez?". El correo se queda; las
   * contraseñas y los avisos, no: son del modo que se abandona.
   */
  const switchMode = useCallback(
    (target: CheckoutMode) => {
      setError(null);
      setNotice(null);
      forgetPasswords();
      form.clearErrors();
      go(target === 'login' ? 'login' : 'account');
    },
    [form, forgetPasswords, go],
  );

  /**
   * `handleSubmit` se compone al pulsar, no al pintar: `run` mira la clave de
   * idempotencia, que vive en un ref, y leer un ref durante el render es
   * exactamente lo que hace que React no vuelva a pintar cuando debe.
   */
  const submit = (event: BaseSyntheticEvent) => {
    void form.handleSubmit((values) =>
      values.mode === 'login' ? runLogin(values) : runRegister(values),
    )(event);
  };

  /** Paso exprés tras un fallo: la misma compra, la misma clave. */
  const retry = () => void guarded(purchase);

  /**
   * "¿No eres tú?": la salida del dispositivo compartido. Se cierra la sesión
   * ajena y el modal vuelve a empezar, limpio, por el alta.
   */
  const session = useSignOut(
    useCallback(() => {
      form.reset(DEFAULTS);
      go('account');
    }, [form, go]),
  );

  const switchAccount = () => {
    setError(null);
    setNotice(null);
    void session.signOut();
  };

  // El paso exprés arranca solo: abrir el modal con sesión ya es la intención
  // de comprar. Solo al montar; el cerrojo cubre el doble efecto de StrictMode.
  useEffect(() => {
    if (step === 'express') void guarded(purchase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = status !== 'idle' || session.busy;

  return {
    form,
    step,
    mode: modeOf(step),
    intent,
    status,
    busy,
    error: error ?? session.error,
    notice,
    user: auth.user,
    next,
    confirmEmail,
    back,
    submit,
    switchMode,
    retry,
    switchAccount,
    terms,
  };
};
