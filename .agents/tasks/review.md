# Back NestJS sirve el front Vite en un solo puerto, con un comando y pm2

Este cambio convierte el monorepo (back NestJS 11 + front React/Vite 6) en algo que se compila y corre con un solo comando y, en producción, se sirve desde un único puerto: el back expone la API bajo el prefijo global `/api` y sirve el build del front (copiado a `back/client`) vía `ServeStaticModule`, con un `exclude` que deja pasar `/api` a los controladores. El front pasa a usar la ruta relativa `VITE_API_URL=/api`, con un proxy de Vite hacia `http://localhost:5000` para desarrollo. Se añaden scripts de orquestación cross-platform en el `package.json` raíz (concurrently + shx), un `ecosystem.config.cjs` de pm2 de un solo proceso, reglas de `.gitignore` para los artefactos de build, y un README en español que documenta instalación, dev, build, arranque en prod y el flujo de despliegue. Como parte de la migración a npm (decisión del usuario) se eliminó `front/pnpm-lock.yaml` y se añadió `front/.npmrc` con `legacy-peer-deps=true`.

Watch for: el `exclude: ['/api/{*splat}']` depende de la sintaxis de wildcard nombrado de Express 5 — verificado como correcto con Express 5.0.1 instalado y la evidencia HTTP del coder (confirmed). El `front/src/schemas/automated-config.schema.json` modificado pertenece a otra feature y el usuario decidió conservarlo aparte (confirmed, fuera de alcance pero acordado).

**Verdict**: APPROVED

## High-level view

El patrón back-sirve-front es correcto y está verificado de punta a punta. El prefijo global `/api` en `main.ts` y el `exclude: ['/api/{*splat}']` de `ServeStaticModule` son coherentes entre sí: la sintaxis de wildcard nombrado es la que exige path-to-regexp bajo Express 5 (instalado: express@5.0.1), y la evidencia del coder muestra que `/api/base/local` devuelve JSON del controlador (no el `index.html` del SPA), confirmando que el catch-all del SPA no se come la API.

El `rootPath: join(__dirname, '..', 'client')` resuelve a `back/client` en runtime porque el entry compilado vive en `back/dist/main.js` (`__dirname = back/dist`). El build raíz copia `front/dist` → `back/client` con shx, y la evidencia confirma que existen tanto `back/dist/main.js` como `back/client/index.html`.

El front mantiene intacta la construcción de URLs en `App.tsx` (`${API_URL}/base/...`); solo cambió el valor de la env a `/api`, de modo que las peticiones quedan como `/api/base/...` tanto en dev (proxy de Vite) como en prod (mismo origen). No se tocó `front/src/utils/utils.ts`.

Los scripts raíz son cross-platform: usan `shx rm/mkdir/cp` en lugar de comandos bash, lo que importa en el entorno Windows PowerShell del usuario. El arranque corre siempre con cwd `back/` (vía `npm --prefix back run start:prod` y `cwd: './back'` en pm2), que es lo que necesita `@nestjs/config` para cargar `back/.env`.

Hay dos elementos fuera del núcleo de la tarea presentes en el working tree: el schema JSON modificado (que el usuario decidió conservar aparte) y la migración de gestor de paquetes del front a npm (`front/.npmrc`, borrado del lock de pnpm), que es consecuencia directa de la decisión acordada de usar npm en todo.

<details>
<summary>Issues (2)</summary>

1. **`front/.npmrc` con legacy-peer-deps** — se añadió para resolver el conflicto de peer deps `cmdk@1.0.0` (pide react@^18) contra react@19 al migrar a npm; es un efecto colateral necesario y acordado, no bloqueante. Conviene que el usuario lo tenga presente al versionar.
2. **Schema fuera de alcance en el working tree** — `front/src/schemas/automated-config.schema.json` tiene cambios ajenos a esta tarea; el usuario decidió conservarlo. No bloqueante, solo a tener en cuenta al hacer commit para no mezclar features.

</details>

<details>
<summary>Details</summary>

### Prefijo `/api` y exclude de serve-static: la pieza crítica

El riesgo central del patrón back-sirve-front es que el catch-all del SPA capture las rutas de la API y devuelva `index.html` en lugar de pasar la petición a los controladores. Aquí se resuelve con dos piezas que deben estar alineadas: `app.setGlobalPrefix('api')` en `main.ts` (todas las rutas de Nest pasan a colgar de `/api`) y `exclude: ['/api/{*splat}']` en `ServeStaticModule.forRoot`.

La sintaxis `{*splat}` no es arbitraria: Nest 11 trae `@nestjs/platform-express@11.0.8` → `express@5.0.1`, y Express 5 usa una versión de path-to-regexp que exige wildcards nombrados (`{*splat}`), rechazando el `*` anónimo que funcionaba en Express 4. La evidencia HTTP del coder lo confirma de forma directa:

```
GET http://localhost:5000/           -> 200 text/html  (<!doctype html> ... SPA)
GET http://localhost:5000/api/base/local -> 200 application/json  (["AgHyundaiChile",...])
```

Que `/api/base/local` responda JSON del controlador `base` y no el HTML del SPA es la prueba de que el `exclude` deja pasar `/api` y que el server arranca sin error de path-to-regexp. Confirmed.

### rootPath y el `__dirname` en runtime

`rootPath: join(__dirname, '..', 'client')`. El entry compilado es `back/dist/main.js`, así que en runtime `__dirname = back/dist` y `..`/`client` resuelve a `back/client` — exactamente donde el `build` deja los estáticos. El `build` raíz hace `shx rm -rf back/client && shx mkdir -p back/client && shx cp -r front/dist/* back/client/`, y la evidencia confirma `back/client/index.html` junto a `assets/`. La respuesta 200 con HTML en `GET /` cierra la verificación. Confirmed.

### Front: solo cambia el valor de la env, no la construcción de URLs

`App.tsx` sigue armando las URLs como `` `${API_URL}/base/${selectedEnv}` ``, `` `${API_URL}/clients/...` ``, etc., y `front/src/utils/utils.ts` sigue siendo `export const API_URL = import.meta.env.VITE_API_URL`. Lo único que cambió es el valor: `VITE_API_URL=/api` en `front/.env` (presente en disco) y en `front/.env.example`. Con eso las peticiones quedan como `/api/base/...`:

```
dev:  front (Vite :5173) --/api/*--> proxy server.proxy --> http://localhost:5000/api/*
prod: front servido por el back --/api/*--> mismo origen :5000 --> controladores Nest
```

El proxy de Vite (`server.proxy['/api'] = { target: 'http://localhost:5000', changeOrigin: true }`) cubre el caso de desarrollo donde front y back corren en puertos distintos. No se tocó la forma de construir URLs, solo el valor de la env (confirmed).

### Scripts de orquestación cross-platform

El `package.json` raíz es privado y define `install:all`, `dev`, `build`, `start`/`start:prod`. El punto sensible para el entorno Windows PowerShell del usuario es que el `build` no use `cp`/`rm`/`mkdir` de bash:

```
build: npm --prefix front run build && npm --prefix back run build
       && shx rm -rf back/client && shx mkdir -p back/client && shx cp -r front/dist/* back/client/
```

Usa `shx` en los tres pasos de manipulación de archivos, con `shx` declarado en `devDependencies` junto a `concurrently`. Confirmed cross-platform. El `dev` usa `concurrently -n back,front -c blue,green "npm --prefix back run dev" "npm --prefix front run dev"`, ya sin la mezcla npm/pnpm que tenía el script anterior.

El arranque (`start` → `start:prod` → `npm --prefix back run start:prod`, que es `node dist/main`) corre con cwd efectivo `back/`, requisito para que `@nestjs/config` cargue `back/.env` (el `ConfigModule.forRoot` no define `envFilePath`, así que lee desde `process.cwd()`). pm2 replica esto con `cwd: './back'`. Confirmed coherente entre scripts y pm2.

### Migración a npm y schema fuera de alcance

Dos cosas en el working tree que no son el núcleo de la tarea pero están justificadas:

- La migración del front a npm (decisión del usuario "npm en todo"): se borró `front/pnpm-lock.yaml`, se generó `front/package-lock.json`, y se añadió `front/.npmrc` con `legacy-peer-deps=true`. Este `.npmrc` es necesario porque `cmdk@1.0.0` declara peer `react@^18` y el front usa react@19; pnpm toleraba el conflicto y npm no. No cambia dependencias de la app, solo hace reproducible el install bajo npm. Es un efecto colateral acordado, no bloqueante. (possible: conviene que el usuario sea consciente de que `legacy-peer-deps` silencia conflictos de peers también futuros.)
- `front/src/schemas/automated-config.schema.json` tiene 37 líneas añadidas ajenas a esta tarea; el usuario decidió explícitamente conservarlo para versionarlo con su feature. Fuera de alcance pero acordado (confirmed vía plan).

No se introdujeron operaciones de git, ni de base de datos, ni refactors colaterales. La única petición HTTP a `/api/base/local` fue una lectura contra un endpoint existente, no una operación de escritura.

</details>

<details>
<summary>Mapa de archivos</summary>

- `back/src/main.ts` — añade `app.setGlobalPrefix('api')`.
- `back/src/app.module.ts` — registra `ServeStaticModule.forRoot` con `rootPath` a `back/client` y `exclude: ['/api/{*splat}']`.
- `back/package.json` — añade `@nestjs/serve-static@^5.0.5` (5.x compatible con Nest 11 / CommonJS).
- `front/.env.example` — `VITE_API_URL` pasa a `/api` (ruta relativa).
- `front/vite.config.ts` — añade `server.proxy['/api']` hacia `http://localhost:5000`.
- `package.json` (raíz) — scripts `install:all`/`dev`/`build`/`start`/`start:prod` cross-platform; devDeps `concurrently` + `shx`.
- `ecosystem.config.cjs` (nuevo) — pm2 de un solo proceso (`dist/main.js`, cwd `./back`, PORT 5000).
- `.gitignore` — añade `node_modules/`, `back/dist/`, `front/dist/`, `back/client/`.
- `README.md` — reescrito en español (instalación, dev, build, prod, flujo de despliegue), conserva la sección de JSON Schema.
- `front/.npmrc` (nuevo), `front/package-lock.json` (nuevo), `front/pnpm-lock.yaml` (borrado) — migración del front a npm.
- `front/src/schemas/automated-config.schema.json` — cambios fuera de alcance, conservados por decisión del usuario.

Diff completo: `git diff main`.

</details>
