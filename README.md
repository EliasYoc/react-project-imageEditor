# Editor de imágenes

Editor de imágenes en el navegador: dibuja con pinceles, añade texto e imágenes y aplica fondos degradados.

Producción: https://editoryoc.netlify.app/

<img width="1264" alt="Captura de pantalla 2023-01-29 a la(s) 17 31 29" src="https://user-images.githubusercontent.com/64809211/215362310-aefbfe15-f129-4357-8af3-e5865edf8f15.png">

## Requisitos

- Node.js 24 LTS (la versión está en `.nvmrc`). Con nvm-windows:

  ```sh
  nvm install 24
  nvm use 24
  ```

## Scripts

| Comando                 | Qué hace                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| `npm install`           | Instala las dependencias                                             |
| `npm run dev`           | Servidor de desarrollo en http://localhost:5173                      |
| `npm run dev -- --host` | Igual, pero accesible desde el móvil en la misma red                 |
| `npm run build`         | Build de producción en `build/` (la carpeta que publica Netlify)     |
| `npm run preview`       | Sirve el build de producción para probarlo                           |
| `npm test`              | Tests con Vitest (modo watch; `npx vitest run` para una sola pasada) |
| `npm run lint`          | ESLint                                                               |
| `npm run format`        | Formatea el código con Prettier                                      |

## Stack

React 18 · Vite · Redux Toolkit · styled-components · Vitest + Testing Library · ESLint + Prettier
