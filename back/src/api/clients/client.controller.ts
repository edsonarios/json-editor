import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { ClientService } from './client.service'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { UpdateClientDto } from './entities/update.entity.dto'

@Controller('clients')
export class ClientController {
  private readonly logger = new VercelLogger(ClientController.name)

  constructor(private readonly clientService: ClientService) {}

  @Get(':dbEnv/:client/:table')
  findClientTableDatas(
    @Param('dbEnv') dbEnv: string,
    @Param('client') client: string,
    @Param('table') table: string,
  ) {
    this.logger.log('findClientTableDatas', dbEnv, client, table)
    return this.clientService.findClientTableDatas(dbEnv, client, table)
  }

  @Patch(':dbEnv/:client/:table/:attribute/:id')
  updateDatas(
    @Param('dbEnv') dbEnv: string,
    @Param('client') client: string,
    @Param('table') table: string,
    @Param('attribute') attribute: string,
    @Param('id') id: string,
    @Body() updateBaseDto: UpdateClientDto,
  ) {
    this.logger.log('updateDatas', dbEnv, client, table)
    return this.clientService.updateDatas(
      dbEnv,
      client,
      table,
      attribute,
      id,
      updateBaseDto.expected,
      updateBaseDto.next,
    )
  }
}
