# Reglas de trabajo en este proyecto

Estas reglas las decidió el dueño del proyecto y están por encima de cualquier costumbre por defecto. Si una tarea choca con ellas, pregunta antes de seguir.

## 1. La interfaz que ya ha sido creada antes no se cambia sin permiso

- **No cambies el aspecto ni el comportamiento visible de la UI** a menos que tú lo propongas y el dueño lo apruebe de forma explícita. Esto incluye:
  - diseño, colores, tamaños, iconos y animaciones o transiciones;
  - la posición de los controles;
  - añadir, quitar, juntar o separar controles (p. ej. un segundo slider);
  - cambiar textos visibles.
- **Al migrar un componente** a otra librería o a TypeScript, conserva su aspecto y su comportamiento. Antes de reescribirlo, lee su CSS y su código anteriores en el historial de git (`git show <commit>:<ruta>`) y reprodúcelos.
- **Las mejoras que no se ven** (accesibilidad, teclado, ARIA, foco, rendimiento) se pueden hacer, pero hay que mencionarlas en el plan o en el resumen.
- **Si un cambio visual te parece buena idea,** propónlo: qué cambiaría y por qué, con una captura o un boceto si ayuda. Espera la respuesta antes de hacerlo.

## 2. Primero las bibliotecas instaladas

Antes de escribir código propio en JavaScript o TypeScript para resolver algo, revisa si una dependencia ya instalada lo resuelve, y úsala:

| Necesidad                                                                                                | Biblioteca instalada    |
| -------------------------------------------------------------------------------------------------------- | ----------------------- |
| Diálogos, paneles, menús, popovers, sliders, tooltips, toggles, avisos (toasts) y otras primitivas de UI | `radix-ui`              |
| Iconos (los que falten, con `createLucideIcon`)                                                          | `lucide-react`          |
| Selectores de color                                                                                      | `react-colorful`        |
| Lienzo, nodos, transformaciones y exportación de elementos                                               | `konva` + `react-konva` |
| Trazos de tinta                                                                                          | `perfect-freehand`      |
| Abrir, leer y exportar video (decodificar y codificar con WebCodecs)                                     | `mediabunny`            |
| Animaciones Lottie (stickers `.json` y `.tgs`), solo con `build/player/lottie_light_canvas` (sin `eval`) | `lottie-web`            |
| Estado global                                                                                            | `zustand`               |
| Fuentes                                                                                                  | `@fontsource/*`         |

Si ninguna lo cubre:

- **Recomienda** una o dos bibliotecas, con lo que aportan, su tamaño aproximado en gzip, su mantenimiento y su licencia.
- **Di si de verdad hace falta instalarla** o si basta con unas pocas líneas propias, y por qué.
- **Deja que el dueño decida.**

## 3. Nada de instalar paquetes sin preguntar

- **No ejecutes** `npm install`, `npm i`, `npm uninstall`, `npm update`, `npm ci` ni nada que añada, quite o actualice dependencias **sin preguntar antes**. Al preguntar, di:
  - qué paquete y qué versión;
  - para qué sirve;
  - su peso aproximado;
  - si hay una alternativa sin instalar nada.
- **Si el dueño ya autorizó la instalación**, ejecuta el comando de npm sin volver a preguntar. El permiso vale solo para ese paquete y esa versión: otro paquete, otra versión o desinstalar algo se pregunta de nuevo.
- **Elige versiones publicadas hace al menos 2 semanas** y fíjalas con `--save-exact`.
- Estos comandos además piden confirmación por configuración (`.claude/settings.local.json`).

## 4. Las PR son del dueño

- **Antes de cambiar nada, mira en qué rama estás** (`git branch --show-current`), al empezar cada tarea y no solo la primera vez. Si es `main` o `dev`, **no avances**: no edites archivos ni hagas commits. Recuérdale al dueño que sigue en esa rama y que necesita una rama de trabajo (por ejemplo `git switch -c feat/nombre`), y espera a que la cree. Leer código y responder preguntas sí se puede.
- **Las ramas las crea el dueño, no tú.** Cuando esté en una rama que no sea `main` ni `dev`, haz los commits en ella.
- **Trabaja solo con commits locales.** **Nunca hagas push** ni abras, edites o fusiones PR.
- **Al terminar,** deja el texto de la PR en `.pr/<rama>.md` (p. ej. `.pr/fix-ui-behavior.md`) para que el dueño la abra. La carpeta `.pr/` está en `.gitignore`: esos archivos nunca van en un commit ni en la raíz del proyecto.
- **Cada commit** debe compilar y pasar `npm run check` por sí solo.
- **Un commit por tarea.** Si el dueño pide varias tareas a la vez (p. ej. una lista numerada), cada una va en su propio commit y en ese orden, **aunque toquen los mismos archivos**. Así se pueden revisar y revertir por separado.
  - **Cuándo hacer el commit:** al terminar una tarea y comprobarla (`npm run check`, y los e2e si cambia algo que prueban), **antes de empezar la siguiente**.
  - **Qué va en él:** el código de la tarea, sus tests y su documentación (README, comentarios). Si al hacerla aparece un arreglo que no tiene que ver con ella, va en un commit aparte.
  - **Qué tests, y cuántos** (para no gastar de más el límite de uso de Claude):
    - **Siempre** se ejecutan los que ya existen: `npm run check` y los e2e de lo que cambia.
    - **Con la tarea, pocos tests nuevos:** los de la lógica con riesgo (cálculos, el store, lo que pueda perder datos) y uno o dos e2e del camino principal.
    - **El resto de casos** (bordes, variantes de móvil, mensajes de error…) se apuntan en `TESTS-PENDIENTES.md`, con la tarea a la que pertenecen, para escribirlos cuando el dueño lo pida. Al escribir uno, se quita de la lista.
    - **Quién los escribe:** si son varios (una feature grande, o los de `TESTS-PENDIENTES.md`), se encargan a un subagente con **Sonnet**, que gasta menos; Claude le explica qué probar y revisa lo que escribe. Dos o tres tests los escribe Claude directamente: explicárselos a un subagente costaría más.
  - **Cambios que el dueño pida después** sobre una tarea ya hecha van en un commit nuevo; no se reescribe un commit que ya existe (nada de `--amend` ni de rebase) salvo que él lo pida.

## 5. Pendientes

- **Las mejoras pendientes están en `PENDIENTES.md`.** No se empieza ninguna sin permiso del dueño.
- Cuando salga un tema relacionado (hosting, dependencias…), recuérdale el punto que toca.
- Si algo es **urgente** (una vulnerabilidad en dependencias de producción, un fallo que rompe la app), avísale enseguida.
- Al terminar un punto, quítalo de `PENDIENTES.md` en la misma PR.

## 6. Estructura de `src/features`

- **Cada feature agrupa su código por tipo** en subcarpetas: `components/` (con sus `.module.css`), `hooks/`, `utils/`, `constants/` y, si algún día hace falta, `stores/`.
- **Si una feature tiene varios componentes, cada uno va en su propia carpeta** dentro de `components/` (`components/TextToolbar/TextToolbar.tsx`), con su `.module.css` y, si algún día los tiene, sus archivos propios. Esa carpeta no lleva `index.ts` (ver más abajo). Cada `.module.css` es de un solo componente: no compartas un CSS entre varios. Si una feature tiene un solo componente, queda suelto en `components/`.
- **Nunca crees subcarpetas vacías:** una subcarpeta existe solo si tiene algún archivo.
- **Los tests de la feature** van en su raíz; un test unitario va junto al archivo que prueba.
- **Cada feature tiene un `index.ts`** que reexporta solo lo que usa el resto de la app. Desde fuera de la feature se importa siempre ese `index.ts`, nunca un archivo interno. Dentro de la feature, los archivos se importan entre sí con rutas relativas, sin pasar por su propio `index.ts`.
- El `index.ts` solo reexporta; no pongas código en él (en `vite.config.js` está marcado sin efectos secundarios para que no arrastre el editor al bundle del inicio).

## 7. Refactor

El objetivo de un refactor es que el código quede **organizado y fácil de entender para un desarrollador**.

- **Antes de empezar, propón.** Explica qué cambiarías y por qué, con sus ventajas e inconvenientes, y espera la respuesta del dueño.
- **Si una biblioteca lo resuelve mejor**, sugiérela en esa propuesta: que mejore el rendimiento, simplifique el código o resuelva algo que JavaScript o TypeScript no resuelven bien. Instalarla sigue las reglas 2 y 3: di qué aporta, su peso, su mantenimiento y su licencia, y no la instales sin permiso.
- **Legible antes que corto.** Si un código más largo se entiende mejor que uno corto y difícil de leer, usa el largo (ver la regla 9).
- **Al terminar, evalúa el resultado.** Di si el cambio fue una buena opción o no, qué mejoró, qué no y qué harías después: tus conclusiones, con sinceridad.

### Modelo para un refactor

El modelo de la conversación lo elige el dueño (`/model`). Antes de empezar un refactor, Claude le recuerda cuál conviene:

- **Pequeño o mecánico** (renombrar, mover archivos, sacar una función repetida, ordenar imports): **Sonnet** con esfuerzo _medium_.
- **Mediano** (reorganizar una feature, cambiar cómo se comunica un componente con el store): **Sonnet** con esfuerzo _high_, u **Opus** si toca código delicado (el lienzo, los pinceles, la exportación).
- **Grande o de arquitectura** (el store, el motor de pinceles, una versión mayor de TypeScript): **Opus** con esfuerzo _high_ para el plan. Para ejecutarlo se sigue lo mismo que en una tarea grande (regla 8): Opus si toca código delicado; si no, `/clear` y **Sonnet**, paso a paso desde el archivo del plan.

Un refactor no cambia lo que hace la app: lo vigilan los tests que ya existen y normalmente no necesita tests nuevos.

## 8. Modelo y esfuerzo para cualquier tarea

El modelo de la conversación lo elige el dueño (`/model`). Cuando pida un cambio (arreglar un error, una feature, un ajuste), Claude le recomienda **antes de empezar** qué modelo y qué esfuerzo convienen, con una frase de por qué. Para los refactors se sigue la regla 7.

- **Pequeño** (un texto, un estilo, un error ya localizado): **Sonnet** con esfuerzo _medium_.
- **Mediano** (una feature acotada, un error que hay que investigar): **Sonnet** con esfuerzo _high_, u **Opus** si toca código delicado (el lienzo, los pinceles, la exportación, el video).
- **Grande** (una feature que cruza varias partes de la app): **Opus** con esfuerzo _high_ para el plan, que queda guardado en un archivo. Con el plan aprobado, se ejecuta paso a paso:
  - **Si toca código delicado** (el lienzo, los pinceles, la exportación, el video), lo ejecuta también **Opus**: ahí los errores son sutiles, y encontrarlos y corregirlos pide pensar más.
  - **Si es mecánico**, se hace `/clear`, se cambia a **Sonnet** y se ejecuta desde el archivo.
  - Un plan puede mezclar los dos: los pasos delicados con Opus y los mecánicos con Sonnet.
  - No hace falta `/clear` si la conversación ya tiene leídos los archivos de los pasos que quedan: volver a leerlos también gasta.

Si el modelo actual ya es el adecuado, basta con decirlo y seguir. Si no lo es, Claude espera a que el dueño cambie de modelo o le diga que siga con el actual.

## 9. Código nuevo: buenas prácticas

Estas pautas valen al escribir código nuevo y al tocar el existente. En un refactor se siguen junto con la regla 7.

- **Un dato, un solo sitio.** Si un texto, un tamaño o una condición aparece en dos lugares, déjalo en uno (una constante o una tabla en `constants/`, un selector en `selectors.ts`) y úsalo desde ahí. Con `Record<Tipo, …>` el compilador avisa si falta un caso.
- **No guardes lo que se puede calcular.** Si un valor sale de otro (por ejemplo, la pestaña a partir del relleno), calcúlalo al usarlo en vez de guardarlo en otro estado que haya que mantener igual.
- **Comprobar en la entrada, no en cada paso.** Valida lo que viene de fuera (archivos, medidas, datos guardados) una sola vez, donde entra. Después, confía en los tipos. Los errores que ve el usuario llevan un mensaje claro; los demás se dejan fallar a la vista, no se tragan en silencio.
- **Nombres que se explican solos.** Funciones con verbo (`openImageFile`), booleanos con `is`/`has`/`can`, y sin abreviaturas raras. Si hace falta un comentario para entender un nombre, cambia el nombre.
- **Comentarios solo donde el código es difícil de entender.** Explican el porqué (un límite, un navegador, una decisión), no lo que ya dice el código. Se escriben en español.
- **Funciones pequeñas y con una sola tarea.** Si una función hace varias cosas seguidas, sepárala en pasos con nombre. Sin código muerto, sin `console.log` de depuración y sin `any` (si hace falta uno, explica por qué en un comentario).
- **Lo que se puede romper se prueba.** Cálculos, el store y todo lo que pueda perder datos llevan test (ver la regla 4 sobre cuántos). Lo demás se apunta en `TESTS-PENDIENTES.md`.
- **Al terminar, di qué dudas quedan.** Si dejas una decisión a medias, una medida sin verificar o un atajo, lo cuentas en el resumen en vez de darlo por cerrado.
