import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { spawn } from 'child_process'
import { readFile, stat, writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'

interface SchemaDefinition {
  attribute: string
  fileName: string
  id: string
  name: string
  path: string
}

@Injectable()
export class SchemaService {
  private readonly projectRoot = resolve(__dirname, '..', '..', '..', '..')
  private readonly schemas: Record<string, SchemaDefinition> = {
    automated: {
      id: 'automated',
      name: 'Automated config',
      attribute: 'automated',
      fileName: 'automated-config.schema.json',
      path: resolve(
        this.projectRoot,
        'front',
        'src',
        'schemas',
        'automated-config.schema.json',
      ),
    },
  }
  private isBuilding = false

  async listSchemas() {
    return Promise.all(
      Object.values(this.schemas).map(async (schema) => ({
        id: schema.id,
        name: schema.name,
        fileName: schema.fileName,
        updatedAt: (await stat(schema.path)).mtime.toISOString(),
      })),
    )
  }

  async getSchema(schemaId: string) {
    const schema = this.getDefinition(schemaId)
    const [content, fileStat] = await Promise.all([
      readFile(schema.path, 'utf8'),
      stat(schema.path),
    ])
    return {
      id: schema.id,
      name: schema.name,
      fileName: schema.fileName,
      content,
      updatedAt: fileStat.mtime.toISOString(),
    }
  }

  async updateSchema(schemaId: string, content: unknown) {
    if (this.isBuilding) {
      throw new ConflictException('Another schema update is already running')
    }
    if (typeof content !== 'string') {
      throw new BadRequestException('Schema content must be a JSON string')
    }

    const schema = this.getDefinition(schemaId)
    const parsedSchema = this.parseAndValidate(content, schema)
    const nextContent = `${JSON.stringify(parsedSchema, null, 2)}\n`
    const previousContent = await readFile(schema.path, 'utf8')

    this.isBuilding = true
    try {
      await writeFile(schema.path, nextContent, 'utf8')
      await this.buildFrontend()
      const fileStat = await stat(schema.path)
      return {
        message: `${schema.name} updated successfully`,
        updatedAt: fileStat.mtime.toISOString(),
        reloadRequired: true,
      }
    } catch (error) {
      await writeFile(schema.path, previousContent, 'utf8')
      try {
        await this.buildFrontend()
      } catch {
        // The original source schema is restored even if rebuilding the client fails.
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new InternalServerErrorException(
        `The schema was not updated because the frontend build failed: ${message}`,
      )
    } finally {
      this.isBuilding = false
    }
  }

  private getDefinition(schemaId: string) {
    const schema = this.schemas[schemaId]
    if (!schema) {
      throw new NotFoundException('Schema is not available for editing')
    }
    return schema
  }

  private parseAndValidate(content: string, schema: SchemaDefinition) {
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new BadRequestException('Schema must contain valid JSON')
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('Schema root must be an object')
    }
    const jsonSchema = parsed as Record<string, unknown>
    if (jsonSchema['x-config-attribute'] !== schema.attribute) {
      throw new BadRequestException(
        `x-config-attribute must be "${schema.attribute}"`,
      )
    }
    if (jsonSchema.$schema !== 'http://json-schema.org/draft-07/schema#') {
      throw new BadRequestException('Schema must use JSON Schema Draft 7')
    }
    this.rejectExternalReferences(jsonSchema)
    return jsonSchema
  }

  private rejectExternalReferences(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach((item) => this.rejectExternalReferences(item))
      return
    }
    if (!value || typeof value !== 'object') return

    for (const [key, child] of Object.entries(value)) {
      if (
        key === '$ref' &&
        typeof child === 'string' &&
        !child.startsWith('#/')
      ) {
        throw new BadRequestException(
          'Schema references must be internal and start with "#/"',
        )
      }
      this.rejectExternalReferences(child)
    }
  }

  private buildFrontend() {
    return new Promise<void>((resolvePromise, rejectPromise) => {
      const npmCommand = process.platform === 'win32' ? process.execPath : 'npm'
      const npmArguments =
        process.platform === 'win32'
          ? [
              process.env.npm_execpath ||
                resolve(
                  dirname(process.execPath),
                  'node_modules',
                  'npm',
                  'bin',
                  'npm-cli.js',
                ),
              'run',
              'build:front',
            ]
          : ['run', 'build:front']
      const child = spawn(npmCommand, npmArguments, {
        cwd: this.projectRoot,
        env: process.env,
        shell: false,
        windowsHide: true,
      })
      let output = ''
      child.stdout.on('data', (chunk) => {
        output = `${output}${String(chunk)}`.slice(-4000)
      })
      child.stderr.on('data', (chunk) => {
        output = `${output}${String(chunk)}`.slice(-4000)
      })
      child.on('error', rejectPromise)
      child.on('close', (code) => {
        if (code === 0) {
          resolvePromise()
          return
        }
        rejectPromise(
          new Error(output.trim() || `Build exited with code ${code}`),
        )
      })
    })
  }
}
