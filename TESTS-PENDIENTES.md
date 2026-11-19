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
