# Json-Editor

![](/front/public/app.webp)

## Ejecutar todo desde la raíz

Instala las dependencias una sola vez:

```bash
npm install
npm run install:all
```

Después, inicia el backend y el frontend con hot reload desde una sola consola:

```bash
npm run dev
```

`Ctrl+C` detiene ambos procesos. Para compilar ambos proyectos:

```bash
npm run build
```

## Back

```bash
npm install

npm run dev
# or
npm run build
npm run start
```

## Front

```bash
pnpm install

pnpm dev
# or
pnpm build
npm i -g serve
serve -s dist -l 4000
```

## Schemas de configuración Base

Los JSON Schema ubicados en `front/src/schemas` se descubren automáticamente
durante el build. Cada archivo se aplica a un atributo raíz de la configuración
Base, sin afectar el editor de datos de Clients.

El atributo se obtiene primero de la extensión incluida en el schema:

```json
{
  "x-config-attribute": "automated"
}
```

Si la extensión no existe, se deriva del nombre del archivo. Por ejemplo,
`automated-config.schema.json` se aplica al atributo `automated`. Si dos schemas
apuntan al mismo atributo o no se puede resolver un nombre válido, la aplicación
falla durante su inicialización para evitar una configuración ambigua.

Para agregar un nuevo contrato solamente se debe copiar su archivo
`*.schema.json` dentro de `front/src/schemas` y reconstruir el frontend.
