# Implementation Plan — Back sirve el Front, un solo comando y pm2

Objetivo: compilar y correr back (NestJS 11) + front (React+Vite 6) con un solo comando desde la raíz; en producción que el back sirva los estáticos del front en un solo puerto; correrlo con pm2 como un solo proceso; documentar todo en el README en español.

## Contexto confirmado durante la exploración

- NO existe `package.json` en la raíz (confirmado). El `README.md` actual ya menciona `install:all`, `dev`, `build` de raíz que no existen — hay que crearlos y corregir el README.
- Back: NestJS 11, CommonJS (`back/tsconfig.json` -> `"module": "commonjs"`), build `nest build` a `back/dist/` con entry `dist/main.js`. `back/src/main.ts` NO tiene `setGlobalPrefix`; escucha en `process.env.PORT || 5000`. Controladores `@Controller('base')` y `@Controller('clients')`.
- `back/src/app.module.ts` usa `ConfigModule.forRoot({ isGlobal: true })` SIN `envFilePath`. Por defecto `@nestjs/config` lee el `.env` desde `process.cwd()`. Implicación: si se arranca con `node back/dist/main` desde la raíz del repo, cwd = raíz y `back/.env` NO se cargaría. Por eso los scripts de arranque y pm2 deben usar cwd = `back/` (o `npm --prefix back run start:prod`), ver pasos 6 y 7.
- Front: React 19 + Vite 6. `front/src/utils/utils.ts` -> `API_URL = import.meta.env.VITE_API_URL`. `front/src/App.tsx` construye URLs como `` `${API_URL}/base/...` `` y `` `${API_URL}/clients/...` `` (confirmado por grep). NO existe `front/.env` (solo `front/.env.example` con `VITE_API_URL=http://localhost:5000`).
- Entorno Windows PowerShell: los scripts npm deben ser cross-platform (usar `shx`/`copyfiles`, NO `cp -r`/`rm -rf`/`mkdir -p`).

## Decisiones técnicas (y su razón)

- **Versión de `@nestjs/serve-static`: fijar `^5.0.0`.** La última mayor (12.x) es ESM puro y está alineada con Nest 12; este proyecto es Nest 11 + CommonJS, así que 5.x es la compatible. Rationale: evita romper el build/arranque CommonJS. Verificar en el paso 3 que la versión instalada resuelve y arranca; si npm instala una 12.x por peer ranges, fijar explícitamente `5.0.5`.
- **Prefijo `/api` global** en el back y **`VITE_API_URL=/api` (ruta relativa)** en el front. Rationale: una sola variable funciona en dev (Vite proxy) y prod (mismo origen), sin tocar cómo `App.tsx` arma las URLs.
- **Sintaxis de `exclude` de ServeStaticModule**: con Express v5 (Nest 11) los comodines deben ser nombrados. Probar primero `'/api/{*splat}'` y, como alternativa, `'/api/*splat'` y `'/api*'`; elegir la que arranque sin error de path-to-regexp y deje pasar `/api/...` a los controladores (verificación en el paso 8).
- **Un solo proceso pm2** apuntando a `back/dist/main.js` con `cwd: back/`. Rationale: el back ya sirve el front, así que basta un proceso.

---

- [ ] 1. Añadir el prefijo global `/api` en el back.
      En `back/src/main.ts`, tras crear la app y antes de `app.listen`, agregar `app.setGlobalPrefix('api')`. No tocar CORS ni body-parser.
      Files: back/src/main.ts
      Verify: `npm --prefix back run build` compila sin errores (genera `back/dist/main.js`).

- [ ] 2. Cambiar el front a ruta relativa `/api` y añadir el proxy de Vite para dev.
      Crear `front/.env` con `VITE_API_URL=/api` y `VITE_DB_ENVS=local,staging,prod`; actualizar `front/.env.example` a `VITE_API_URL=/api` (mantener `VITE_DB_ENVS`). En `front/vite.config.ts` añadir `server.proxy` con `'/api': { target: 'http://localhost:5000', changeOrigin: true }`. NO modificar `front/src/utils/utils.ts` ni cómo `App.tsx` construye las URLs (con `API_URL=/api`, `` `${API_URL}/base/...` `` produce `/api/base/...`, correcto).
      Files: front/.env (nuevo), front/.env.example, front/vite.config.ts
      Verify: `npm --prefix front run build` compila sin errores y genera `front/dist/`.

- [ ] 3. Instalar `@nestjs/serve-static` en el back fijando una versión compatible con Nest 11 (CommonJS).
      Ejecutar en `back/`: `npm install @nestjs/serve-static@^5.0.0`. Confirmar en `back/package.json` que la versión resuelta es 5.x (no 12.x ESM). Si npm resuelve 12.x, reinstalar con `npm install @nestjs/serve-static@5.0.5`.
      Files: back/package.json, back/package-lock.json
      Verify: `npm --prefix back ls @nestjs/serve-static` muestra una versión 5.x; `npm --prefix back run build` sigue compilando.

- [ ] 4. Registrar `ServeStaticModule` en el back para servir el front compilado.
      En `back/src/app.module.ts` importar `ServeStaticModule` de `@nestjs/serve-static` y `join` de `path`, y añadir a `imports` `ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client'), exclude: ['/api/{*splat}'] })`. `__dirname` en runtime es `back/dist`, por lo que `..`/`client` apunta a `back/client`. ServeStaticModule hace fallback a `index.html` para rutas del SPA por defecto. La sintaxis exacta de `exclude` se valida en el paso 8 (probar alternativas si falla el arranque).
      Files: back/src/app.module.ts
      Verify: `npm --prefix back run build` compila sin errores.

- [ ] 5. Añadir `back/client` y `back/dist` al `.gitignore`.
      En `.gitignore` de la raíz añadir `back/client/` y `back/dist/` (y `front/dist/` si no queda cubierto por el patrón genérico `dist`; el patrón actual `dist` ya cubre subcarpetas, pero añadir rutas explícitas para claridad). No borrar reglas existentes.
      Files: .gitignore
      Verify: `git status` no lista archivos dentro de `back/client/` ni `back/dist/` tras un build (paso 10).

- [ ] 6. Crear el `package.json` de la raíz con los scripts de orquestación.
      Crear `package.json` (privado) en la raíz con:
      - `install:all`: `npm install && npm --prefix back install && npm --prefix front install`
      - `dev`: `concurrently -n back,front -c blue,green "npm --prefix back run dev" "npm --prefix front run dev"`
      - `build`: `npm --prefix front run build && npm --prefix back run build && shx rm -rf back/client && shx mkdir -p back/client && shx cp -r front/dist/* back/client/`
      - `start` y `start:prod`: `npm --prefix back run start:prod` (así cwd efectivo del proceso Node es `back/` y `@nestjs/config` carga `back/.env`; `nest`/`node dist/main` corren con cwd `back/`).
      Añadir `devDependencies`: `concurrently` y `shx` (usar versiones estables actuales, p. ej. `concurrently@^9` y `shx@^0.3`). Usar SOLO comandos de `shx` (cross-platform), no `cp`/`rm`/`mkdir` de bash.
      Files: package.json (nuevo)
      Verify: `npm install` en la raíz instala `concurrently` y `shx` sin errores; `npm run build` (paso 10) copia `front/dist` a `back/client`.

- [ ] 7. Crear `ecosystem.config.cjs` para pm2 (un solo proceso).
      Crear en la raíz `ecosystem.config.cjs` (extensión `.cjs` porque la raíz podría quedar como módulo; `.cjs` garantiza CommonJS que pm2 lee) con un único app: `name: 'json-editor'`, `script: 'dist/main.js'`, `cwd: './back'` (para que `@nestjs/config` lea `back/.env` y las rutas relativas funcionen), `env: { PORT: 5000 }`. Rationale: el back ya sirve el front, basta un proceso.
      Files: ecosystem.config.cjs (nuevo)
      Verify: tras el build (paso 10), `pm2 start ecosystem.config.cjs` levanta el proceso en estado `online` (si pm2 está disponible); limpiar con `pm2 delete json-editor`. Si pm2 no está instalado en el entorno, documentar el comando y verificar solo que el arranque directo del paso 8 funciona.

- [ ] 8. Verificar el arranque del back compilado y la sintaxis de `exclude` (prueba manual del server).
      Depende de pasos 1-7 y de haber corrido el build (paso 10) para que exista `back/client`. Arrancar el back compilado en segundo plano en Windows PowerShell con cwd `back/` y `PORT=5000`:
      `Start-Process -NoNewWindow -FilePath node -ArgumentList "dist/main.js" -WorkingDirectory "d:\code\edev\json-editor\back"` (o `npm --prefix back run start:prod` en segundo plano).
      Si el arranque falla con un error de path-to-regexp por el `exclude`, cambiar en `back/src/app.module.ts` la sintaxis a la alternativa (`'/api/*splat'`, luego `'/api*'`), recompilar (`npm --prefix back run build`) y reintentar hasta que arranque sin error.
      Files: back/src/app.module.ts (solo si hay que ajustar la sintaxis de exclude)
      Verify: el proceso queda escuchando en el puerto 5000 sin excepción en consola.

- [ ] 9. Verificar las rutas HTTP contra el server en marcha (SPA + API).
      Con el back del paso 8 corriendo, desde PowerShell:
      - `Invoke-WebRequest -UseBasicParsing http://localhost:5000/` -> status 200 y contenido HTML del `index.html` del front (confirma que serve-static sirve el SPA desde `back/client`).
      - `Invoke-WebRequest -UseBasicParsing http://localhost:5000/api/base/local` -> la petición llega al controlador `base` (NO devuelve el `index.html`), confirmando que `/api` NO fue capturado por serve-static. Nota: puede devertir un error de conexión a DB si no hay `back/.env` con credenciales; lo relevante es que responda el controlador (p. ej. 500/400 de la app), no el HTML del SPA. No ejecutar operaciones de DB adicionales.
      Files: (ninguno)
      Verify: `/` devuelve HTML del front; `/api/base/local` es manejado por Nest (no HTML del SPA).

- [ ] 10. Ejecutar el build completo desde la raíz y confirmar el artefacto autocontenido.
      Depende de los pasos 1-6. Ejecutar en la raíz: `npm run install:all` (si faltan deps) y luego `npm run build`.
      Files: (genera back/dist y back/client)
      Verify: `npm run build` termina sin errores; existe `back/dist/main.js` y `back/client/index.html` (más assets). Este paso debe correrse ANTES de los pasos 8 y 9 (reordenar en ejecución: build primero, luego arranque y pruebas HTTP).

- [ ] 11. Limpiar los procesos de prueba.
      Detener el proceso Node arrancado en el paso 8 (`Get-Process node | Stop-Process` acotado al PID lanzado, o cerrar el `Start-Process`) y, si se usó pm2, `pm2 delete json-editor`. No dejar procesos escuchando en el puerto 5000.
      Files: (ninguno)
      Verify: `Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue` no devuelve nada (puerto libre).

- [ ] 12. Actualizar el `README.md` en español.
      Reescribir las secciones de ejecución para reflejar los scripts reales. Incluir:
      - Instalación: `npm run install:all` desde la raíz.
      - Desarrollo con un solo comando: `npm run dev` (explicar que el front corre en Vite y llama a `/api` vía proxy -> `http://localhost:5000`, y el back en el puerto 5000).
      - Build de producción: `npm run build` (compila front y back y copia `front/dist` dentro de `back/client` para que el back sea autocontenido).
      - Arranque en producción: `npm start` (un solo puerto, el back sirve el front) y pm2 con `pm2 start ecosystem.config.cjs`, más `pm2 reload json-editor` / `pm2 restart json-editor`.
      - Flujo para poner en prod tras un cambio: `git pull` -> `npm run install:all` (si cambiaron dependencias) -> `npm run build` -> `pm2 reload json-editor`.
      - Nota sobre variables de entorno: `back/.env` (copiar de `back/.env.example`) y que el proceso debe correr con cwd `back/` (ya resuelto por los scripts/pm2).
      MANTENER sin cambios la sección existente sobre los JSON Schema de `front/src/schemas` (no borrarla).
      Files: README.md
      Verify: lectura final del README: los comandos citados coinciden con los scripts de `package.json` (raíz) y con `ecosystem.config.cjs`; la sección de JSON Schema sigue presente.

## Evidencia de verificación (iteración de review)

Comandos ejecutados en Windows PowerShell desde la raíz y sus resultados:

- Entorno: `node v24.16.0`, `npm 11.13.0`, `pnpm 10.2.0`. Deps ya instaladas (`root`, `back`, `front` tienen `node_modules`).
- `npm --prefix back ls @nestjs/serve-static` → `@nestjs/serve-static@5.0.5` (versión 5.x compatible con Nest 11 / CommonJS, como pedía el plan).
- `npm run build` (raíz) → EXIT 0. Compila el front (`vite build` → `front/dist`, built in 2.16s) y el back (`nest build`), y copia `front/dist` a `back/client` con `shx`.
  - Artefactos confirmados: `back/dist/main.js` existe; `back/client/index.html` existe junto a `assets/`, `app.webp`, `icon.webp`.
- Arranque del back compilado en segundo plano (`Start-Process node dist/main.js` con cwd `back/` y `PORT=5000`): proceso vivo tras 5s.
- Pruebas HTTP contra el server en marcha:
  - `GET http://localhost:5000/` → **200**, `Content-Type: text/html; charset=utf-8`, cuerpo `<!doctype html> <html lang="en" class="dark">...` → sirve el `index.html` del SPA desde `back/client`. ✅
  - `GET http://localhost:5000/api/base/local` → **200**, `Content-Type: application/json; charset=utf-8`, cuerpo `["AgHyundaiChile","AG Hyundai Chile",...]` → la petición llega al controlador `base` de Nest y NO devuelve el HTML del SPA. Confirma que `exclude: ['/api/{*splat}']` deja pasar `/api` a los controladores. ✅ (El controlador respondió JSON; no se ejecutó ninguna operación de escritura en DB, fue una lectura HTTP contra el endpoint existente.)
- Limpieza: proceso Node detenido (`Stop-Process`), puerto 5000 sin listeners (`Get-NetTCPConnection -LocalPort 5000` → 0), archivos de log temporales eliminados.
- Scripts de orquestación: `npm ls concurrently shx` (raíz) → `concurrently@9.2.5` y `shx@0.4.0` instalados; el script `dev` usa `concurrently -n back,front ...` (bien formado).

### Resolución de findings del review (iteración 2)

- **Finding #1 (schema fuera de alcance):** por decisión del usuario (opción a) se DEJA `front/src/schemas/automated-config.schema.json` tal cual en el working tree; pertenece a otra feature y el usuario lo versiona aparte. No se tocó ni revirtió.
- **Finding #2 (gestor de paquetes):** decisión del usuario = npm en TODO. Acciones:
  - Se eliminó el lockfile huérfano `front/pnpm-lock.yaml`.
  - El `front/node_modules` existente era un store de pnpm (`.pnpm/`), lo que hacía fallar `npm install` (`Cannot read properties of null (reading 'matches')`). Se eliminó y se reinstaló con npm.
  - `npm install` del front chocaba con un conflicto de peer deps (`cmdk@1.0.0` pide `react@^18`, el front usa `react@19`), que pnpm toleraba. Para mantener "npm en todo" sin cambiar dependencias de la app, se añadió `front/.npmrc` con `legacy-peer-deps=true` (hace reproducible el install y el lockfile).
  - `npm run install:all` (raíz) → **EXIT 0**; se generaron `package-lock.json` en raíz, `back/` y `front/`.
- **Finding #3 (evidencia):** registrada en esta sección.
- **Finding #4 (README):** el flujo de prod usa `pm2 reload json-editor` (consistente con el resto de comandos pm2 del README).

### Re-verificación tras migrar el front a npm

- `npm run build` (raíz) → **EXIT 0**. `vite build` → `front/dist` (built in 5.52s); `nest build` → `back/dist`; `shx` copia a `back/client`. Artefactos confirmados: `back/dist/main.js` y `back/client/index.html`.
- Arranque del back compilado (cwd `back/`, `PORT=5000`) y pruebas HTTP:
  - `GET http://localhost:5000/` → **200** `text/html`, cuerpo `<!doctype html> <html lang="en" class="dark">...` (SPA). ✅
  - `GET http://localhost:5000/api/base/local` → **200** `application/json`, cuerpo `["AgHyundaiChile",...]` (llega al controlador Nest, no al SPA). ✅
- Limpieza: proceso detenido; se encontró un listener residual en :5000 (el PID real del listener difería del proceso lanzador) y se mató; `Get-NetTCPConnection -LocalPort 5000` → 0 listeners. Logs temporales eliminados.
- Nota de alcance: `front/README.md` (README del subproyecto front) aún menciona comandos pnpm, pero NO se tocó porque la tarea limita el trabajo de documentación al `README.md` de la raíz. Queda señalado por si el usuario quiere actualizarlo aparte.

## Notas y supuestos

- `@nestjs/config` carga `.env` desde `process.cwd()`; por eso todos los arranques (scripts y pm2) usan cwd = `back/`. Si se prefiriera arrancar desde la raíz, habría que añadir `envFilePath: join(process.cwd(), 'back/.env')` en `ConfigModule.forRoot`, pero NO se hace para no desviarse del enfoque pedido; se resuelve vía cwd.
- La prueba de `/api/base/local` puede fallar por falta de credenciales de DB; eso es esperado y aceptable: solo se valida el enrutamiento, nunca se ejecutan operaciones de DB.
- Restricciones respetadas: no se harán commits/push/ramas; no se tocan ni ejecutan operaciones de DB; solo lo pedido, sin refactors ni cambios de lint/formato colaterales; scripts cross-platform para Windows PowerShell.
