import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { BaseService } from './base.service'
import { UpdateBaseDto } from './dto/update-base.dto'
import { VercelLogger } from 'src/common/nestConfig/logger'

@Controller('base')
export class BaseController {
  private readonly logger = new VercelLogger(BaseController.name)

  constructor(private readonly baseService: BaseService) {}

  @Get()
  getClients() {
    this.logger.log('getClients')
    return this.baseService.getClients()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log('findOne')
    return this.baseService.findClientConfig(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBaseDto: UpdateBaseDto) {
    this.logger.log('update')
    return this.baseService.update(id, updateBaseDto)
  }
}
