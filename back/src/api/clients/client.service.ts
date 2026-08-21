import { Injectable } from '@nestjs/common'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { DBClientService } from '../db/dbClient.service'

@Injectable()
export class ClientService {
  private readonly logger = new VercelLogger(ClientService.name)
  private dbClientService: DBClientService

  constructor() {}

  async findClientTableDatas(dbEnv: string, clientId: string, table: string) {
    this.logger.log('findClientConfig', dbEnv, clientId, table)

    this.dbClientService = new DBClientService(dbEnv, clientId)
    await this.dbClientService.init()

    const response = await this.dbClientService.getDatas(table)

    await this.dbClientService.destroy()
    return response
  }

  async updateDatas(
    dbEnv: string,
    clientId: string,
    table: string,
    attribute: string,
    id: string,
    expectedConfig: object | null,
    nextConfig: object | null,
  ) {
    this.logger.log('updateDatas', dbEnv, id)
    this.dbClientService = new DBClientService(dbEnv, clientId)
    await this.dbClientService.init()

    const response = await this.dbClientService.saveDatas(
      id,
      table,
      attribute,
      expectedConfig,
      nextConfig,
    )
    await this.dbClientService.destroy()
    return response
  }
}
