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

- **Trabaja solo con commits locales.** **No crees ramas:** haz los commits en la rama en la que esté el repositorio (normalmente `dev`), actualizada antes de empezar. **Nunca hagas push** ni abras, edites o fusiones PR.
- **Al terminar,** deja el texto de la PR en un archivo para que el dueño la abra.
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
- **Nunca crees subcarpetas vacías:** una subcarpeta existe solo si tiene algún archivo.
- **Los tests de la feature** van en su raíz; un test unitario va junto al archivo que prueba.
- **Cada feature tiene un `index.ts`** que reexporta solo lo que usa el resto de la app. Desde fuera de la feature se importa siempre ese `index.ts`, nunca un archivo interno. Dentro de la feature, los archivos se importan entre sí con rutas relativas, sin pasar por su propio `index.ts`.
- El `index.ts` solo reexporta; no pongas código en él (en `vite.config.js` está marcado sin efectos secundarios para que no arrastre el editor al bundle del inicio).

## 7. Modelo para un refactor

El modelo de la conversación lo elige el dueño (`/model`). Antes de empezar un refactor, Claude le recuerda cuál conviene:

- **Pequeño o mecánico** (renombrar, mover archivos, sacar una función repetida, ordenar imports): **Sonnet** con esfuerzo _medium_.
- **Mediano** (reorganizar una feature, cambiar cómo se comunica un componente con el store): **Sonnet** con esfuerzo _high_, u **Opus** si toca código delicado (el lienzo, los pinceles, la exportación).
- **Grande o de arquitectura** (el store, el motor de pinceles, una versión mayor de TypeScript): **Opus** con esfuerzo _high_ para el plan. Después, con el plan aprobado, se hace `/clear`, se cambia a **Sonnet** y se ejecuta el plan paso a paso (queda guardado en un archivo).

Un refactor no cambia lo que hace la app: lo vigilan los tests que ya existen y normalmente no necesita tests nuevos.
