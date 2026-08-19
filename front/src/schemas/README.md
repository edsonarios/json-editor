# Guía para incorporar JSON Schemas

Este directorio centraliza los contratos JSON que llegan desde otros
repositorios y que Monaco utiliza para validar y autocompletar atributos de la
configuración **Base** de un cliente.

Esta guía está escrita como contrato de trabajo para una IA o desarrollador.
Al incorporar un schema, sigue todas las reglas siguientes y no modifiques el
registro salvo que cambie la arquitectura general.

## Cómo funciona

`schemaRegistry.ts` descubre automáticamente todos los archivos que cumplan:

```text
*.schema.json
```

Cada archivo describe el **valor de un único atributo raíz** de la configuración
Base. Por ejemplo, `automated-config.schema.json` describe el objeto contenido
en:

```json
{
  "automated": {
    "activate": true,
    "files": []
  }
}
```

El schema debe describir solamente el contenido de `automated`; no debe volver
a envolverlo dentro de una propiedad `automated`. El registro construye ese
wrapper automáticamente y permite otros atributos Base mediante
`additionalProperties: true`.

Estos schemas no se aplican a la pestaña **Clients** ni a los JSON de tablas de
clientes.

## Contrato obligatorio

### 1. Declarar `x-config-attribute`

Todo schema nuevo debe incluir en su raíz:

```json
{
  "x-config-attribute": "automated"
}
```

El valor debe ser exactamente el nombre del atributo raíz al que pertenece el
schema. Debe ser un identificador válido, por ejemplo:

- `automated`
- `cron_config`
- `generate_indicators`
- `profiling_indicators`

No uses rutas como `config.automated`, nombres con espacios ni nombres con
guiones.

El registro conserva un fallback basado en el nombre del archivo por
compatibilidad, pero los schemas nuevos **no deben depender de ese fallback**.
`x-config-attribute` se considera obligatorio.

### 2. Ser autocontenido

El archivo copiado debe contener todas las definiciones necesarias. Se permiten
referencias internas como:

```json
{
  "$ref": "#/definitions/AutomatedConfig"
}
```

No se permiten referencias a archivos del repositorio de origen, rutas locales
ni URLs que deban descargarse:

```json
{
  "$ref": "../types/automated.json"
}
```

```json
{
  "$ref": "https://example.com/schema.json"
}
```

Monaco tiene deshabilitada la descarga remota de schemas. Copiar un archivo debe
ser suficiente para que funcione.

### 3. Usar JSON Schema Draft 7

Formato recomendado:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/MyConfig",
  "definitions": {
    "MyConfig": {
      "type": "object",
      "properties": {},
      "additionalProperties": false
    }
  },
  "x-config-attribute": "my_config"
}
```

El archivo debe ser JSON válido, sin comentarios, funciones, imports ni sintaxis
TypeScript.

### 4. No duplicar atributos

Solo puede existir un schema por `x-config-attribute`. Si dos archivos apuntan
al mismo atributo, el registro detiene la aplicación con un error para evitar
que Monaco aplique contratos ambiguos.

Cuando actualices un schema, reemplaza el archivo anterior. No conserves varias
versiones dentro de este directorio.

## Recomendaciones para generar schemas

El schema debería generarse desde los tipos del repositorio dueño del contrato,
en lugar de escribirse manualmente. El repositorio de origen continúa siendo la
fuente de verdad; la copia almacenada aquí es un artefacto generado.

El generador debe:

1. Partir del tipo principal del atributo, por ejemplo `AutomatedConfig`.
2. Resolver todos los tipos importados, enums, uniones y tipos recursivos.
3. Incluir todas las definiciones referenciadas dentro del mismo JSON.
4. Agregar `x-config-attribute` después de generar el schema.
5. Fallar si queda alguna referencia interna sin definición.
6. Producir siempre el mismo resultado cuando los tipos no cambiaron.

No edites manualmente el schema copiado para corregir diferencias con el tipo.
Corrige el tipo o el generador en el repositorio de origen, vuelve a generar y
reemplaza la copia.

## Criterios de modelado

- Usa `required` solamente para propiedades realmente obligatorias.
- Usa `additionalProperties: false` en objetos de estructura cerrada para
  detectar errores de escritura.
- En mapas con claves dinámicas, usa `additionalProperties` con el schema del
  valor esperado.
- Representa valores limitados mediante `enum` o `const` para habilitar el
  autocompletado.
- Representa variantes mediante `anyOf` o `oneOf`.
- Incluye `description` cuando una propiedad necesite contexto adicional en el
  autocompletado de Monaco.
- No marques el atributo raíz (`automated`, por ejemplo) como `required`: este
  archivo describe su valor y el registro se ocupa de asociarlo.

Ejemplo de mapa dinámico:

```json
{
  "type": "object",
  "additionalProperties": {
    "$ref": "#/definitions/FieldConfig"
  }
}
```

## Procedimiento manual para incorporar un schema

1. Genera el schema en el repositorio que define el contrato.
2. Confirma que contiene el `x-config-attribute` correcto.
3. Confirma que no contiene referencias externas ni rutas del repositorio.
4. Copia el archivo sin modificarlo a `front/src/schemas`.
5. Elimina cualquier versión anterior dirigida al mismo atributo.
6. Desde `front`, ejecuta:

```bash
npm run build
```

7. Abre la pestaña Base y verifica:
   - autocompletado de propiedades;
   - sugerencias de enums;
   - errores para tipos incorrectos;
   - ausencia de validaciones sobre otros atributos Base.

## Checklist para una IA

Antes de entregar una incorporación, confirma explícitamente:

- [ ] Solo se añadió o reemplazó el schema correspondiente.
- [ ] Existe `x-config-attribute` y coincide con el atributo Base real.
- [ ] El schema describe el valor del atributo, no el documento Base completo.
- [ ] Todas las referencias son internas y están resueltas.
- [ ] No existe otro schema para el mismo atributo.
- [ ] El archivo termina en `.schema.json`.
- [ ] El frontend compila con `npm run build`.
- [ ] No se modificó `schemaRegistry.ts` para registrar manualmente el archivo.

## Alcance actual

Monaco muestra autocompletado y diagnósticos, pero actualmente esos diagnósticos
no bloquean el botón **Save**. Tampoco existe todavía validación de estos schemas
en el backend. No asumas que un JSON guardado fue validado en servidor solamente
porque el schema aparece en el editor.
