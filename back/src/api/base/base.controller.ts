import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { BaseService } from './base.service'
import { UpdateBaseDto } from './dto/update-base.dto'
import { VercelLogger } from 'src/common/nestConfig/logger'

@Controller('base')
export class BaseController {
  private readonly logger = new VercelLogger(BaseController.name)

  constructor(private readonly baseService: BaseService) {}

  @Get(':dbEnv')
  getClients(@Param('dbEnv') dbEnv: string) {
    this.logger.log('getClients', dbEnv)
    return this.baseService.getClients(dbEnv)
  }

  @Get(':dbEnv/:id')
  findClientConfig(@Param('dbEnv') dbEnv: string, @Param('id') id: string) {
    this.logger.log('findClientConfig', dbEnv, id)
    return this.baseService.findClientConfig(dbEnv, id)
  }

  @Patch(':dbEnv/:id')
  update(
    @Param('dbEnv') dbEnv: string,
    @Param('id') id: string,
    @Body() updateBaseDto: UpdateBaseDto,
  ) {
    this.logger.log('update', dbEnv, id)
    return this.baseService.update(dbEnv, id, updateBaseDto)
  }
}
