import { Injectable } from '@nestjs/common'
import { DBService } from '../db/db.service'

@Injectable()
export class BaseService {
  constructor(private readonly dbService: DBService) {}

  async getClients() {
    const clients = await this.dbService.getClients()
    return clients.map((client) => client.id)
  }

  findClientConfig(id: string) {
    return this.dbService.getClientConfig(id)
  }

  update(id: string, config: object) {
    return this.dbService.saveClientConfig(id, config)
  }

  remove(id: number) {
    return `This action removes a #${id} base`
  }
}
