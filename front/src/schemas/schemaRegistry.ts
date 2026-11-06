import type { Monaco } from '@monaco-editor/react'

export const BASE_CLIENT_CONFIG_MODEL_URI =
  'inmemory://model/base-client-config.json'
export const CLIENT_DATA_MODEL_URI = 'inmemory://model/client-table-data.json'

export const getBaseClientConfigModelUri = (workspaceId: string) =>
  `inmemory://model/base-client-config-${workspaceId}.json`

export const getClientDataModelUri = (workspaceId: string) =>
  `inmemory://model/client-table-data-${workspaceId}.json`

type JsonSchema = Record<string, unknown> & {
  'x-config-attribute'?: string
}

interface RegisteredSchema {
  attribute: string
  schema: JsonSchema
  uri: string
}

const schemaModules = import.meta.glob<JsonSchema>('./*.schema.json', {
  eager: true,
  import: 'default',
})

const getAttributeFromFileName = (filePath: string): string => {
  const fileName = filePath.split('/').at(-1) ?? ''
  return fileName.replace(/\.schema\.json$/i, '').replace(/-config$/i, '')
}

const getSchemaAttribute = (filePath: string, schema: JsonSchema): string => {
  const attribute =
    schema['x-config-attribute']?.trim() || getAttributeFromFileName(filePath)

  if (!attribute || !/^[A-Za-z_$][\w$]*$/.test(attribute)) {
    throw new Error(
      `Cannot resolve a valid config attribute for schema "${filePath}"`,
    )
  }

  return attribute
}

const registeredSchemas: RegisteredSchema[] = Object.entries(schemaModules).map(
  ([filePath, schema]) => {
    const attribute = getSchemaAttribute(filePath, schema)
    return {
      attribute,
      schema,
      uri: `inmemory://schemas/${attribute}.schema.json`,
    }
  },
)

const duplicatedAttributes = registeredSchemas
  .map(({ attribute }) => attribute)
  .filter((attribute, index, attributes) => {
    return attributes.indexOf(attribute) !== index
  })

if (duplicatedAttributes.length > 0) {
  throw new Error(
    `Multiple schemas target the same config attribute: ${[
      ...new Set(duplicatedAttributes),
    ].join(', ')}`,
  )
}

export function configureJsonSchemas(monaco: Monaco): void {
  const properties = Object.fromEntries(
    registeredSchemas.map(({ attribute, uri }) => [attribute, { $ref: uri }]),
  )

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    enableSchemaRequest: false,
    schemas: [
      ...registeredSchemas.map(({ uri, schema }) => ({ uri, schema })),
      {
        uri: 'inmemory://schemas/base-client-config.schema.json',
        fileMatch: [
          BASE_CLIENT_CONFIG_MODEL_URI,
          'inmemory://model/base-client-config-*.json',
        ],
        schema: {
          type: 'object',
          properties,
          additionalProperties: true,
        },
      },
    ],
  })
}
