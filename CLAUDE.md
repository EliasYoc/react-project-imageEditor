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
- **Elige versiones publicadas hace al menos 2 semanas** y fíjalas con `--save-exact`.
- Estos comandos además piden confirmación por configuración (`.claude/settings.local.json`).

## 4. Las PR son del dueño

- **Trabaja solo con commits locales** en una rama por tarea. **Nunca hagas push** ni abras, edites o fusiones PR.
- **Al terminar,** deja el texto de la PR en un archivo para que el dueño la abra.
- **Cada commit** debe compilar y pasar `npm run check` por sí solo.
