# Tests pendientes

Casos que se apuntan al hacer una tarea para escribirlos cuando el dueño lo
pida (regla 4 de `CLAUDE.md`). Al escribir uno, se quita de la lista.

## El selector de color del pincel ya no entra en bucle

- **e2e:** arrastrar rápido por el selector de color del pincel con la página
  ocupada no rompe la app (sin "Maximum update depth exceeded").
  - Para provocarlo hicieron falta commits lentos (un
    `__REACT_DEVTOOLS_GLOBAL_HOOK__` falso cuyo `onCommitFiberRoot` tarda
    ~8 ms) y eventos de ratón enviados por CDP cada 10 ms sin esperar a que se
    procese el anterior. Con `page.mouse` no se reproduce: espera a cada evento.
  - En la reproducción también era lento cada cambio del store (un Redux
    DevTools falso). Los e2e usan el build de producción, donde el store no
    conecta con DevTools: antes de darlo por bueno, comprobar que sin el
    arreglo el test falla.

## Los GIFs se mueven en el lienzo

- **e2e:** dos elementos con el mismo GIF se mueven los dos (comparten el
  decodificador y el canvas).
- **e2e:** con un video de fondo, el GIF se para cuando el video está en pausa
  y cambia de fotograma al mover la barra de tiempo.
- **e2e:** sin `ImageDecoder` (como en Safari; se simula borrándolo con
  `page.addInitScript`), el GIF se inserta quieto (solo se ve rojo) y no hay
  errores en la consola.
- **e2e:** un `.gif` dañado o un PNG renombrado a `.gif` muestra el aviso de
  error o se inserta quieto, y la app sigue funcionando.
- **e2e:** al volver al inicio con un GIF en el lienzo, la animación se para
  (sin `requestAnimationFrame` en marcha).

## La carga de imágenes vive en un solo sitio (`loadImageElement`)

- **e2e:** «Insertar una imagen» (menú «Más opciones» del modo Texto) la
  muestra en el lienzo, y la imagen exportada la incluye. Hoy ningún e2e
  inserta una imagen como elemento: solo hay un test unitario que comprueba
  que se abre el selector de archivos.
- **e2e:** insertar dos veces la misma imagen y una que no se puede leer (un
  archivo `.png` que no es una imagen): la segunda muestra el aviso de error y
  la app sigue funcionando.
