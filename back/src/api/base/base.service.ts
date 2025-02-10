import { Injectable } from '@nestjs/common'
import { DBService } from '../db/db.service'
import { VercelLogger } from 'src/common/nestConfig/logger'

@Injectable()
export class BaseService {
  private readonly logger = new VercelLogger(BaseService.name)

  constructor(private readonly dbService: DBService) {}

  async getClients() {
    this.logger.log('getClients')
    const clients = await this.dbService.getClients()
    return clients.map((client) => client.id)
  }

  findClientConfig(id: string) {
    this.logger.log('findClientConfig')
    return this.dbService.getClientConfig(id)
  }

  update(id: string, config: object) {
    this.logger.log('update', id)
    return this.dbService.saveClientConfig(id, config)
  }

  remove(id: number) {
    return `This action removes a #${id} base`
  }
}
