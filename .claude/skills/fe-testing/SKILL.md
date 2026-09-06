# FRONTEND TESTING - THE RULE OF 10
1. Testing Trophy: Utiliza React Testing Library (RTL) y Vitest. No pruebes detalles de implementación (variables internas), prueba el comportamiento del usuario simulando eventos con `userEvent`.
2. Cobertura Implacable: Todo flujo crítico (Pagos, Eager Upload, Submisión de la Carta, Validaciones Fail-Fast) DEBE tener al menos 5 casos de prueba:
   a) Happy Path (Flujo ideal).
   b) Sad Path (Ej: Input inválido, correo mal formado).
   c) Edge Case 1 (Ej: Intentar enviar doble clic rápido - prevención de concurrencia).
   d) Edge Case 2 (Fallo simulado del backend con 409 o 500).
   e) UI/UX Verification (El modal de doble confirmación aparece y bloquea la petición hasta ser aceptado).