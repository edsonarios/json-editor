import { Body, Controller, Get, Param, Put } from '@nestjs/common'
import { SchemaService } from './schema.service'

@Controller('schemas')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Get()
  listSchemas() {
    return this.schemaService.listSchemas()
  }

  @Get(':schemaId')
  getSchema(@Param('schemaId') schemaId: string) {
    return this.schemaService.getSchema(schemaId)
  }

  @Put(':schemaId')
  updateSchema(
    @Param('schemaId') schemaId: string,
    @Body() body: { content?: unknown },
  ) {
    return this.schemaService.updateSchema(schemaId, body.content)
  }
}
