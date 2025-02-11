import { Injectable } from '@nestjs/common'
import { DBService } from '../db/db.service'
import { VercelLogger } from 'src/common/nestConfig/logger'

@Injectable()
export class BaseService {
  private readonly logger = new VercelLogger(BaseService.name)
  private dbService: DBService

  constructor() {}

  initDB(dbEnv: string) {
    this.logger.log('initDB', dbEnv)
    this.dbService = new DBService(dbEnv)
  }

  async getClients(dbEnv: string) {
    this.logger.log('getClients', dbEnv)

    this.dbService = new DBService(dbEnv)
    await this.dbService.init()

    const clients = await this.dbService.getClients()

    await this.dbService.destroy()
    return clients.map((client) => client.id)
  }

  async findClientConfig(dbEnv: string, id: string) {
    this.logger.log('findClientConfig', dbEnv, id)

    this.dbService = new DBService(dbEnv)
    await this.dbService.init()

    const config = await this.dbService.getClientConfig(id)

    await this.dbService.destroy()
    return config
  }

  async update(dbEnv: string, id: string, config: object) {
    this.logger.log('update', dbEnv, id)
    this.dbService = new DBService(dbEnv)
    await this.dbService.init()

    const data = await this.dbService.saveClientConfig(id, config)

    await this.dbService.destroy()
    return data
  }
}
