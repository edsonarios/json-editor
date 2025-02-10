import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common'
import { BaseService } from './base.service'
import { UpdateBaseDto } from './dto/update-base.dto'

@Controller('base')
export class BaseController {
  constructor(private readonly baseService: BaseService) {}

  @Get()
  getClients() {
    return this.baseService.getClients()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.baseService.findClientConfig(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBaseDto: UpdateBaseDto) {
    return this.baseService.update(id, updateBaseDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.baseService.remove(+id)
  }
}
